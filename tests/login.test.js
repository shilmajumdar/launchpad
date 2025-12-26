const request = require('supertest');
const app = require('../src/index');
const { userStore } = require('../src/models/userStore');

describe('Login Endpoint', () => {
  beforeEach(() => {
    userStore.clear();
  });

  const validUser = {
    email: 'test@example.com',
    password: 'Password123',
    name: 'Test User'
  };

  async function createTestUser() {
    await request(app)
      .post('/api/auth/signup')
      .send(validUser);
  }

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      await createTestUser();

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: validUser.password });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.mfaRequired).toBe(true);
      expect(response.body.mfaOptions).toEqual(['email', 'sms']);
      expect(response.body.tempToken).toBeDefined();
    });

    it('should reject login with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'invalid-email', password: 'Password123' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors.some(e => e.path === 'email')).toBe(true);
    });

    it('should reject login with wrong password', async () => {
      await createTestUser();

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: 'WrongPassword123' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should reject login with non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'Password123' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should return MFA required response format', async () => {
      await createTestUser();

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: validUser.password });

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Credentials verified. MFA required.');
      expect(response.body).toHaveProperty('mfaRequired', true);
      expect(response.body).toHaveProperty('mfaOptions');
      expect(response.body).toHaveProperty('tempToken');
    });

    it('should generate a valid tempToken', async () => {
      await createTestUser();

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: validUser.password });

      expect(response.body.tempToken).toBeDefined();
      expect(typeof response.body.tempToken).toBe('string');
      expect(response.body.tempToken.length).toBeGreaterThan(0);
    });

    it('should reject missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
