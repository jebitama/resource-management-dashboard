import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Receiver } from '@upstash/qstash';

export const config = {
  api: {
    bodyParser: false,
  },
};

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY || '',
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || '',
});

async function buffer(readable: NodeJS.ReadableStream) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // 1. Verify QStash Signature locally since we map via Serverless (Vercel raw Node mapping)
  const signature = req.headers['upstash-signature'] as string;
  if (!signature) {
    return res.status(400).json({ error: 'Missing Upstash signature' });
  }

  const rawBody = await buffer(req);

  try {
    const isValid = await receiver.verify({
      signature,
      body: rawBody.toString('utf-8'),
    });
    if (!isValid) throw new Error('Signature mismatch');
  } catch (error) {
    console.error('QStash signature verification failed', error);
    return res.status(401).json({ error: 'Invalid QStash Signature' });
  }

  // 2. Parse body now that it's verified securely
  let payload;
  try {
    payload = JSON.parse(rawBody.toString('utf-8'));
  } catch(e) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const { requestedBy, type } = payload;
  console.log(`[BACKGROUND WORKER] QStash triggered background job execution for report ${type} requested by ID ${requestedBy}. Generating complex aggregate report...`);
  
  // Simulated heavy processing up to function timeout limits
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log(`[BACKGROUND WORKER] QStash Job Complete for req ${requestedBy}`);

  return res.status(200).json({ success: true });
}
