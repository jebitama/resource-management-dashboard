import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyRateLimit } from '../../../../_utils/ratelimit';
import { requireAuthRole } from '../../../../_utils/auth';
import { prisma } from '../../../../_utils/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });
  if (!(await applyRateLimit(req, res, 'writeAccess'))) return;

  const dbUser = await requireAuthRole(['SUPERADMIN'])(req, res);
  if (!dbUser) return;

  const { id } = req.query;
  const { role } = req.body || {};

  try {
    const userId = Array.isArray(id) ? id[0] : id;
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: role as string }
    });
    return res.status(200).json({ message: `User role escalated to ${role}`, updatedUser });
  } catch (error) {
    console.error('Error changing role:', error);
    return res.status(500).json({ error: 'Failed to alter user role' });
  }
}
