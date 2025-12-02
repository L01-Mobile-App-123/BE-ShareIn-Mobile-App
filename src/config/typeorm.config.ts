import { DataSource } from 'typeorm';
import configuration from '@config/configuration';
import * as dotenv from 'dotenv';
dotenv.config();

const config = configuration();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: config.database.url,
  entities: [__dirname + '../../**/*.entity{.ts,.js}'],
  synchronize: true,
  schema: config.database.schema,
});
