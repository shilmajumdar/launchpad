const request = require('supertest');
const app = require('../src/index');
const { userStore } = require('../src/models/userStore');

describe('Signup Endpoint', () => {
  beforeEach(() => {
    userStore.clear();
  });

  describe('POST /api/auth/signup', () => {
    const validUser = {
      email: 'test@example.com',
      password: 'Password123',
      name: 'Test User'
    };

    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send(validUser);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.userId).toBeDefined();
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({ ...validUser, email: 'invalid-email' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(e => e.path === 'email')).toBe(true);
    });

    it('should reject weak password - too short', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({ ...validUser, password: 'Pass1' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors.some(e => e.path === 'password')).toBe(true);
    });

    it('should reject weak password - no uppercase', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({ ...validUser, password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors.some(e => e.path === 'password')).toBe(true);
    });

    it('should reject weak password - no number', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({ ...validUser, password: 'Passwordabc' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors.some(e => e.path === 'password')).toBe(true);
    });

    it('should reject duplicate email', async () => {
      await request(app)
        .post('/api/auth/signup')
        .send(validUser);

      const response = await request(app)
        .post('/api/auth/signup')
        .send(validUser);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User with this email already exists');
    });

    it('should reject missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should reject missing name', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({ email: validUser.email, password: validUser.password });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors.some(e => e.path === 'name')).toBe(true);
    });

    it('should normalize email to lowercase', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({ ...validUser, email: 'TEST@EXAMPLE.COM' });

      expect(response.status).toBe(201);
      
      const user = userStore.findUserByEmail('test@example.com');
      expect(user).toBeDefined();
      expect(user.email).toBe('test@example.com');
    });
  });
});
