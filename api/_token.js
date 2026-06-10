const crypto = require('crypto');

const SECRET = process.env.JWT_SECRET || 'brahamdev_secure_jwt_token_secret_key_9005341723';

function generateToken(username) {
  const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours validity
  const data = JSON.stringify({ username, expiry });
  const hmac = crypto.createHmac('sha256', SECRET).update(data).digest('hex');
  return Buffer.from(JSON.stringify({ data, hmac })).toString('base64');
}

function verifyToken(token) {
  if (!token) return null;
  try {
    const json = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    const { data, hmac } = json;
    const computedHmac = crypto.createHmac('sha256', SECRET).update(data).digest('hex');
    if (hmac !== computedHmac) return null;
    
    const parsed = JSON.parse(data);
    if (parsed.expiry < Date.now()) {
      return null; // Expired
    }
    return parsed;
  } catch (error) {
    return null;
  }
}

module.exports = {
  generateToken,
  verifyToken
};
