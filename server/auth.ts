import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser { }
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "law-helper-local-dev-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      console.log(`[AUTH] Login attempt for email: ${email}`);
      try {
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
    console.log(`[AUTH] Registration attempt for email: ${req.body.email}`);
    console.log(`[AUTH] Registration body:`, { name: req.body.name, email: req.body.email, password: req.body.password ? '[PROVIDED]' : '[MISSING]' });

    try {
      const existingUser = await storage.getUserByEmail(req.body.email);
      console.log(`[AUTH] Existing user check: ${existingUser ? 'EXISTS' : 'NEW'}`);

      if (existingUser) {
        console.log(`[AUTH] Email already exists: ${req.body.email}`);
        return res.status(400).send("Email already exists");
      }

      console.log(`[AUTH] Creating new user...`);
      const hashedPassword = await hashPassword(req.body.password);
      console.log(`[AUTH] Password hashed successfully`);

      const user = await storage.createUser({
        name: req.body.name,
        email: req.body.email,
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
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
