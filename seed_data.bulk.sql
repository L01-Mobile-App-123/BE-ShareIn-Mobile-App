-- Seed dữ liệu mẫu (nhiều data) cho ứng dụng trao đổi đồ sinh viên
-- DB: PostgreSQL
-- Cách chạy (ví dụ): psql -d <db> -f seed_data.bulk.sql

BEGIN;

-- UUID generator
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Đảm bảo dùng schema public
SET search_path TO public;

-- Xóa dữ liệu cũ (nếu bảng tồn tại)
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'notifications',
    'ratings',
    'search_histories',
    'user_interests',
    'category_keywords',
    'messages',
    'conversations',
    'post_saves',
    'post_likes',
    'posts',
    'categories',
    'users'
  ]
  LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_tables
      WHERE schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('TRUNCATE TABLE public.%I RESTART IDENTITY CASCADE', t);
    END IF;
  END LOOP;
END $$;

-- =========================
-- 1) CATEGORIES
-- =========================
INSERT INTO categories (category_id, category_name, description, created_at)
VALUES
  (gen_random_uuid(), 'Sách & Tài liệu học tập', 'Chia sẻ, mua bán sách giáo trình, tài liệu tham khảo, và giáo cụ phục vụ học tập.', now()),
  (gen_random_uuid(), 'Đồ dùng học tập/Văn phòng phẩm', 'Bút, vở, giấy, thước kẻ và các vật dụng hỗ trợ học tập hoặc làm việc văn phòng.', now()),
  (gen_random_uuid(), 'Thiết bị Điện tử', 'Các thiết bị như laptop, điện thoại, tai nghe, phụ kiện điện tử phục vụ học tập và giải trí.', now()),
  (gen_random_uuid(), 'Đồ Gia dụng & Thiết bị ký túc xá', 'Các vật dụng cần thiết cho sinh hoạt hằng ngày, phù hợp với phòng trọ và ký túc xá sinh viên.', now()),
  (gen_random_uuid(), 'Quần áo & Phụ kiện', 'Quần áo, giày dép, balo, túi xách và các phụ kiện thời trang phù hợp với sinh viên.', now()),
  (gen_random_uuid(), 'Dịch vụ & Khác', 'Các dịch vụ tiện ích, việc làm thêm, và các sản phẩm khác phục vụ nhu cầu sinh viên.', now());

-- =========================
-- 2) CATEGORY_KEYWORDS
-- =========================
INSERT INTO category_keywords (keyword_id, category_id, keyword, description, created_at)
SELECT
  gen_random_uuid(),
  c.category_id,
  k.keyword,
  NULL,
  now()
FROM categories c
CROSS JOIN LATERAL (
  VALUES
    (c.category_name || ' giá rẻ'),
    (c.category_name || ' cũ'),
    ('Thanh lý ' || c.category_name),
    ('Mới 99% ' || c.category_name),
    ('Gần KTX ' || c.category_name)
) AS k(keyword)
ON CONFLICT (category_id, keyword) DO NOTHING;

-- =========================
-- 3) USERS (3 user cố định)
-- =========================
INSERT INTO users (
  user_id,
  firebase_uid,
  email,
  full_name,
  phone_number,
  avatar_url,
  school_name,
  dormitory,
  date_of_birth,
  academic_year,
  reputation_score,
  total_votes_up,
  total_votes_down,
  is_active,
  created_at,
  updated_at
)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'iDNX5J3eOAPgMT7ZlEYHZDgAlMI2',
    'test@example.com',
    'User 1',
    '0901111111',
    'https://i.pravatar.cc/150?img=1',
    'ĐH Bách Khoa',
    'KTX Khu A',
    date '2000-01-01',
    3,
    80,
    10,
    0,
    true,
    now() - interval '120 days',
    now() - interval '2 days'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '9BfZpt2hJiZ1kV67vl5mP5acxX63',
    'test1@gmail.com',
    'User 3',
    '0903333333',
    'https://i.pravatar.cc/150?img=3',
    'ĐH Bách Khoa',
    'KTX Khu A',
    date '2002-03-03',
    1,
    70,
    8,
    1,
    true,
    now() - interval '60 days',
    now() - interval '3 days'
  );

