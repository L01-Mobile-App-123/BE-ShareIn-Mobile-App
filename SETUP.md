# Setup Guide - Đổi Đồ Backend

## Prerequisites

- Node.js v18+
- Docker & Docker Compose
- npm or yarn
- Git

## Installation Steps

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd BE-ShareIn-Mobile-App-main
npm install
```

### 2. Setup Environment Variables

Create a `.env` file in the root directory:

```
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=postgres
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres

# Firebase
FIREBASE_PROJECT_ID=test-project
FIREBASE_PRIVATE_KEY_ID=key-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=firebase@test-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token

# Server
PORT=3000
NODE_ENV=development

# Cloudinary (optional for image upload)
CLOUDINARY_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 3. Start Docker Containers

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database (`postgres-sharein`)
- Other services if defined in docker-compose.yml

### 4. Verify Database Connection

```bash
docker exec postgres-sharein psql -U postgres -d postgres -c "SELECT version();"
```

### 5. Run Migrations (if applicable)

```bash
npm run typeorm migration:run
```

### 6. **IMPORTANT: Seed Test Data**

To populate the database with sample data for testing all API endpoints:

```bash
# Copy seed data script to container
docker cp seed_data.sql postgres-sharein:/tmp/

# Execute the seed script
docker exec postgres-sharein psql -U postgres -d postgres -f /tmp/seed_data.sql
```

This will insert:
- 10 sample posts
- 15 user interests
- 25 conversations
- 20 messages
- 10 notifications
- 15 ratings

**Note**: Seed data uses existing users and categories. Make sure database has base data before seeding.

### 7. Start Development Server

```bash
npm run start:dev
```

Server will start on `http://localhost:3000`

## Accessing the Application

### API Endpoints
- **Base URL**: `http://localhost:3000/api/v1`
- **Swagger UI**: `http://localhost:3000/api/docs`

### Example: Create Test Token and Make API Call

**1. Generate a test Firebase token:**

```bash
curl -X POST http://localhost:3000/api/v1/auth/test-token \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "test-user-001",
    "email": "test@example.com"
  }'
```

Response example:
```json
{
  "idToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**2. Use the token to call protected endpoints:**

```bash
curl -X GET http://localhost:3000/api/v1/posts \
  -H "Authorization: Bearer <your-token>"
```

## Available API Endpoints

### Auth
- `POST /auth/test-token` - Generate test Firebase token
- `POST /auth/verify` - Verify token
- `POST /auth/log-out` - Logout

### Posts
- `GET /posts/categories` - Get all categories
- `GET /posts` - Get all posts with filters
- `POST /posts` - Create new post
- `GET /posts/:postId` - Get post details
- `PATCH /posts/:postId` - Update post
- `GET /posts/me` - Get user's own posts
- `POST /posts/:postId/repost` - Repost item

### Users
- `GET /users` - Get current user info
- `PATCH /users` - Update user profile
- `PATCH /users/avatar` - Update avatar

### Chat/Conversations
- `GET /conversations` - Get all conversations
- `POST /conversations` - Create or get conversation
- `GET /conversations/:id/messages` - Get conversation messages
- `POST /conversations/messages` - Send message
- `PATCH /conversations/:id/read` - Mark as read
- `POST /conversations/block` - Block user
- `POST /conversations/unblock` - Unblock user

### Notifications
- `GET /notification` - Get notifications
- `PATCH /notification/:id/read` - Mark notification as read
- `PATCH /notification/read-all` - Mark all as read
- `DELETE /notification/:id` - Delete notification

### Ratings
- `POST /ratings` - Create rating
- `GET /ratings/user/:userId` - Get user ratings
- `GET /ratings/user/:userId/stats` - Get rating stats
- `GET /ratings/me/given` - Get ratings I gave
- `GET /ratings/me/received` - Get ratings I received

### Search
- `GET /search` - Search posts with filters
- `GET /search/suggestions` - Get search suggestions
- `GET /search/history` - Get search history

### User Interests
- `GET /user-interests` - Get user interests
- `PUT /user-interests` - Update user interests

## Database Inspection

### View all tables and row counts

```bash
# List all tables
docker exec postgres-sharein psql -U postgres -d postgres -c "\dt"

# Count rows in each table
docker exec postgres-sharein psql -U postgres -d postgres -c "
SELECT 
  schemaname,
  tablename,
  (SELECT COUNT(*) FROM information_schema.tables t2 WHERE t2.tablename=tables.tablename) as count
FROM information_schema.tables
WHERE schemaname='public'
ORDER BY tablename;
"
```

### Export data to CSV

```bash
# Export users
docker exec postgres-sharein psql -U postgres -d postgres -c "\copy users TO STDOUT WITH CSV HEADER" > users.csv

# Export posts
docker exec postgres-sharein psql -U postgres -d postgres -c "\copy posts TO STDOUT WITH CSV HEADER" > posts.csv

# Export all tables
docker exec postgres-sharein pg_dump -U postgres postgres --format=plain > database_backup.sql
```

## Troubleshooting

### Port Already in Use
If port 3000 is already in use:
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Database Connection Error
```bash
# Check if PostgreSQL container is running
docker ps | grep postgres

# Check container logs
docker logs postgres-sharein

# Restart container
docker restart postgres-sharein
```

### Seed Data Error
```bash
# Check if seed_data.sql exists
ls seed_data.sql

# Re-run seed
docker cp seed_data.sql postgres-sharein:/tmp/seed_data.sql
docker exec postgres-sharein psql -U postgres -d postgres -f /tmp/seed_data.sql
```

## Development Tips

- Use Swagger UI (`/api/docs`) for interactive API testing
- Check server logs: `npm run start:dev` output
- Database changes require container restart if using TypeORM

## Next Steps

- Implement frontend (React Native)
- Add real Firebase authentication
- Setup CI/CD pipeline
- Configure production database
- Add monitoring and logging

## Support

For issues or questions, refer to the README.md or contact the development team.
