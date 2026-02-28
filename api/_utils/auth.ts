import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { prisma } from './db';

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY, // This might be missing
  publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY
});

export const requireAuthRole = (allowedRoles: string[]) => {
  return async (req: VercelRequest, res: VercelResponse) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized credentials' });
        return null;
      }

      const token = authHeader.split(' ')[1];
      
      let verified;
      try {
        verified = await verifyToken(token, {
          secretKey: process.env.CLERK_SECRET_KEY, // Will fallback to JWKS if undefined
          jwtKey: process.env.CLERK_JWT_KEY, // Optional, typically provided in dashboard 
        });
      } catch (verifyErr: any) {
        console.warn('Token verification failed:', verifyErr?.message || verifyErr);
        res.status(401).json({ error: 'Invalid or expired authentication token.' });
        return null;
      }

      const userId = verified.sub;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized credentials' });
        return null;
      }

      let user = await prisma.user.findUnique({ where: { clerkId: userId } });
      if (!user) {
         user = await prisma.user.create({
           data: {
             clerkId: userId,
             email: userId + '@fallback.io',
             role: 'USER',
             status: 'PENDING',
           }
         });
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        res.status(403).json({ error: `Forbidden. Request requires one of the following roles: ${allowedRoles.join(', ')}` });
        return null; // Stop execution
      }

      return user; // Passes RBAC check, returns the DB user
    } catch(err: any) {
      console.error('RBAC Middleware Error:', err?.message || err);
      // Failsafe 500 error, mostly triggers if database crashes internally
      res.status(500).json({ 
        error: 'Internal system error processing RBAC authorization',
        details: err?.message || 'Unknown error'
      });
      return null;
    }
  };
};
