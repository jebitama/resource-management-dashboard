import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyRateLimit } from '../../../_utils/ratelimit';
import { requireAuthRole } from '../../../_utils/auth';
import { prisma } from '../../../_utils/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!(await applyRateLimit(req, res, 'writeAccess'))) return;

  const dbUser = await requireAuthRole(['ADMIN', 'SUPERADMIN'])(req, res);
  if (!dbUser) return;

  const { id } = req.query;

  try {
    const requestId = Array.isArray(id) ? id[0] : id;
    const request = await prisma.accessRequest.findUnique({ where: { id: requestId }});
    
    if (!request) return res.status(404).json({ error: 'Request not found' });

    const updatedRequest = await prisma.accessRequest.update({
      where: { id: requestId },
      data: { status: 'APPROVED' }
    });

    if (updatedRequest.resource === 'ROLE_UPGRADE_ADMIN' && dbUser.role === 'SUPERADMIN') {
      await prisma.user.update({
        where: { id: updatedRequest.userId },
        data: { role: 'ADMIN' }
      });
    }

    return res.status(200).json({ message: 'Request approved successfully', updatedRequest });
  } catch (error) {
    console.error('Failed to approve request:', error);
    return res.status(500).json({ error: 'Internal server error while approving request' });
  }
}
