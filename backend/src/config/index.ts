import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'super-secret-jwt-key-seat-swift-2026',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  defaultHoldTtlMinutes: parseInt(process.env.DEFAULT_HOLD_TTL_MINUTES || '10', 10),
  smtpHost: process.env.SMTP_HOST || 'smtp.ethereal.email',
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
};
