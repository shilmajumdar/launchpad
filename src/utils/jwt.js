const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function generateTempToken(userId) {
  return jwt.sign({ userId, type: 'mfa_temp' }, JWT_SECRET, { expiresIn: '10m' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

function verifyTempToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'mfa_temp') {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

module.exports = {
  generateToken,
  generateTempToken,
  verifyToken,
  verifyTempToken
};
