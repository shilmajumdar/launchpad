const { v4: uuidv4 } = require('uuid');

class UserStore {
  constructor() {
    this.users = new Map();
    this.mfaSessions = new Map();
  }

  createUser(userData) {
    const id = uuidv4();
    const user = {
      id,
      email: userData.email.toLowerCase(),
      password: userData.password,
      name: userData.name,
      createdAt: new Date().toISOString()
    };
    this.users.set(id, user);
    return user;
  }

  findUserByEmail(email) {
    const normalizedEmail = email.toLowerCase();
    for (const user of this.users.values()) {
      if (user.email === normalizedEmail) {
        return user;
      }
    }
    return null;
  }

  findUserById(id) {
    return this.users.get(id) || null;
  }

  updateUser(id, updates) {
    const user = this.users.get(id);
    if (!user) {
      return null;
    }
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  createMfaSession(userId, tempToken) {
    const session = {
      userId,
      tempToken,
      createdAt: new Date().toISOString(),
      codeSent: false,
      method: null
    };
    this.mfaSessions.set(tempToken, session);
    return session;
  }

  getMfaSession(tempToken) {
    return this.mfaSessions.get(tempToken) || null;
  }

  updateMfaSession(tempToken, updates) {
    const session = this.mfaSessions.get(tempToken);
    if (!session) {
      return null;
    }
    const updatedSession = { ...session, ...updates };
    this.mfaSessions.set(tempToken, updatedSession);
    return updatedSession;
  }

  deleteMfaSession(tempToken) {
    return this.mfaSessions.delete(tempToken);
  }

  clear() {
    this.users.clear();
    this.mfaSessions.clear();
  }
}

const userStore = new UserStore();

module.exports = { UserStore, userStore };
