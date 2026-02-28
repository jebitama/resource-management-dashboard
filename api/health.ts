import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await import('./_utils/db');
  } catch (err: any) {
    return res.status(500).json({ error: 'Prisma DB crash', message: err.message, stack: err.stack });
  }

  try {
    await import('./_utils/auth');
  } catch (err: any) {
    return res.status(500).json({ error: 'Clerk Auth crash', message: err.message, stack: err.stack });
  }

  try {
    await import('./_utils/ratelimit');
  } catch (err: any) {
    return res.status(500).json({ error: 'Upstash Redis crash', message: err.message, stack: err.stack });
  }

  return res.status(200).json({ status: 'ok', message: 'All dependencies imported successfully without crashing.' });
}
