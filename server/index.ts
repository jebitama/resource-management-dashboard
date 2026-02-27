import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { requireAuth } from '@clerk/express';
import { Webhook } from 'svix';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// ==========================================================================
// Upstash Redis & Ratelimit Configuration
// ==========================================================================
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || 'https://mock.upstash.io',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || 'mock-token',
});

// Configure sliding window rate limit: 10 requests per minute per IP
const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
});

app.use(cors());

// ==========================================================================
// Clerk Webhooks — Auto-Create Users
// ==========================================================================
// Requires raw body buffer to securely verify Svix signatures
app.post('/api/webhooks/clerk', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!SIGNING_SECRET) {
    return res.status(500).json({ error: 'Missing webhook secret' });
  }

  const payload = req.body;
  const headers = req.headers;
  const wh = new Webhook(SIGNING_SECRET);

  let evt: any;
  try {
    evt = wh.verify(payload, headers as Record<string, string>);
  } catch (err: any) {
    console.error('Webhook verification failed', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const { id } = evt.data;
  const eventType = evt.type;

  if (eventType === 'user.created') {
    const email = evt.data.email_addresses?.[0]?.email_address;
    const firstName = evt.data.first_name || '';
    const lastName = evt.data.last_name || '';

    // Create user with highly restricted "USER" role
    await prisma.user.create({
      data: {
        clerkId: id,
        email: email || '',
        firstName,
        lastName,
        role: 'USER', 
        status: 'ACTIVE',
      },
    });
    console.log(`Auto-created new user: ${email} with restricted permissions`);
  }

  res.status(200).json({ success: true });
});

// Use standard JSON body parser for normal API endpoints
app.use(express.json());

// ==========================================================================
// Rate Limiting Middleware
// ==========================================================================
const rateLimitMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Skip rate limiting if no Upstash credentials are provided (development fallback)
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    return next();
  }

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  try {
    const { success, limit, remaining, reset } = await rateLimiter.limit(`ratelimit_${ip}`);
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', reset);

    if (!success) {
      return res.status(429).json({ error: 'Rate limit exceeded. Too many requests to the enterprise API.' });
    }
    next();
  } catch (err) {
    console.error('Upstash rate limit error:', err);
    next(); // Fail open if Redis drops connection
  }
};

app.use('/api', rateLimitMiddleware);

// ==========================================================================
// Authentication & RBAC Middleware
// ==========================================================================
const checkRole = (allowedRoles: string[]) => {
  return async (req: any, res: any, next: any) => {
    try {
      const auth = req.auth;
      if (!auth || !auth.userId) return res.status(401).json({ error: 'Unauthorized credentials' });

      let user = await prisma.user.findUnique({ where: { clerkId: auth.userId } });

      // Fallback auto-creation if the clerk webhook failed or wasn't set up locally
      if (!user) {
         user = await prisma.user.create({
           data: {
             clerkId: auth.userId,
             email: auth.userId + '@fallback.io',
             role: 'USER',
             status: 'ACTIVE',
           }
         });
      }

      req.dbUser = user;

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ error: `Forbidden. Request requires one of the following roles: ${allowedRoles.join(', ')}` });
      }
      
      next();
    } catch(err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal RBAC error' });
    }
  };
};

// ==========================================================================
// API Endpoints
// ==========================================================================

/**
 * Identify Current User (Standard Route)
 * Returns the mapped RBAC role and profile
 */
app.get('/api/users/me', requireAuth(), async (req: any, res: any) => {
  const user = await prisma.user.findUnique({ where: { clerkId: req.auth.userId } });
  if (!user) {
    // Failsafe auto-registration
    const createdUser = await prisma.user.create({
      data: {
        clerkId: req.auth.userId,
        email: req.auth.userId + '@auto-registered.io',
        role: 'USER',
        status: 'ACTIVE'
      }
    });
    return res.json(createdUser);
  }
  res.json(user);
});

/**
 * Access Request Lifecycle
 * A restricted 'USER' can petition 'ADMIN's for elevated subsystem access
 */
app.post('/api/access-requests', requireAuth(), checkRole(['USER', 'ADMIN', 'SUPERADMIN']), async (req: any, res: any) => {
  const { resource, reason } = req.body;
  const request = await prisma.accessRequest.create({
    data: {
      userId: req.dbUser.id,
      resource,
      reason,
      status: 'PENDING'
    }
  });
  res.json({ message: 'Access request securely recorded. Pending admin approval.', data: request });
});