-- =========================
-- 4) POSTS (tạo rất nhiều)
-- =========================
-- Bạn chỉnh số lượng post tại đây
WITH params AS (
  SELECT 50::int AS post_count
),
users_rn AS (
  SELECT user_id, row_number() OVER (ORDER BY user_id) AS rn FROM users
),
cats_rn AS (
  SELECT category_id, row_number() OVER (ORDER BY category_id) AS rn FROM categories
),
uc AS (SELECT max(rn) AS user_cnt FROM users_rn),
cc AS (SELECT max(rn) AS cat_cnt FROM cats_rn),
ins AS (
  INSERT INTO posts (
    post_id,
    user_id,
    category_id,
    title,
    description,
    price,
    location,
    is_available,
    transaction_type,
    view_count,
    status,
    image_urls,
    created_at,
    updated_at
  )
  SELECT
    gen_random_uuid(),
    u.user_id,
    c.category_id,
    titles[1 + (g % array_length(titles, 1))],
    format('Mô tả chi tiết cho %s. Hàng còn tốt, liên hệ để biết thêm chi tiết.', titles[1 + (g % array_length(titles, 1))]),
    CASE tx
      WHEN 'CHO_MIEN_PHI'::posts_transaction_type_enum THEN 0
      WHEN 'DOI_DO'::posts_transaction_type_enum THEN 0
      ELSE ((random() * 120)::int * 10000)::numeric(10, 2)
    END,
    locations[1 + ((g * 3) % array_length(locations, 1))],
    (random() > 0.2),
    tx,
    (random() * 500)::int,
    (CASE WHEN random() < 0.9 THEN 'posted' ELSE 'draft' END)::posts_status_enum,
    json_build_array(
      format('https://picsum.photos/seed/%s/300/200', g),
      format('https://picsum.photos/seed/%s/300/200', g + 100000)
    ),
    now() - ((random() * 90)::int || ' days')::interval,
    now() - ((random() * 10)::int || ' days')::interval
  FROM params
  CROSS JOIN LATERAL (
    SELECT
      ARRAY[
        'Giáo trình Toán cao cấp tập 1','Bàn học cũ gỗ sồi','iPhone 11 Pro Max cũ','Tặng mèo con 2 tháng tuổi',
        'Trao đổi sách văn học lấy truyện tranh','Xe đạp Martin 107','Nồi cơm điện mini','Quạt máy Senko',
        'Giày Nike size 42','Vợt cầu lông Yonex','Laptop Dell XPS cũ','Truyện Conan trọn bộ','Đèn học chống cận','Balo chống gù lưng',
        'Tai nghe Bluetooth','Bình giữ nhiệt','Máy tính Casio FX-570','Bộ nồi inox','Bàn phím cơ cũ','Chuột gaming',
        'Dịch vụ sửa laptop','Gia sư Toán','Chuyển phòng KTX','Thanh lý đồ trọ','Balo laptop chống nước','Áo khoác dù'
      ] AS titles,
      ARRAY['KTX Khu A','KTX Khu B','KTX Khu C','Thư viện trung tâm','Nhà văn hóa sinh viên','Quận 1','Quận 3','Thủ Đức','Bình Thạnh','Tân Bình'] AS locations
  ) a
  CROSS JOIN generate_series(1, (SELECT post_count FROM params)) g
  CROSS JOIN uc
  CROSS JOIN cc
  JOIN users_rn u ON u.rn = 1 + (g % uc.user_cnt)
  JOIN cats_rn c ON c.rn = 1 + ((g * 5) % cc.cat_cnt)
  CROSS JOIN LATERAL (
    SELECT (ARRAY['BAN_RE'::posts_transaction_type_enum,'DOI_DO'::posts_transaction_type_enum,'CHO_MIEN_PHI'::posts_transaction_type_enum])[1 + (g % 3)] AS tx
  ) t
  RETURNING post_id, user_id
)
SELECT count(*) AS inserted_posts FROM ins;

