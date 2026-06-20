import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

export default registerAs('database', (): TypeOrmModuleOptions => {
  const isProd = process.env.NODE_ENV === 'production';
  const url    = process.env.DATABASE_URL;

  const conn = url
    ? { url }
    : {
        host:     process.env.DB_HOST     ?? 'localhost',
        port:     parseInt(process.env.DB_PORT ?? '5432', 10),
        username: process.env.DB_USER     ?? 'postgres',
        password: process.env.DB_PASSWORD ?? 'postgres',
        database: process.env.DB_NAME     ?? 'synk_erp',
      };

  return {
    type: 'postgres',
    ...(conn as object),
    entities:    [join(__dirname, '..', '**', '*.entity.{ts,js}')],
    migrations:  [join(__dirname, '..', 'database', 'migrations', '*.{ts,js}')],
    synchronize: !isProd,
    logging:     !isProd,
    ssl:         isProd ? { rejectUnauthorized: false } : false,
    extra: {
      max: 10,
      idleTimeoutMillis:      30000,
      connectionTimeoutMillis: 10000,
    },
  } as TypeOrmModuleOptions;
});
