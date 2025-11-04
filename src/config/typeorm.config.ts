import { DataSource } from 'typeorm';
import configuration from '@config/configuration';
import * as dotenv from 'dotenv';
dotenv.config();

const config = configuration();

export const AppDataSource = new DataSource({
  type: config.database.type as any,
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.name,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true, // chỉ bật khi DEV
});
