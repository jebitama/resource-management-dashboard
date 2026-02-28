import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyRateLimit } from '../../_utils/ratelimit';
import { requireAuthRole } from '../../_utils/auth';
import { prisma } from '../../_utils/db';
import { Prisma } from '@prisma/client';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!(await applyRateLimit(req, res, 'readAccess'))) return;

  const user = await requireAuthRole(['USER', 'ADMIN', 'SUPERADMIN'])(req, res);
  if (!user) return;

  const cursor = req.query.cursor as string | undefined;
  const limit = parseInt(req.query.limit as string) || 50;

  try {
    const take = limit + 1; // Fetch one extra to know if there's a next page
    const query: Prisma.ResourceFindManyArgs = {
      take,
      orderBy: { id: 'asc' }, // Explicit order for consistent cursors
    };

    if (cursor && cursor !== 'null') {
      query.cursor = { id: cursor };
      query.skip = 1; // Skip the cursor itself
    }

    const resources = await prisma.resource.findMany(query);

    let nextCursor: string | null = null;
    let data = resources;
    
    if (resources.length === take) {
      const nextItem = resources.pop(); // Remove the extra item
      if (nextItem) {
        nextCursor = nextItem.id;
      }
    }

    // Optional: get exact total count (could be slow on massive tables, but okay for 10k)
    // For extreme scale, we might cache this or estimated it.
    const totalCount = await prisma.resource.count();

    const responseData = {
      data,
      nextCursor,
      totalCount,
      hasMore: nextCursor !== null,
    };

    return res.status(200).json(responseData);
  } catch (error: any) {
    console.error('Error fetching paginated resources:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch resources',
      details: error?.message || 'Unknown error'
    });
  }
}
