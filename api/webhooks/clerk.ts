import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Webhook } from 'svix';
import { prisma } from '../_utils/db';

// Required by Vercel for parsing raw body in webhooks
export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable: NodeJS.ReadableStream) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!SIGNING_SECRET) {
    return res.status(500).json({ error: 'Missing webhook secret' });
  }

  const payload = await buffer(req);
  const headers = req.headers as Record<string, string>;
  const wh = new Webhook(SIGNING_SECRET);

  let evt: any;
  try {
    evt = wh.verify(payload, headers);
  } catch (err: any) {
    console.error('Webhook verification failed', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const { id } = evt.data;
  const eventType = evt.type;

  if (eventType === 'user.created') {
    const email = evt.data.email_addresses?.[0]?.email_address;
    const firstName = evt.data.first_name || '';
    const lastName = evt.data.last_name || '';

    try {
      await prisma.user.create({
        data: {
          clerkId: id,
          email: email || '',
          firstName,
          lastName,
          role: 'USER', 
          status: 'ACTIVE',
        },
      });
      console.log(`Auto-created new user: ${email} with restricted permissions via Vercel Webhook`);
    } catch(err) {
      console.error('Failed to create user in webhook:', err);
    }
  }

  return res.status(200).json({ success: true });
}
