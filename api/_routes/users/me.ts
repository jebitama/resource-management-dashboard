import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyRateLimit } from '../../_utils/ratelimit';
import { requireAuthRole } from '../../_utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!(await applyRateLimit(req, res, 'authAccess'))) return;

  const user = await requireAuthRole([])(req, res);
  if (!user) return; // Error handled inside rule

  return res.status(200).json(user);
}
