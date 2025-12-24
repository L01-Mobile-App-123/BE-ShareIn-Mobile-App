import { DataSource } from 'typeorm';
import { User } from '@modules/entities/user.entity';

export async function seedUsers(dataSource: DataSource) {
  const repo = dataSource.getRepository(User);

  const existing = await repo.count();
  if (existing > 0) {
    console.log('Users already seeded');
    return;
  }

  // Chỉ tạo 10 users đơn giản cho test
  const users: Partial<User>[] = [
    {
      firebase_uid: 'test-user-1',
      email: 'user1@test.com',
      full_name: 'User 1',
      phone_number: '0901111111',
      school_name: 'ĐH Bách Khoa',
      dormitory: 'KTX A',
      date_of_birth: new Date('2000-01-01'),
      academic_year: 3,
      reputation_score: 80,
      total_votes_up: 10,
      total_votes_down: 0,
      is_active: true,
    },
    {
      firebase_uid: 'test-user-2',
      email: 'user2@test.com',
      full_name: 'User 2',
      phone_number: '0902222222',
      school_name: 'ĐH Khoa học Tự nhiên',
      dormitory: 'KTX B',
      date_of_birth: new Date('2001-02-02'),
      academic_year: 2,
      reputation_score: 90,
      total_votes_up: 15,
      total_votes_down: 0,
      is_active: true,
    },
    {
      firebase_uid: 'test-user-3',
      email: 'user3@test.com',
      full_name: 'User 3',
      phone_number: '0903333333',
      school_name: 'ĐH Bách Khoa',
      dormitory: 'KTX A',
      date_of_birth: new Date('2002-03-03'),
      academic_year: 1,
      reputation_score: 70,
      total_votes_up: 8,
      total_votes_down: 1,
      is_active: true,
    },
    {
      firebase_uid: 'test-user-4',
      email: 'user4@test.com',
      full_name: 'User 4',
      phone_number: '0904444444',
      school_name: 'ĐH Khoa học Tự nhiên',
      dormitory: 'KTX B',
      date_of_birth: new Date('2000-04-04'),
      academic_year: 4,
      reputation_score: 95,
      total_votes_up: 20,
      total_votes_down: 0,
      is_active: true,
    },
    {
      firebase_uid: 'test-user-5',
      email: 'user5@test.com',
      full_name: 'User 5',
      phone_number: '0905555555',
      school_name: 'ĐH Bách Khoa',
      dormitory: 'KTX A',
      date_of_birth: new Date('2001-05-05'),
      academic_year: 2,
      reputation_score: 85,
      total_votes_up: 12,
      total_votes_down: 0,
      is_active: true,
    },
  ];

  await repo.insert(users);
  console.log(`✅ Seeded ${users.length} users (đơn giản cho test).`);
}
