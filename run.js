process.env.NODE_ENV = 'production';
process.env.DATABASE_URL = 'postgresql://foo:bar@localhost:5432/db';

import('./mock-vercel.js').catch(console.error);
