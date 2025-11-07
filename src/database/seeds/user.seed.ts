import { DataSource } from 'typeorm';
import { User } from '@modules/entities/user.entity';

export async function seedUsers(dataSource: DataSource) {
  const repo = dataSource.getRepository(User);

  const existing = await repo.count();
  if (existing > 0) {
    console.log('Users already seeded');
    return;
  }

  const users: Partial<User>[] = [
    {
        firebase_uid: 'iDNX5J3eOAPgMT7ZlEYHZDgAlMI2',
        email: 'test@example.com'
    },
    {
        firebase_uid: '9BfZpt2hJiZ1kV67vl5mP5acxX63',
        email: 'test1@gmail.com',
    }
  ];

  await repo.insert(users);
  console.log('✅ Users seeded successfully!');
}
