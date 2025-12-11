import { DataSource } from 'typeorm';
import { User } from '@modules/entities/user.entity';

export async function seedUsers(dataSource: DataSource) {
  const repo = dataSource.getRepository(User);

  const existing = await repo.count();
  if (existing > 0) {
    console.log('Users already seeded');
    return;
  }

  const seedCount = parseInt(process.env.USERS_SEED_COUNT || '200', 10);

  const users: Partial<User>[] = [
    {
      firebase_uid: 'iDNX5J3eOAPgMT7ZlEYHZDgAlMI2',
      email: 'test@example.com',
      full_name: 'Nguyễn Văn A',
      phone_number: '0901234567',
      avatar_url: 'https://res.cloudinary.com/dvnyecnlz/image/upload/v1762263880/user_avatars/93aba9a2-5c58-4e9f-9b94-d1fd5caf2659.webp',
      school_name: 'Đại học Bách Khoa TP.HCM',
      dormitory: 'KTX Khu A',
      date_of_birth: new Date('2002-05-15'),
      academic_year: 3,
      reputation_score: 0,
      total_votes_up: 0,
      total_votes_down: 0,
      is_active: true,
    },
    {
      firebase_uid: '9BfZpt2hJiZ1kV67vl5mP5acxX63',
      email: 'test1@gmail.com',
      full_name: 'Trần Thị B',
      phone_number: '0912345678',
      school_name: 'Đại học Khoa học Tự nhiên',
      dormitory: 'KTX Khu B',
      date_of_birth: new Date('2003-08-20'),
      academic_year: 2,
      reputation_score: 0,
      total_votes_up: 0,
      total_votes_down: 0,
      is_active: true,
    }
  ];

  // Tạo thêm user ngẫu nhiên để đạt seedCount
  const additional = Math.max(0, seedCount - users.length);
  for (let i = 0; i < additional; i++) {
    const idx = i + 1;
    users.push({
      firebase_uid: `seed-uid-${idx}-${Date.now()}`,
      email: `seed_user_${idx}@example.com`,
      full_name: `Seed User ${idx}`,
      phone_number: `090${1000000 + idx}`,
      avatar_url: `https://picsum.photos/seed/user${idx}/200/200`,
      school_name: 'Trường Đại học Thử nghiệm',
      dormitory: ['KTX Khu A', 'KTX Khu B'][Math.floor(Math.random() * 2)],
      date_of_birth: new Date(1999 + (idx % 6), 0, 1),
      academic_year: (idx % 5) + 1,
      reputation_score: Math.floor(Math.random() * 100),
      total_votes_up: 0,
      total_votes_down: 0,
      is_active: true,
    });
  }

  await repo.insert(users);
  console.log(`✅ Seeded ${users.length} users.`);
}
