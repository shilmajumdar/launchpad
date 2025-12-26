const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const signupValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long')
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const mfaSendValidation = [
  body('tempToken')
    .notEmpty()
    .withMessage('Temporary token is required'),
  body('method')
    .isIn(['email', 'sms'])
    .withMessage('Method must be either "email" or "sms"')
];

const mfaVerifyValidation = [
  body('tempToken')
    .notEmpty()
    .withMessage('Temporary token is required'),
  body('code')
    .isLength({ min: 6, max: 6 })
    .withMessage('MFA code must be 6 digits')
    .isNumeric()
    .withMessage('MFA code must contain only numbers')
];

router.post('/signup', signupValidation, authController.signup);
router.post('/login', loginValidation, authController.login);
router.post('/mfa/send', mfaSendValidation, authController.sendMfaCode);
router.post('/mfa/verify', mfaVerifyValidation, authController.verifyMfaCode);
router.get('/profile', authenticate, authController.getProfile);

module.exports = router;
