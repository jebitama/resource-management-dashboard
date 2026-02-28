import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyRateLimit } from '../../_utils/ratelimit';
import { requireAuthRole } from '../../_utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!(await applyRateLimit(req, res, 'readAccess'))) return;

  const user = await requireAuthRole(['ADMIN', 'SUPERADMIN'])(req, res);
  if (!user) return;

  const token = process.env.QSTASH_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'QStash token not configured' });
  }

  try {
    // Fetch recent events from QStash API
    // Documentation: https://upstash.com/docs/qstash/api/events/list
    const response = await fetch('https://qstash.upstash.io/v2/events', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
        throw new Error(`Upstash API responded with ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching QStash logs:', error);
    return res.status(500).json({ error: 'Failed to fetch queue logs' });
  }
}
