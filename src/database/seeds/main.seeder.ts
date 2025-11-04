import { seedCategories } from './category.seed';
import { AppDataSource } from '@config/typeorm.config';

async function runSeeder() {
  const dataSource = await AppDataSource.initialize();
  console.log('🌱 Database connected! Running seeders...');

  await seedCategories(dataSource);

  await dataSource.destroy();
  console.log('🌾 Seeding complete!');
}

runSeeder().catch((err) => {
  console.error('❌ Seeding failed', err);
});
