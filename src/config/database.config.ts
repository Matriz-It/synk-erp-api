import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => {
    const isProd = process.env.NODE_ENV === 'production';

    // Suporta DATABASE_URL (Neon/Railway) ou variáveis individuais (local)
    const url = process.env.DATABASE_URL;

    const base: Partial<TypeOrmModuleOptions> = url
      ? { url }
      : {
          host: process.env.DB_HOST ?? 'localhost',
          port: parseInt(process.env.DB_PORT ?? '5432', 10),
          username: process.env.DB_USER ?? 'postgres',
          password: process.env.DB_PASSWORD ?? 'postgres',
          database: process.env.DB_NAME ?? 'synk_erp',
        };

    return {
      type: 'postgres',
      ...base,
      entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
      migrations: [join(__dirname, '..', 'database', 'migrations', '*.{ts,js}')],
      synchronize: !isProd,
      logging: !isProd,
      ssl: isProd ? { rejectUnauthorized: false } : false,
      extra: {
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      },
    };
  },
);
