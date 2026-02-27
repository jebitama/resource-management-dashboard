import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClerkClient } from '@clerk/backend';
import { prisma } from './db';

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
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
      const verified = await clerkClient.verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY
      });

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
             status: 'ACTIVE',
           }
         });
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        res.status(403).json({ error: `Forbidden. Request requires one of the following roles: ${allowedRoles.join(', ')}` });
        return null; // Stop execution
      }

      return user; // Passes RBAC check, returns the DB user
    } catch(err) {
      console.error(err);
      res.status(500).json({ error: 'Internal RBAC error' });
      return null;
    }
  };
};
