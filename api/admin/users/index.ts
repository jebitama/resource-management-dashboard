import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyRateLimit } from '../../_utils/ratelimit';
import { requireAuthRole } from '../../_utils/auth';
import { prisma } from '../../_utils/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!(await applyRateLimit(req, res))) return;

  const dbUser = await requireAuthRole(['ADMIN', 'SUPERADMIN'])(req, res);
  if (!dbUser) return;

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Failed to find users' });
  }
}
