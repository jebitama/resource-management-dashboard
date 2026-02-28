import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { prisma } from './db';

let _clerkClient: any = null;

const getClerkClient = () => {
  if (_clerkClient) return _clerkClient;
  _clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY || '',
    publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY || '',
  });
  return _clerkClient;
};

export const requireAuthRole = (allowedRoles: string[]) => {
  return async (req: VercelRequest, res: VercelResponse) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized credentials' });
        return null;
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        res.status(401).json({ error: 'Unauthorized: Missing token' });
        return null;
      }
      
      let verified;
      try {
        const options: any = { secretKey: process.env.CLERK_SECRET_KEY || '' };
        if (process.env.CLERK_JWT_KEY && process.env.CLERK_JWT_KEY.startsWith('-----BEGIN')) {
          options.jwtKey = process.env.CLERK_JWT_KEY;
        }
        verified = await verifyToken(token, options);
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
         // Fetch full user details from Clerk to populate local DB correctly
         const clerk = getClerkClient();
         const clerkUser = await clerk.users.getUser(userId);
         
         user = await prisma.user.create({
           data: {
             clerkId: userId,
             email: clerkUser.emailAddresses[0]?.emailAddress || `${userId}@fallback.io`,
             firstName: clerkUser.firstName || '',
             lastName: clerkUser.lastName || '',
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
