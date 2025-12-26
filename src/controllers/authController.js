const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const { userStore } = require('../models/userStore');
const { generateToken, generateTempToken, verifyTempToken } = require('../utils/jwt');

const MFA_CODE = process.env.MFA_CODE || '123456';
const SALT_ROUNDS = 10;

async function signup(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { email, password, name } = req.body;

  const existingUser = userStore.findUserByEmail(email);
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'User with this email already exists'
    });
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = userStore.createUser({
    email,
    password: hashedPassword,
    name
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    userId: user.id
  });
}

async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { email, password } = req.body;

  const user = userStore.findUserByEmail(email);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  const tempToken = generateTempToken(user.id);
  userStore.createMfaSession(user.id, tempToken);

  res.json({
    success: true,
    message: 'Credentials verified. MFA required.',
    mfaRequired: true,
    mfaOptions: ['email', 'sms'],
    tempToken
  });
}

function sendMfaCode(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { tempToken, method } = req.body;

  const decoded = verifyTempToken(tempToken);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired temporary token'
    });
  }

  const session = userStore.getMfaSession(tempToken);
  if (!session) {
    return res.status(401).json({
      success: false,
      message: 'MFA session not found. Please login again.'
    });
  }

  const user = userStore.findUserById(session.userId);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'User not found'
    });
  }

  userStore.updateMfaSession(tempToken, { codeSent: true, method });

  const destination = method === 'email' ? user.email : 'your registered phone number';
  
  res.json({
    success: true,
    message: `MFA code has been sent to ${destination}. For testing, use code: 123456`
  });
}

function verifyMfaCode(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { tempToken, code } = req.body;

  const decoded = verifyTempToken(tempToken);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired temporary token'
    });
  }

  const session = userStore.getMfaSession(tempToken);
  if (!session) {
    return res.status(401).json({
      success: false,
      message: 'MFA session not found. Please login again.'
    });
  }

  if (code !== MFA_CODE) {
    return res.status(401).json({
      success: false,
      message: 'Invalid MFA code'
    });
  }

  const user = userStore.findUserById(session.userId);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'User not found'
    });
  }

  userStore.deleteMfaSession(tempToken);

  const token = generateToken({ userId: user.id });

  res.json({
    success: true,
    message: 'MFA verification successful',
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt
    }
  });
}

function getProfile(req, res) {
  res.json({
    success: true,
    user: req.user
  });
}

module.exports = {
  signup,
  login,
  sendMfaCode,
  verifyMfaCode,
  getProfile
};
