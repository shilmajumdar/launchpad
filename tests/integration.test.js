const request = require('supertest');
const app = require('../src/index');
const { userStore } = require('../src/models/userStore');

describe('Integration Tests - Complete Auth Flow', () => {
  beforeEach(() => {
    userStore.clear();
  });

  const testUser = {
    email: 'integration@example.com',
    password: 'IntegrationTest123',
    name: 'Integration Test User'
  };

  describe('Complete Authentication Flow', () => {
    it('should complete full signup -> login -> MFA -> profile flow', async () => {
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send(testUser);

      expect(signupResponse.status).toBe(201);
      expect(signupResponse.body.success).toBe(true);
      const userId = signupResponse.body.userId;

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.mfaRequired).toBe(true);
      const tempToken = loginResponse.body.tempToken;

      const mfaSendResponse = await request(app)
        .post('/api/auth/mfa/send')
        .send({ tempToken, method: 'email' });

      expect(mfaSendResponse.status).toBe(200);
      expect(mfaSendResponse.body.success).toBe(true);

      const mfaVerifyResponse = await request(app)
        .post('/api/auth/mfa/verify')
        .send({ tempToken, code: '123456' });

      expect(mfaVerifyResponse.status).toBe(200);
      expect(mfaVerifyResponse.body.success).toBe(true);
      const token = mfaVerifyResponse.body.token;

      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.user.id).toBe(userId);
      expect(profileResponse.body.user.email).toBe(testUser.email);
      expect(profileResponse.body.user.name).toBe(testUser.name);
    });

    it('should reject unauthorized access to protected endpoints', async () => {
      const response = await request(app)
        .get('/api/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return correct user data from profile endpoint', async () => {
      await request(app)
        .post('/api/auth/signup')
        .send(testUser);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      const verifyResponse = await request(app)
        .post('/api/auth/mfa/verify')
        .send({ tempToken: loginResponse.body.tempToken, code: '123456' });

      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${verifyResponse.body.token}`);

      expect(profileResponse.body.user).toMatchObject({
        email: testUser.email,
        name: testUser.name
      });
      expect(profileResponse.body.user.id).toBeDefined();
      expect(profileResponse.body.user.createdAt).toBeDefined();
      expect(profileResponse.body.user.password).toBeUndefined();
    });

    it('should handle error flow - wrong password after signup', async () => {
      await request(app)
        .post('/api/auth/signup')
        .send(testUser);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'WrongPassword123' });

      expect(loginResponse.status).toBe(401);
      expect(loginResponse.body.success).toBe(false);
    });

    it('should handle error flow - wrong MFA code', async () => {
      await request(app)
        .post('/api/auth/signup')
        .send(testUser);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      const verifyResponse = await request(app)
        .post('/api/auth/mfa/verify')
        .send({ tempToken: loginResponse.body.tempToken, code: '000000' });

      expect(verifyResponse.status).toBe(401);
      expect(verifyResponse.body.success).toBe(false);
      expect(verifyResponse.body.message).toBe('Invalid MFA code');
    });

    it('should allow multiple users to register and login', async () => {
      const user1 = { email: 'user1@example.com', password: 'Password123', name: 'User One' };
      const user2 = { email: 'user2@example.com', password: 'Password456', name: 'User Two' };

      await request(app).post('/api/auth/signup').send(user1);
      await request(app).post('/api/auth/signup').send(user2);

      const login1 = await request(app)
        .post('/api/auth/login')
        .send({ email: user1.email, password: user1.password });
      
      const login2 = await request(app)
        .post('/api/auth/login')
        .send({ email: user2.email, password: user2.password });

      expect(login1.status).toBe(200);
      expect(login2.status).toBe(200);

      const verify1 = await request(app)
        .post('/api/auth/mfa/verify')
        .send({ tempToken: login1.body.tempToken, code: '123456' });

      const verify2 = await request(app)
        .post('/api/auth/mfa/verify')
        .send({ tempToken: login2.body.tempToken, code: '123456' });

      const profile1 = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${verify1.body.token}`);

      const profile2 = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${verify2.body.token}`);

      expect(profile1.body.user.email).toBe(user1.email);
      expect(profile2.body.user.email).toBe(user2.email);
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown-route');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Route not found');
    });
  });
});
