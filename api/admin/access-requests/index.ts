import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyRateLimit } from '../../_utils/ratelimit';
import { requireAuthRole } from '../../_utils/auth';
import { prisma } from '../../_utils/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!(await applyRateLimit(req, res))) return;

  const user = await requireAuthRole(['ADMIN', 'SUPERADMIN'])(req, res);
  if (!user) return;

  try {
    const requests = await prisma.accessRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        user: { select: { email: true, firstName: true, role: true } }
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json(requests);
  } catch (error) {
    console.error('Failed to get access requests:', error);
    return res.status(500).json({ error: 'Failed to retrieve access requests' });
  }
}
