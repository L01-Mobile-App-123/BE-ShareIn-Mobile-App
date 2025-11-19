import { DataSource } from 'typeorm';
import { Conversation } from '../../modules/entities/conversation.entity';
import { Message } from '../../modules/entities/message.entity';
import { User } from '../../modules/entities/user.entity';
import { MessageType } from '../../common/enums/message-type.enum';

const MESSAGES = [
  'Sản phẩm này còn không bạn?', 'Còn nhé bạn ơi.',
  'Giá có fix không ạ?', 'Mình bớt 10k tiền xăng nhé.',
  'Bạn ở đâu mình qua xem?', 'Mình ở KTX Khu B.',
  'Oke chiều nay 5h mình qua.', 'Oke bạn.'
];

export async function seedChats(dataSource: DataSource) {
  const conversationRepo = dataSource.getRepository(Conversation);
  const messageRepo = dataSource.getRepository(Message);
  const userRepo = dataSource.getRepository(User);

  const users = await userRepo.find();

  if (users.length < 2) {
    console.log('⚠️  Skipping Chat seeding: Need at least 2 users.');
    return;
  }

  // Tạo 10 cuộc hội thoại ngẫu nhiên
  for (let i = 0; i < 10; i++) {
    // Chọn 2 user ngẫu nhiên khác nhau
    let user1 = users[Math.floor(Math.random() * users.length)];
    let user2 = users[Math.floor(Math.random() * users.length)];
    while (user1.user_id === user2.user_id) {
      user2 = users[Math.floor(Math.random() * users.length)];
    }

    // Sắp xếp ID để đảm bảo unique index (nếu logic app yêu cầu, dù entity đã handle)
    const [initiator, recipient] = [user1, user2].sort((a, b) => a.user_id.localeCompare(b.user_id));

    // Kiểm tra tồn tại
    const exists = await conversationRepo.findOne({
        where: { initiator_id: initiator.user_id, recipient_id: recipient.user_id }
    });
    if (exists) continue;

    const conversation = conversationRepo.create({
      initiator: initiator,
      recipient: recipient,
      last_message_at: new Date(),
    });

    await conversationRepo.save(conversation);

    // Tạo tin nhắn cho hội thoại này
    const messages: Message[] = [];
    for (let j = 0; j < 4; j++) { // 4 tin nhắn mỗi cuộc
      const sender = j % 2 === 0 ? initiator : recipient;
      const msg = messageRepo.create({
        conversation: conversation,
        sender: sender,
        content: MESSAGES[j % MESSAGES.length],
        message_type: MessageType.TEXT,
        sent_at: new Date(Date.now() - (10000 * (4 - j))) // Tin nhắn cách nhau 10s
      });
      messages.push(msg);
    }
    await messageRepo.save(messages);
  }
  console.log('✅ Seeded conversations and messages.');
}