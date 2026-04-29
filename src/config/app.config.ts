import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.APP_PORT ?? '3000', 10),
  secret: process.env.APP_SECRET ?? 'fallback_secret',

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'access_secret',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'refresh_secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },

  mail: {
    host: process.env.MAIL_HOST ?? 'smtp.mailtrap.io',
    port: parseInt(process.env.MAIL_PORT ?? '587', 10),
    user: process.env.MAIL_USER ?? '',
    pass: process.env.MAIL_PASS ?? '',
    from: process.env.MAIL_FROM ?? 'noreply@synkerp.com',
  },

  totp: {
    appName: process.env.TOTP_APP_NAME ?? 'SynkERP',
  },

  tokens: {
    inviteTtlHours: parseInt(process.env.INVITE_TOKEN_TTL_HOURS ?? '48', 10),
    resetTtlHours: parseInt(process.env.RESET_TOKEN_TTL_HOURS ?? '2', 10),
  },
}));
