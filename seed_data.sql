-- Insert Posts from existing users and categories
INSERT INTO posts(post_id, user_id, category_id, title, description, transaction_type)
SELECT 
  gen_random_uuid(),
  (SELECT user_id FROM users ORDER BY random() LIMIT 1),
  (SELECT category_id FROM categories ORDER BY random() LIMIT 1),
  'Sample Post ' || substr(gen_random_uuid()::text, 1, 8),
  'This is a test post for diverse data.',
  'BAN_RE'
FROM generate_series(1, 10)
ON CONFLICT DO NOTHING;

-- Insert User Interests from existing users and categories
INSERT INTO user_interests(interest_id, user_id, category_id, keywords, is_active)
SELECT
  gen_random_uuid(),
  (SELECT user_id FROM users ORDER BY random() LIMIT 1),
  (SELECT category_id FROM categories ORDER BY random() LIMIT 1),
  'keyword1,keyword2,keyword3',
  TRUE
FROM generate_series(1, 15)
ON CONFLICT DO NOTHING;

-- Insert Conversations between random pairs of users
INSERT INTO conversations(conversation_id, initiator_id, recipient_id, last_message_at)
SELECT
  gen_random_uuid(),
  u1.user_id,
  u2.user_id,
  now()
FROM (SELECT user_id FROM users ORDER BY random() LIMIT 5) u1,
     (SELECT user_id FROM users ORDER BY random() LIMIT 5) u2
WHERE u1.user_id != u2.user_id
ON CONFLICT DO NOTHING;

-- Insert Messages to conversations
INSERT INTO messages(message_id, conversation_id, sender_id, content, message_type)
SELECT
  gen_random_uuid(),
  c.conversation_id,
  (SELECT user_id FROM users ORDER BY random() LIMIT 1),
  'Test message ' || row_number() OVER (),
  'text'
FROM conversations c
LIMIT 20
ON CONFLICT DO NOTHING;

-- Insert Notifications
INSERT INTO notifications(notification_id, user_id, post_id, notification_type, title, content, is_read)
SELECT
  gen_random_uuid(),
  (SELECT user_id FROM users ORDER BY random() LIMIT 1),
  (SELECT post_id FROM posts ORDER BY random() LIMIT 1),
  'NEW_POST_IN_INTEREST',
  'New post available',
  'A new post was added in your interest category',
  FALSE
FROM generate_series(1, 10)
ON CONFLICT DO NOTHING;

-- Insert Ratings
INSERT INTO ratings(rating_id, rater_id, rated_user_id, rating_score, comment)
SELECT
  gen_random_uuid(),
  (SELECT user_id FROM users ORDER BY random() LIMIT 1),
  (SELECT user_id FROM users ORDER BY random() LIMIT 1),
  (ARRAY[1,2,3,4,5])[floor(random()*5)+1],
  'Good seller / buyer'
FROM generate_series(1, 15)
ON CONFLICT DO NOTHING;
