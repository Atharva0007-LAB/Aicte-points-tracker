import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { config } from './config/env';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import categoryRoutes from './routes/category.routes';
import eventRoutes from './routes/event.routes';
import activityRoutes from './routes/activity.routes';
import certificateRoutes from './routes/certificate.routes';
import adminRoutes from './routes/admin.routes';
import clubRoutes from './routes/club.routes';
import clubEventRoutes from './routes/club-event.routes';
import { errorHandler } from './middleware/error.middleware';
import { query } from './db/index';

class CustomPgStore extends session.Store {
  get(sid: string, callback: (err?: any, session?: session.SessionData | null) => void) {
    query<{ sess: any; expire: string | Date }>('SELECT sess, expire FROM session WHERE sid = $1', [sid])
      .then(({ rows }) => {
        if (rows.length === 0) return callback(null, null);
        const expireDate = new Date(rows[0].expire);
        if (expireDate < new Date()) {
          this.destroy(sid, () => {});
          return callback(null, null);
        }
        const sessData = typeof rows[0].sess === 'string' ? JSON.parse(rows[0].sess) : rows[0].sess;
        callback(null, sessData);
      })
      .catch((err) => callback(err));
  }

  set(sid: string, sess: session.SessionData, callback?: (err?: any) => void) {
    const maxAge = sess.cookie?.maxAge || 24 * 60 * 60 * 1000;
    const expire = new Date(Date.now() + maxAge);
    const sessJson = JSON.stringify(sess);

    query(
      `INSERT INTO session (sid, sess, expire) VALUES ($1, $2, $3)
       ON CONFLICT (sid) DO UPDATE SET sess = EXCLUDED.sess, expire = EXCLUDED.expire`,
      [sid, sessJson, expire]
    )
      .then(() => {
        if (callback) callback(null);
      })
      .catch((err) => {
        if (callback) callback(err);
      });
  }

  destroy(sid: string, callback?: (err?: any) => void) {
    query('DELETE FROM session WHERE sid = $1', [sid])
      .then(() => {
        if (callback) callback(null);
      })
      .catch((err) => {
        if (callback) callback(err);
      });
  }
}

export function createApp() {
  const app = express();

  // CORS setup for local dev credentials
  app.use(
    cors({
      origin: config.clientUrl,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Custom PostgreSQL session store
  const sessionStore = new CustomPgStore();

  app.use(
    session({
      store: sessionStore,
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'lax',
      },
    })
  );

  // Mount API routes
  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/activities', activityRoutes);
  app.use('/api/certificates', certificateRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/clubs', clubRoutes);
  app.use('/api/club-events', clubEventRoutes);

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
}
