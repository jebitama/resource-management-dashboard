import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // In production, verify the Upstash-Signature header using @upstash/qstash
  const { requestedBy, type } = req.body || {};
  console.log(`[BACKGROUND WORKER] QStash triggered background job execution for report ${type} requested by user ID ${requestedBy}. Generating complex aggregate report...`);
  
  // Simulated heavy processing (in serverless, this must complete within function timeout, typically 10s or 60s)
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log(`[BACKGROUND WORKER] QStash Job Complete for req ${requestedBy}`);

  return res.status(200).json({ success: true });
}
