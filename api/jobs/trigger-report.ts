import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyRateLimit } from '../_utils/ratelimit';
import { requireAuthRole } from '../_utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!(await applyRateLimit(req, res, 'jobAccess'))) return;

  const dbUser = await requireAuthRole(['ADMIN', 'SUPERADMIN'])(req, res);
  if (!dbUser) return;

  const UPSTASH_QSTASH_TOKEN = process.env.UPSTASH_QSTASH_TOKEN;
  
  if (!UPSTASH_QSTASH_TOKEN) {
    return res.status(503).json({ 
      error: 'Upstash QStash token is missing. In production, this call triggers a fully decoupled background queue workload.',
      simulatedSuccess: true
    });
  }

  try {
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const webhookUrl = `${protocol}://${host}/api/webhooks/qstash-report`;

    const response = await fetch(`https://qstash.upstash.io/v2/publish/${webhookUrl}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UPSTASH_QSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requestedBy: dbUser.id, type: 'MONTHLY_RESOURCE_SLA_REPORT' })
    });
    
    if (!response.ok) throw new Error('QStash trigger failed');

    const data = await response.json();
    return res.status(200).json({ message: 'Background report job scheduled successfully via Upstash QStash', jobDetails: data });
  } catch (error) {
    console.error('QStash Error:', error);
    return res.status(500).json({ error: 'Failed to schedule QStash background job' });
  }
}