/**
 * Admin: Retrieve all pending access requests
 */
app.get('/api/admin/access-requests', requireAuth(), checkRole(['ADMIN', 'SUPERADMIN']), async (req: any, res: any) => {
  const requests = await prisma.accessRequest.findMany({
    where: { status: 'PENDING' },
    include: {
      user: {
        select: { email: true, firstName: true, role: true }
      }
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(requests);
});

/**
 * Admin: Approve specific access requests and mutate user's RBAC scope where necessary
 */
app.post('/api/admin/access-requests/:id/approve', requireAuth(), checkRole(['ADMIN', 'SUPERADMIN']), async (req: any, res: any) => {
  const requestId = req.params.id;
  const request = await prisma.accessRequest.findUnique({ where: { id: requestId }});
  
  if (!request) return res.status(404).json({ error: 'Request not found' });

  const updatedRequest = await prisma.accessRequest.update({
    where: { id: requestId },
    data: { status: 'APPROVED' }
  });

  // Example privilege escalation trigger logic based on resource requested
  if (updatedRequest.resource === 'ROLE_UPGRADE_ADMIN' && req.dbUser.role === 'SUPERADMIN') {
    await prisma.user.update({
      where: { id: updatedRequest.userId },
      data: { role: 'ADMIN' }
    });
  }

  res.json({ message: 'Request approved successfully', updatedRequest });
});

/**
 * Super Admin: Complete RBAC User Directory Control
 */
app.get('/api/admin/users', requireAuth(), checkRole(['ADMIN', 'SUPERADMIN']), async (req: any, res: any) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  });
  res.json(users);
});

app.put('/api/admin/users/:id/role', requireAuth(), checkRole(['SUPERADMIN']), async (req: any, res: any) => {
  const { role } = req.body;
  const updatedUser = await prisma.user.update({
    where: { id: req.params.id },
    data: { role }
  });
  res.json({ message: `User role escalated to ${role}`, updatedUser });
});

// ==========================================================================
// Upstash QStash — Background Job Demonstration
// ==========================================================================
/**
 * Triggers a heavy asynchronous workload (e.g., generating end-of-month resource SLA reports)
 * Relies on Upstash QStash message broker to retry and deliver webhooks asynchronously.
 */
app.post('/api/jobs/trigger-report', requireAuth(), checkRole(['ADMIN', 'SUPERADMIN']), async (req: any, res: any) => {
  const UPSTASH_QSTASH_TOKEN = process.env.UPSTASH_QSTASH_TOKEN;
  
  if (!UPSTASH_QSTASH_TOKEN) {
    return res.status(503).json({ 
      error: 'Upstash QStash token is missing. In production, this call triggers a fully decoupled background queue workload.',
      simulatedSuccess: true
    });
  }

  try {
    const response = await fetch(`https://qstash.upstash.io/v2/publish/https://your-domain.com/api/webhooks/qstash-report`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UPSTASH_QSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requestedBy: req.dbUser.id, type: 'MONTHLY_RESOURCE_SLA_REPORT' })
    });
    
    if (!response.ok) throw new Error('QStash trigger failed');

    const data = await response.json();
    res.json({ message: 'Background report job scheduled successfully via Upstash QStash', jobDetails: data });
  } catch (error) {
    console.error('QStash Error:', error);
    res.status(500).json({ error: 'Failed to schedule QStash background job' });
  }
});

/**
 * QStash target webhook endpoint — The function that actually does the heavy lifting
 */
app.post('/api/webhooks/qstash-report', async (req: any, res: any) => {
  // Production would verify the Upstash-Signature header here.
  const { requestedBy, type } = req.body;
  console.log(`[BACKGROUND WORKER] QStash triggered background job execution for report ${type} requested by user ID ${requestedBy}. Generating complex aggregate report...`);
  
  // Simulate heavy processing
  setTimeout(() => {
    console.log(`[BACKGROUND WORKER] QStash Job Complete`);
  }, 5000);

  res.status(200).json({ success: true });
});

app.listen(PORT, () => {
  console.log(`[System Initialization Complete] Enterprise API running natively on port ${PORT}`);
});
