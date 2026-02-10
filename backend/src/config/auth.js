require('dotenv').config();

module.exports = {
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  
  bcryptRounds: 10,
  
  passwordReset: {
    tokenExpiry: 3600000, // 1 hour in milliseconds
  },
  
  tokenTypes: {
    ACCESS: 'access',
    REFRESH: 'refresh',
    RESET_PASSWORD: 'reset_password',
    VERIFY_EMAIL: 'verify_email'
  }
};
