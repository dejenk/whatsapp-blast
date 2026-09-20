# Setup Guide - WhatsApp Blast

## Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)
- PostgreSQL 13+ (if running without Docker)
- Redis 6+ (if running without Docker)

## Quick Start with Docker

```bash
# Clone repository
git clone https://github.com/dejenk/whatsapp-blast.git
cd whatsapp-blast

# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f
```

## Access Applications
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **API Docs:** http://localhost:3001/api/docs (coming soon)
- **Database:** localhost:5432 (blast_user / blast_secure_pass_123)
- **Redis:** localhost:6379 (password: redis_secure_pass_123)

## Local Development (Without Docker)

### Backend
```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env with your database & Redis credentials

# Start server
npm run dev
```

### Frontend
```bash
cd frontend
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" > .env.local

# Start development server
npm run dev
# Open http://localhost:3000
```

## Database Migrations
Migrations run automatically on backend startup. To force re-run:
```bash
cd backend
npm run migrate
```

## Configuration

### Environment Variables (backend/.env)
```
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USER=blast_user
DB_PASSWORD=your_secure_password
DB_NAME=whatsapp_blast
REDIS_URL=redis://localhost:6379
WHATSAPP_API_URL=https://graph.instagram.com/v18.0
WHATSAPP_PHONE_ID=your_phone_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_WEBHOOK_TOKEN=your_webhook_token
HERMES_API_URL=http://hermes-api
HERMES_API_KEY=your_hermes_key
```

## Testing API

```bash
# Health check
curl http://localhost:3001/health

# List campaigns
curl http://localhost:3001/api/campaigns

# Create contact
curl -X POST http://localhost:3001/api/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "1234567890",
    "name": "John Doe",
    "email": "john@example.com"
  }'
```

## Troubleshooting

### Port Already in Use
```bash
# Kill process using port 3001
lsof -ti :3001 | xargs kill -9
```

### Database Connection Error
- Ensure PostgreSQL is running
- Check DB credentials in .env
- Verify network connectivity

### Redis Connection Error
- Ensure Redis is running
- Check REDIS_URL format
- Verify Redis password if set

## Production Deployment
- Use environment-based configuration
- Enable HTTPS/SSL certificates
- Setup database backups
- Configure monitoring & alerting
- Use secrets manager for sensitive data

## Support
For issues or questions, please open a GitHub issue.