-- =========================
-- 5) USER_INTERESTS
-- =========================
WITH users_rn AS (
  SELECT user_id, row_number() OVER (ORDER BY user_id) AS rn FROM users
),
cats_rn AS (
  SELECT category_id, row_number() OVER (ORDER BY category_id) AS rn FROM categories
),
cc AS (SELECT max(rn) AS cat_cnt FROM cats_rn)
INSERT INTO user_interests (interest_id, user_id, category_id, keywords, is_active, created_at)
SELECT
  gen_random_uuid(),
  u.user_id,
  c.category_id,
  'giá rẻ,mới 99%,gần KTX',
  true,
  now() - ((random() * 120)::int || ' days')::interval
FROM users_rn u
CROSS JOIN cc
JOIN cats_rn c ON c.rn = 1 + ((u.rn * 3) % cc.cat_cnt)
ON CONFLICT (user_id, category_id) DO NOTHING;

-- Thêm 1 interest nữa cho ~50% user
WITH users_rn AS (
  SELECT user_id, row_number() OVER (ORDER BY user_id) AS rn FROM users
),
cats_rn AS (
  SELECT category_id, row_number() OVER (ORDER BY category_id) AS rn FROM categories
),
cc AS (SELECT max(rn) AS cat_cnt FROM cats_rn)
INSERT INTO user_interests (interest_id, user_id, category_id, keywords, is_active, created_at)
SELECT
  gen_random_uuid(),
  u.user_id,
  c.category_id,
  'cũ,thanh lý,nhận đổi',
  true,
  now() - ((random() * 120)::int || ' days')::interval
FROM users_rn u
CROSS JOIN cc
JOIN cats_rn c ON c.rn = 1 + ((u.rn * 7) % cc.cat_cnt)
WHERE (u.rn % 2) = 0
ON CONFLICT (user_id, category_id) DO NOTHING;

-- =========================
-- 6) SEARCH_HISTORIES
-- =========================
WITH params AS (SELECT 10::int AS searches_per_user),
users_rn AS (
  SELECT user_id, row_number() OVER (ORDER BY user_id) AS rn FROM users
)
INSERT INTO search_histories (id, user_id, keyword, created_at)
SELECT
  gen_random_uuid(),
  u.user_id,
  keywords[1 + ((u.rn * 11 + s) % array_length(keywords, 1))],
  now() - ((random() * 60)::int || ' days')::interval
FROM users_rn u
CROSS JOIN params
CROSS JOIN LATERAL (
  SELECT ARRAY[
    'Iphone cũ','Giáo trình','Laptop cũ','Balo chống nước','Tai nghe bluetooth','Bàn học','Đèn học','Quạt mini',
    'Máy tính casio','Vợt cầu lông','Giày chạy bộ','Nồi cơm điện','Thanh lý đồ trọ','Trao đổi sách','Gia sư'
  ] AS keywords
) k
CROSS JOIN generate_series(1, (SELECT searches_per_user FROM params)) s;

-- =========================
-- 7) POST_LIKES / POST_SAVES (nhiều)
-- =========================
-- Bạn chỉnh số lượng like/save tại đây
WITH params AS (SELECT 80::int AS like_count),
users_rn AS (SELECT user_id, row_number() OVER (ORDER BY user_id) rn FROM users),
posts_rn AS (SELECT post_id, row_number() OVER (ORDER BY post_id) rn FROM posts),
uc AS (SELECT max(rn) AS user_cnt FROM users_rn),
pc AS (SELECT max(rn) AS post_cnt FROM posts_rn)
INSERT INTO post_likes (like_id, user_id, post_id, created_at)
SELECT
  gen_random_uuid(),
  u.user_id,
  p.post_id,
  now() - ((random() * 90)::int || ' days')::interval
