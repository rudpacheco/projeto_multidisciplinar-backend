require('dotenv').config();

module.exports = {
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development'
  },
  
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'sghss_vidaplus',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '271506',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'vidaplus_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS) || 10
  },
  
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',') 
      : ['http://localhost:3000']
  }
};
