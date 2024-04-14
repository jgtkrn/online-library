// src/config/config.service.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();
const env = process.env.NODE_ENV
const entities = env === 'production' ? ['dist/src/**/*.entity{.ts,.js}'] : ['src/**/*.entity{.ts,.js}']
const migrations = env === 'production' ? ['dist/src/migrations/**/*.ts'] : ['src/migrations/**/*.ts']
const migrationsDir = env === 'production' ? 'dist/src/migrations' : 'src/migrations'

class ConfigService {

  constructor(private env: { [k: string]: string | undefined }) { }

  private getValue(key: string, throwOnMissing = false): string {
    const value = this.env[key] || "";
    if (!value && throwOnMissing) {
      throw new Error(`config error - missing env.${key}`);
    }
    return value;
  }

  public ensureValues(keys: string[]) {
    keys.forEach(k => this.getValue(k, false));
    return this;
  }

  public getPort() {
    return this.getValue('PORT', true);
  }

  public isProduction() {
    const mode = this.getValue('MODE', false);
    return mode != 'DEV';
  }

  public getTypeOrmConfig(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: this.getValue('POSTGRES_HOST'),
      port: parseInt(this.getValue('POSTGRES_PORT')),
      username: this.getValue('POSTGRES_USER'),
      password: this.getValue('POSTGRES_PASSWORD') ,
      database: this.getValue('POSTGRES_DATABASE'),
      entities,
      migrationsTableName: 'migration',
      migrations,
      migrationsRun: true,
      cli: {
        migrationsDir
      },
      synchronize: false,
      ssl: false,
      // ssl: this.isProduction(),
      // extra: {
      //   ssl: {
      //     rejectUnauthorized: false,
      //   },
      // },
    };
  }
}

const configService = new ConfigService(process.env)
  .ensureValues([
    'POSTGRES_HOST',
    'POSTGRES_PORT',
    'POSTGRES_USER',
    'POSTGRES_DATABASE'
  ]);

export { configService };