FROM params
CROSS JOIN uc
CROSS JOIN pc
CROSS JOIN generate_series(1, (SELECT like_count FROM params)) g
JOIN users_rn u ON u.rn = 1 + (g % uc.user_cnt)
JOIN posts_rn p ON p.rn = 1 + ((g * 13) % pc.post_cnt)
ON CONFLICT (user_id, post_id) DO NOTHING;

WITH params AS (SELECT 60::int AS save_count),
users_rn AS (SELECT user_id, row_number() OVER (ORDER BY user_id) rn FROM users),
posts_rn AS (SELECT post_id, row_number() OVER (ORDER BY post_id) rn FROM posts),
uc AS (SELECT max(rn) AS user_cnt FROM users_rn),
pc AS (SELECT max(rn) AS post_cnt FROM posts_rn)
INSERT INTO post_saves (save_id, user_id, post_id, created_at)
SELECT
  gen_random_uuid(),
  u.user_id,
  p.post_id,
  now() - ((random() * 120)::int || ' days')::interval
FROM params
CROSS JOIN uc
CROSS JOIN pc
CROSS JOIN generate_series(1, (SELECT save_count FROM params)) g
JOIN users_rn u ON u.rn = 1 + ((g * 3) % uc.user_cnt)
JOIN posts_rn p ON p.rn = 1 + ((g * 17) % pc.post_cnt)
ON CONFLICT (user_id, post_id) DO NOTHING;

-- =========================
-- 8) CONVERSATIONS + MESSAGES
-- =========================
-- Với 3 users thì tối đa chỉ có 3 cặp hội thoại unique
WITH u AS (SELECT user_id FROM users ORDER BY user_id),
pairs AS (
  SELECT
    LEAST(u1.user_id, u2.user_id) AS initiator_id,
    GREATEST(u1.user_id, u2.user_id) AS recipient_id
  FROM u u1
  JOIN u u2 ON u1.user_id < u2.user_id
),
ins AS (
  INSERT INTO conversations (
    conversation_id,
    initiator_id,
    recipient_id,
    initiator_last_read,
    recipient_last_read,
    is_locked,
    created_at,
    last_message_at
  )
  SELECT
    gen_random_uuid(),
    p.initiator_id,
    p.recipient_id,
    NULL,
    NULL,
    false,
    now() - interval '7 days',
    now() - interval '1 days'
  FROM pairs p
  ON CONFLICT (initiator_id, recipient_id) DO NOTHING
  RETURNING conversation_id
)
SELECT count(*) AS inserted_conversations FROM ins;

-- Messages: 6 tin nhắn / conversation
WITH params AS (SELECT 6::int AS messages_per_conv),
msg_texts AS (
  SELECT ARRAY[
    'Sản phẩm này còn không bạn?',
    'Còn nhé bạn ơi.',
    'Giá có fix không ạ?',
    'Mình bớt chút tiền xăng nhé.',
    'Bạn ở đâu mình qua xem?',
    'Mình ở KTX, bạn ghé được nha.',
    'Ok chiều mình qua.',
    'Chốt nhé, hẹn bạn.'
  ] AS texts
)
INSERT INTO messages (
  message_id,
  conversation_id,
  sender_id,
  content,
  last_message_content,
  message_type,
  sent_at
)
SELECT
  gen_random_uuid(),
  c.conversation_id,
  CASE WHEN (m % 2) = 1 THEN c.initiator_id ELSE c.recipient_id END,
  texts[1 + (m % array_length(texts, 1))],
  NULL,
  'text'::messages_message_type_enum,
  (c.last_message_at - ((params.messages_per_conv - m) * interval '20 seconds'))
FROM conversations c
CROSS JOIN params
CROSS JOIN msg_texts
CROSS JOIN generate_series(1, (SELECT messages_per_conv FROM params)) m;

