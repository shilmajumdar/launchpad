const request = require('supertest');
const app = require('../src/index');
const { userStore } = require('../src/models/userStore');

describe('MFA Endpoints', () => {
  beforeEach(() => {
    userStore.clear();
  });

  const validUser = {
    email: 'test@example.com',
    password: 'Password123',
    name: 'Test User'
  };

  async function createAndLoginUser() {
    await request(app)
      .post('/api/auth/signup')
      .send(validUser);

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: validUser.password });

    return loginResponse.body.tempToken;
  }

  describe('POST /api/auth/mfa/send', () => {
    it('should send MFA code via email', async () => {
      const tempToken = await createAndLoginUser();

      const response = await request(app)
        .post('/api/auth/mfa/send')
        .send({ tempToken, method: 'email' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('MFA code has been sent');
      expect(response.body.message).toContain(validUser.email);
    });

    it('should send MFA code via sms', async () => {
      const tempToken = await createAndLoginUser();

      const response = await request(app)
        .post('/api/auth/mfa/send')
        .send({ tempToken, method: 'sms' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('MFA code has been sent');
    });

    it('should reject invalid tempToken', async () => {
      const response = await request(app)
        .post('/api/auth/mfa/send')
        .send({ tempToken: 'invalid-token', method: 'email' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid or expired');
    });

    it('should reject invalid method', async () => {
      const tempToken = await createAndLoginUser();

      const response = await request(app)
        .post('/api/auth/mfa/send')
        .send({ tempToken, method: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject missing tempToken', async () => {
      const response = await request(app)
        .post('/api/auth/mfa/send')
        .send({ method: 'email' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/mfa/verify', () => {
    it('should verify correct MFA code (123456)', async () => {
      const tempToken = await createAndLoginUser();

      await request(app)
        .post('/api/auth/mfa/send')
        .send({ tempToken, method: 'email' });

      const response = await request(app)
        .post('/api/auth/mfa/verify')
        .send({ tempToken, code: '123456' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(validUser.email);
    });

    it('should reject incorrect MFA code', async () => {
      const tempToken = await createAndLoginUser();

      const response = await request(app)
        .post('/api/auth/mfa/verify')
        .send({ tempToken, code: '000000' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid MFA code');
    });

    it('should reject invalid tempToken', async () => {
      const response = await request(app)
        .post('/api/auth/mfa/verify')
        .send({ tempToken: 'invalid-token', code: '123456' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return JWT token on successful verification', async () => {
      const tempToken = await createAndLoginUser();

      const response = await request(app)
        .post('/api/auth/mfa/verify')
        .send({ tempToken, code: '123456' });

      expect(response.body.token).toBeDefined();
      expect(typeof response.body.token).toBe('string');
      expect(response.body.token.split('.').length).toBe(3);
    });

    it('should return user profile on successful verification', async () => {
      const tempToken = await createAndLoginUser();

      const response = await request(app)
        .post('/api/auth/mfa/verify')
        .send({ tempToken, code: '123456' });

      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBeDefined();
      expect(response.body.user.email).toBe(validUser.email);
      expect(response.body.user.name).toBe(validUser.name);
      expect(response.body.user.createdAt).toBeDefined();
      expect(response.body.user.password).toBeUndefined();
    });

    it('should reject code that is not 6 digits', async () => {
      const tempToken = await createAndLoginUser();

      const response = await request(app)
        .post('/api/auth/mfa/verify')
        .send({ tempToken, code: '12345' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject non-numeric code', async () => {
      const tempToken = await createAndLoginUser();

      const response = await request(app)
        .post('/api/auth/mfa/verify')
        .send({ tempToken, code: 'abcdef' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
