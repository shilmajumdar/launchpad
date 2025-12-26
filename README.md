# Launchpad Auth Service

A NodeJS backend service for user signup and login with simulated MFA (Multi-Factor Authentication).

## Features

- User registration with email, password, and name
- User login with credential validation
- Simulated MFA via email or SMS
- JWT-based authentication for protected routes
- In-memory data storage (proof of concept)

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Login with credentials (returns MFA options) |
| POST | `/api/auth/mfa/send` | Send MFA code via email or SMS |
| POST | `/api/auth/mfa/verify` | Verify MFA code and get JWT token |
| GET | `/api/auth/profile` | Get authenticated user profile (protected) |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health check |

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## MFA Testing

For testing purposes, the MFA code is hardcoded as `123456`. In a production environment, this would be replaced with actual email/SMS delivery.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| JWT_SECRET | Secret key for JWT signing | (required) |
| JWT_EXPIRES_IN | JWT token expiration | 1h |
| MFA_CODE | Hardcoded MFA code for testing | 123456 |

## API Usage Examples

### Signup
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "Password123", "name": "John Doe"}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "Password123"}'
```

### Send MFA Code
```bash
curl -X POST http://localhost:3000/api/auth/mfa/send \
  -H "Content-Type: application/json" \
  -d '{"tempToken": "<temp_token_from_login>", "method": "email"}'
```

### Verify MFA Code
```bash
curl -X POST http://localhost:3000/api/auth/mfa/verify \
  -H "Content-Type: application/json" \
  -d '{"tempToken": "<temp_token_from_login>", "code": "123456"}'
```

### Get Profile (Protected)
```bash
curl http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer <jwt_token_from_verify>"
```

## Project Structure

```
launchpad/
├── src/
│   ├── controllers/
│   │   └── authController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   └── userStore.js
│   ├── routes/
│   │   └── auth.js
│   ├── utils/
│   │   └── jwt.js
│   └── index.js
├── tests/
│   ├── signup.test.js
│   ├── login.test.js
│   ├── mfa.test.js
│   ├── auth.middleware.test.js
│   └── integration.test.js
├── package.json
├── jest.config.js
└── .eslintrc.json
```