-- =========================
-- 9) RATINGS
-- =========================
-- Bạn chỉnh số lượng rating tại đây
WITH params AS (SELECT 50::int AS rating_count),
users_rn AS (SELECT user_id, row_number() OVER (ORDER BY user_id) rn FROM users),
posts_rn AS (SELECT post_id, user_id AS owner_user_id, row_number() OVER (ORDER BY post_id) rn FROM posts),
uc AS (SELECT max(rn) AS user_cnt FROM users_rn),
pc AS (SELECT max(rn) AS post_cnt FROM posts_rn)
INSERT INTO ratings (rating_id, rater_id, rated_user_id, rating_score, comment, proof_image_urls, created_at)
SELECT
  gen_random_uuid(),
  CASE
    WHEN u.user_id = p.owner_user_id THEN (
      SELECT user_id FROM users_rn ux WHERE ux.rn = 1 + ((g * 7) % uc.user_cnt)
    )
    ELSE u.user_id
  END,
  p.owner_user_id,
  81 + (g % 20),
  'Giao dịch nhanh gọn, uy tín.',
  NULL,
  now() - ((random() * 120)::int || ' days')::interval
FROM params
CROSS JOIN uc
CROSS JOIN pc
CROSS JOIN generate_series(1, (SELECT rating_count FROM params)) g
JOIN posts_rn p ON p.rn = 1 + (g % pc.post_cnt)
JOIN users_rn u ON u.rn = 1 + ((g * 13) % uc.user_cnt)
WHERE p.owner_user_id IS NOT NULL;

-- =========================
-- 10) NOTIFICATIONS
-- =========================
-- Bạn chỉnh số lượng notification tại đây
WITH params AS (SELECT 50::int AS notif_count),
users_rn AS (SELECT user_id, row_number() OVER (ORDER BY user_id) rn FROM users),
posts_rn AS (SELECT post_id, category_id, row_number() OVER (ORDER BY post_id) rn FROM posts),
cats_rn AS (SELECT category_id, row_number() OVER (ORDER BY category_id) rn FROM categories),
uc AS (SELECT max(rn) AS user_cnt FROM users_rn),
pc AS (SELECT max(rn) AS post_cnt FROM posts_rn),
cc AS (SELECT max(rn) AS cat_cnt FROM cats_rn)
INSERT INTO notifications (
  notification_id,
  user_id,
  post_id,
  category_id,
  notification_type,
  title,
  content,
  is_read,
  created_at
)
SELECT
  gen_random_uuid(),
  u.user_id,
  CASE WHEN (g % 3) = 0 THEN p.post_id ELSE NULL END,
  CASE WHEN (g % 3) = 0 THEN p.category_id ELSE c.category_id END,
  (CASE
    WHEN (g % 3) = 0 THEN 'NEW_POST_IN_INTEREST'
    WHEN (g % 3) = 1 THEN 'NEW_MESSAGE'
    ELSE 'NEW_RATING'
  END)::notifications_notification_type_enum,
  CASE
    WHEN (g % 3) = 0 THEN '🔔 Bài đăng mới'
    WHEN (g % 3) = 1 THEN '💬 Tin nhắn mới'
    ELSE '⭐ Đánh giá mới'
  END,
  CASE
    WHEN (g % 3) = 0 THEN 'Có bài đăng mới trong danh mục bạn quan tâm.'
    WHEN (g % 3) = 1 THEN 'Bạn có tin nhắn mới từ một người dùng.'
    ELSE 'Bạn vừa nhận được một đánh giá mới.'
  END,
  (random() > 0.6),
  now() - ((random() * 30)::int || ' days')::interval
FROM params
CROSS JOIN uc
CROSS JOIN pc
CROSS JOIN cc
CROSS JOIN generate_series(1, (SELECT notif_count FROM params)) g
JOIN users_rn u ON u.rn = 1 + (g % uc.user_cnt)
JOIN posts_rn p ON p.rn = 1 + ((g * 5) % pc.post_cnt)
JOIN cats_rn c ON c.rn = 1 + ((g * 7) % cc.cat_cnt);

COMMIT;
