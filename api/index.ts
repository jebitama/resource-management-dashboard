import type { VercelRequest, VercelResponse } from '@vercel/node';

import usersMe from './_routes/users/me';
import resourcesList from './_routes/resources/list';
import accessRequestsIndex from './_routes/access-requests/index';
import adminAccessRequestsIndex from './_routes/admin/access-requests/index';
import adminAccessRequestsApprove from './_routes/admin/access-requests/[id]/approve';
import adminUsersIndex from './_routes/admin/users/index';
import adminUsersRole from './_routes/admin/users/[id]/role';
import queueLogs from './_routes/queue/logs';
import jobsNotifyAdmin from './_routes/jobs/notify-admin';
import jobsTriggerReport from './_routes/jobs/trigger-report';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = req.url?.split('?')[0] || '';

  // Exact Matches
  if (req.method === 'GET' && url === '/api/users/me') return usersMe(req, res);
  if (req.method === 'GET' && url === '/api/resources/list') return resourcesList(req, res);
  if (req.method === 'GET' && url === '/api/access-requests') return accessRequestsIndex(req, res);
  if (req.method === 'GET' && url === '/api/admin/access-requests') return adminAccessRequestsIndex(req, res);
  if (req.method === 'GET' && url === '/api/admin/users') return adminUsersIndex(req, res);
  if (req.method === 'GET' && url === '/api/queue/logs') return queueLogs(req, res);
  
  // Job Endpoints
  if (req.method === 'POST' && url === '/api/jobs/notify-admin') return jobsNotifyAdmin(req, res);
  if (req.method === 'POST' && url === '/api/jobs/trigger-report') return jobsTriggerReport(req, res);

  // Dynamic Matches
  const adminAccessApproveMatch = url.match(/^\/api\/admin\/access-requests\/([^/]+)\/approve$/);
  if (req.method === 'POST' && adminAccessApproveMatch) {
    req.query.id = adminAccessApproveMatch[1] as string;
    return adminAccessRequestsApprove(req, res);
  }

  const adminUserIdRoleMatch = url.match(/^\/api\/admin\/users\/([^/]+)\/role$/);
  if (req.method === 'PUT' && adminUserIdRoleMatch) {
    req.query.id = adminUserIdRoleMatch[1] as string;
    return adminUsersRole(req, res);
  }

  return res.status(404).json({ error: 'API route not found in compacted index router' });
}
