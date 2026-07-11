// Auth middleware: Mobile (X-PIN) and Admin (HTTP Basic)
// Env defaults: MOBILE_PIN=1234, ADMIN_USER=admin, ADMIN_PASS=admin123

const MOBILE_PIN = process.env.MOBILE_PIN || '1234';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

// Mobile auth — checks X-PIN header against MOBILE_PIN env var
export function mobileAuth(req, res, next) {
  const pin = req.headers['x-pin'];
  if (!pin || pin !== MOBILE_PIN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Admin auth — HTTP Basic Auth against ADMIN_USER / ADMIN_PASS env vars
export function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin"');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const base64 = authHeader.slice(6);
  const decoded = Buffer.from(base64, 'base64').toString('utf8');
  const [user, pass] = decoded.split(':');

  if (user !== ADMIN_USER || pass !== ADMIN_PASS) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin"');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}
