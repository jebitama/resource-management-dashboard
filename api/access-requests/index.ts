import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyRateLimit } from '../_utils/ratelimit';
import { requireAuthRole } from '../_utils/auth';
import { prisma } from '../_utils/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!(await applyRateLimit(req, res, 'writeAccess'))) return;

  const user = await requireAuthRole(['USER', 'ADMIN', 'SUPERADMIN'])(req, res);
  if (!user) return; 

  const { resource, reason } = req.body;
  
  try {
    const request = await prisma.accessRequest.create({
      data: {
        userId: user.id,
        resource: resource || 'UNKNOWN',
        reason: reason || '',
        status: 'PENDING'
      }
    });
    return res.status(200).json({ message: 'Access request securely recorded. Pending admin approval.', data: request });
  } catch (error) {
    console.error('Error creating access request:', error);
    return res.status(500).json({ error: 'Failed to create access request' });
  }
}
