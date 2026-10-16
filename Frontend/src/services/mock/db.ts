import type { AuthUser, OnboardingStatus, UserRole } from "../../types";

interface MockUserRecord {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatarUrl: string | null;
  onboardingStatus: OnboardingStatus;
  onboardingStep: number;
}

interface MockDb {
  users: MockUserRecord[];
  tokens: Record<string, string>; // token -> userId
}

const DB_KEY = "calis_mock_db";

function seedDb(): MockDb {
  return {
    users: [
      {
        id: "demo-user",
        name: "Minh",
        email: "demo@calis.app",
        password: "demo1234",
        role: "USER",
        avatarUrl: null,
        onboardingStatus: "NOT_STARTED",
        onboardingStep: 0,
      },
      {
        id: "demo-admin",
        name: "Admin Calis",
        email: "admin@calis.app",
        password: "admin1234",
        role: "ADMIN",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        onboardingStatus: "COMPLETED",
        onboardingStep: 4,
      },
      {
        id: "demo-coach",
        name: "Hoàng Việt",
        email: "coach@calis.app",
        password: "coach1234",
        role: "COACH",
        avatarUrl: "https://i.pravatar.cc/200?img=14",
        onboardingStatus: "COMPLETED",
        onboardingStep: 4,
      },
    ],
    tokens: {},
  };
}

function readDb(): MockDb {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      const seeded = seedDb();
      localStorage.setItem(DB_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const db = JSON.parse(raw) as MockDb;
    // Migrate/ensure roles exist
    let changed = false;
    db.users.forEach((u) => {
      if (!u.role) {
        u.role = u.email === "admin@calis.app" ? "ADMIN" : "USER";
        changed = true;
      }
    });
    // Ensure demo-admin exists
    if (!db.users.some((u) => u.email === "admin@calis.app")) {
      db.users.push({
        id: "demo-admin",
        name: "Admin Calis",
        email: "admin@calis.app",
        password: "admin1234",
        role: "ADMIN",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        onboardingStatus: "COMPLETED",
        onboardingStep: 4,
      });
      changed = true;
    }
    // Ensure demo-coach exists
    if (!db.users.some((u) => u.email === "coach@calis.app")) {
      db.users.push({
      id: "demo-coach",
      name: "Hoàng Việt",
      email: "coach@calis.app",
      password: "coach1234",
      role: "COACH",
      avatarUrl: "https://i.pravatar.cc/200?img=14",
      onboardingStatus: "COMPLETED",
      onboardingStep: 4,
    });
      changed = true;
    }
    if (changed) {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    }
    return db;
  } catch {
    return seedDb();
  }
}

function writeDb(db: MockDb) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function toAuthUser(record: MockUserRecord): AuthUser {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    role: record.role ?? (record.email === "admin@calis.app" ? "ADMIN" : "USER"),
    avatarUrl: record.avatarUrl,
    onboarding: { status: record.onboardingStatus, currentStep: record.onboardingStep },
  };
}

function makeToken() {
  return `mock.${Math.random().toString(36).slice(2)}.${Date.now()}`;
}

export const mockDb = {
  findByEmail(email: string) {
    return readDb().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },

  createUser(name: string, email: string, password: string, role: UserRole = "USER") {
    const db = readDb();
    const record: MockUserRecord = {
      id: `user-${Date.now()}`,
      name,
      email,
      password,
      role,
      avatarUrl: null,
      onboardingStatus: "NOT_STARTED",
      onboardingStep: 0,
    };
    db.users.push(record);
    writeDb(db);
    return record;
  },

  createSession(userId: string) {
    const db = readDb();
    const token = makeToken();
    db.tokens[token] = userId;
    writeDb(db);
    return token;
  },

  destroySession(token: string) {
    const db = readDb();
    delete db.tokens[token];
    writeDb(db);
  },

  getUserByToken(token: string): AuthUser | null {
    const db = readDb();
    const userId = db.tokens[token];
    if (!userId) return null;
    const record = db.users.find((u) => u.id === userId);
    return record ? toAuthUser(record) : null;
  },

  getAuthUser(userId: string): AuthUser | null {
    const record = readDb().users.find((u) => u.id === userId);
    return record ? toAuthUser(record) : null;
  },

  updateOnboarding(userId: string, status: OnboardingStatus, step: number) {
    const db = readDb();
    const record = db.users.find((u) => u.id === userId);
    if (record) {
      record.onboardingStatus = status;
      record.onboardingStep = step;
      writeDb(db);
    }
    return record ? toAuthUser(record) : null;
  },

  updateAvatar(userId: string, avatarUrl: string | null) {
    const db = readDb();
    const record = db.users.find((u) => u.id === userId);
    if (record) {
      record.avatarUrl = avatarUrl;
      writeDb(db);
    }
    return record ? toAuthUser(record) : null;
  },

  updateName(userId: string, name: string) {
    const db = readDb();
    const record = db.users.find((u) => u.id === userId);
    if (record) {
      record.name = name;
      writeDb(db);
    }
    return record ? toAuthUser(record) : null;
  },
};
