const request = require('supertest');
const app = require('../src/index');
const { userStore } = require('../src/models/userStore');
const jwt = require('jsonwebtoken');

describe('Authentication Middleware', () => {
  beforeEach(() => {
    userStore.clear();
  });

  const validUser = {
    email: 'test@example.com',
    password: 'Password123',
    name: 'Test User'
  };

  async function getValidToken() {
    await request(app)
      .post('/api/auth/signup')
      .send(validUser);

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: validUser.password });

    const verifyResponse = await request(app)
      .post('/api/auth/mfa/verify')
      .send({ tempToken: loginResponse.body.tempToken, code: '123456' });

    return verifyResponse.body.token;
  }

  describe('Protected Routes', () => {
    it('should accept valid token', async () => {
      const token = await getValidToken();

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
    });

    it('should reject expired token', async () => {
      await request(app)
        .post('/api/auth/signup')
        .send(validUser);

      const user = userStore.findUserByEmail(validUser.email);
      const expiredToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'default-secret-key',
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid or expired');
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject missing Authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Authorization header is required');
    });

    it('should reject malformed Authorization header - no Bearer', async () => {
      const token = await getValidToken();

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', token);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid authorization header format');
    });

    it('should reject malformed Authorization header - wrong scheme', async () => {
      const token = await getValidToken();

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Basic ${token}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should extract user from token correctly', async () => {
      const token = await getValidToken();

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.body.user.email).toBe(validUser.email);
      expect(response.body.user.name).toBe(validUser.name);
      expect(response.body.user.id).toBeDefined();
      expect(response.body.user.createdAt).toBeDefined();
    });

    it('should not expose password in user object', async () => {
      const token = await getValidToken();

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.body.user.password).toBeUndefined();
    });
  });
});
