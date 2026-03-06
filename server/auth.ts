import { Request, Response, NextFunction } from "express";

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) return next();
  res.status(401).send("Unauthorized");
}

import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "../shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser { }
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const parts = stored.split(".");
  if (parts.length !== 2) {
    return false;
  }
  const [hashed, salt] = parts;
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET must be set in production");
  }

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "law-helper-local-dev-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production" || process.env.VERCEL === "1"
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (rawEmail, password, done) => {
      const email = rawEmail.toLowerCase().trim();
      console.log(`[AUTH] Login attempt for email: ${email}`);
      try {
        if (!storage.getUserByEmail) {
           console.error("[AUTH] storage.getUserByEmail is undefined. Storage object:", Object.keys(storage));
           return done(new Error("Storage initialization failed"));
        }
        const user = await storage.getUserByEmail(email);
        console.log(`[AUTH] User found: ${user ? 'YES' : 'NO'}`);

        if (!user) {
          console.log(`[AUTH] User not found for email: ${email}`);
          return done(null, false);
        }

        console.log(`[AUTH] Checking password for user: ${user.id}`);
        const passwordMatch = await comparePasswords(password, user.password);
        console.log(`[AUTH] Password match: ${passwordMatch}`);

        if (!passwordMatch) {
          console.log(`[AUTH] Password mismatch for user: ${email}`);
          return done(null, false);
        } else {
          console.log(`[AUTH] Login successful for user: ${email}`);
          return done(null, user);
        }
      } catch (error) {
        console.error(`[AUTH] Login error:`, error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    let { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).send("Missing required fields");
    if (password.length > 128) return res.status(400).send("Password must be less than 128 characters");
    email = email.toLowerCase().trim();

    console.log(`[AUTH] Registration attempt for email: ${email}`);
    console.log(`[AUTH] Registration body:`, { name, email, password: '[PROVIDED]' });

    try {
      const existingUser = await storage.getUserByEmail(email);
      console.log(`[AUTH] Existing user check: ${existingUser ? 'EXISTS' : 'NEW'}`);

      if (existingUser) {
        console.log(`[AUTH] Email already exists: ${email}`);
        return res.status(400).send("Email already exists");
      }

      console.log(`[AUTH] Creating new user...`);
      const hashedPassword = await hashPassword(password);
      console.log(`[AUTH] Password hashed successfully`);

      const user = await storage.createUser({
        name,
        email,
        password: hashedPassword,
      });
      console.log(`[AUTH] User created successfully:`, { id: user.id, email: user.email });

      req.login(user, (err) => {
        if (err) {
          console.error(`[AUTH] Login after registration failed:`, err);
          return next(err);
        }
        console.log(`[AUTH] User logged in successfully after registration`);
        res.status(201).json(user);
      });
    } catch (error) {
      console.error(`[AUTH] Registration error:`, error);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ error: "Logout failed" });
      req.session.destroy((err) => {
        if (err) return res.status(500).json({ error: "Failed to destroy session" });
        res.clearCookie('connect.sid');
        res.sendStatus(200);
      });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.json({ user: null });
    res.json(req.user);
  });
}
