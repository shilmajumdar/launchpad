const { verifyToken } = require('../utils/jwt');
const { userStore } = require('../models/userStore');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Authorization header is required'
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization header format. Use: Bearer <token>'
    });
  }

  const token = parts[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }

  const user = userStore.findUserById(decoded.userId);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'User not found'
    });
  }

  req.user = {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt
  };

  next();
}

module.exports = { authenticate };
