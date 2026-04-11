# Semicolon Squad - Full Setup & Integration Guide

This guide covers setting up the complete NyayaSetu system with all microservices integrated.

## System Architecture

```
┌─────────────────────────────────────────────────┐
│ Frontend (React/Vite)                           │
│ Port: 5173                                      │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│ Backend API (Node.js/Express)                   │
│ Port: 5000                                      │
│ Routes: /api/...                                │
└────────────┬────────────────────────────────────┘
             │
        ┌────┴────┐
        │          │
┌───────▼──┐   ┌───▼─────────────┐
│PostgreSQL│   │ ML Service      │
│Database  │   │ (Python/FastAPI)│
│Port: 5432│   │ Port: 8000      │
└──────────┘   └─────────────────┘
```

## Prerequisites

- **Node.js 20+** - For backend and frontend
- **Python 3.10+** - For ML service
- **PostgreSQL 16+** - For database (optional if using LocalDB)
- **Docker & Docker Compose** - For containerized deployment
- **Git** - For version control
- **npm** - Node package manager (comes with Node.js)
- **pip** - Python package manager

## Quick Start (Development Mode)

### 1. Start ML Service

#### Windows (PowerShell):
```powershell
cd ml-service
.\run.ps1
```

#### Linux/macOS:
```bash
cd ml-service
chmod +x run.sh
./run.sh
```

**Expected Output:**
```
Starting ML service on http://127.0.0.1:8000
API Documentation: http://127.0.0.1:8000/docs
Health Check: http://127.0.0.1:8000/health
```

### 2. Start Backend

In a new terminal:

#### Windows (PowerShell):
```powershell
cd backend
.\run.ps1
```

#### Linux/macOS:
```bash
cd backend
chmod +x run.sh
./run.sh
```

**Expected Output:**
```
Starting backend service on http://localhost:5000
```

### 3. Start Frontend

In another new terminal:

```bash
cd frontend
npm install
npm run dev
```

**Expected Output:**
```
Local: http://localhost:5173
```

## Docker Deployment

For a complete containerized setup:

```bash
# Build all images
docker-compose build

# Start all services
docker-compose up

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

Services will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- ML Service: http://localhost:8000
- Database: localhost:5432

## Testing ML Pipeline Integration

### 1. Health Check

Test if all services are running:

```bash
# Check ML Service
curl http://127.0.0.1:8000/health
# Expected: {"status":"ok","engine":"vihaan or fallback","vihaan_root":"..."}

# Check Backend (if available)
curl http://localhost:5000/api/health
```

### 2. Test Text Pipeline

```bash
curl -X POST http://127.0.0.1:8000/v1/pipeline/json \
  -H "Content-Type: application/json" \
  -d '{
    "raw_text": "Someone stole my bike",
    "language": "en"
  }'
```

**Expected Response:**
```json
{
  "transcript": "Someone stole my bike",
  "raw_complaint_text": "Someone stole my bike",
  "classifications": [
    {
      "section_number": "303",
      "confidence": 0.81,
      "title": "Fallback primary"
    }
  ],
  "primary_section_number": "303",
  "urgency_level": "HIGH",
  "severity_score": 0.81,
  "model_version": "vihaan-fallback-v1"
}
```

### 3. Test Audio Pipeline

```bash
curl -X POST http://127.0.0.1:8000/v1/pipeline \
  -F "audio=@recording.webm" \
  -F "language=hi" \
  -F "raw_text=some complaint text"
```

### 4. Test Backend Integration (Authenticated Route)

First, you need a victim account:

```bash
# Login (get JWT token)
curl -X POST http://localhost:5000/api/v1/victim/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "victim@test.com",
    "password": "password123",
    "phone": "+91-9876543210"
  }'

# Then test the ML pipeline route
curl -X POST http://localhost:5000/api/v1/victim/ml/pipeline \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "rawText": "Someone stole my bicycle",
    "language": "en"
  }'
```

## Environment Configuration

Key environment variables in `.env`:

```env
# Database
DATABASE_URL="postgresql://neondb_owner:password@localhost:5432/neondb"

# ML Service
ML_SERVICE_URL="http://127.0.0.1:8000"
ML_SERVICE_TIMEOUT_MS=120000

# Backend
NODE_ENV="development"
PORT=5000
APP_URL="http://localhost:5173"

# JWT Secrets (change these in production!)
JWT_ACCESS_SECRET="dev-secret-change-me"
JWT_REFRESH_SECRET="dev-secret-change-me"
```

## Common Issues & Solutions

### Issue 1: ML Service Returns 503 Error

**Problem:** Voice transcription is temporarily unavailable

**Causes:**
1. ML service is not running
2. ML service URL is incorrect in `.env`
3. Timeout is too short

**Solutions:**
```bash
# Check if ML service is running
curl http://127.0.0.1:8000/health

# Verify .env has correct ML_SERVICE_URL
cat .env | grep ML_SERVICE_URL

# Increase timeout in .env
ML_SERVICE_TIMEOUT_MS=300000  # 5 minutes

# Restart ML service
# Kill existing process and run .\run.ps1 or ./run.sh again
```

### Issue 2: Database Connection Failed

**Problem:** Backend can't connect to database

**Solutions:**
```bash
# Check DATABASE_URL in .env
echo $env:DATABASE_URL  # Windows PowerShell
echo $DATABASE_URL       # Linux/macOS

# Verify PostgreSQL is running
psql -h localhost -U neondb_owner -d neondb

# If using Docker
docker-compose up db
```

### Issue 3: CORS Errors on Frontend

**Problem:** Requests from frontend to backend are blocked

**Solutions:**
1. Ensure `APP_URL` in backend `.env` matches frontend URL
2. Check `CORS_ORIGINS` environment variable
3. Verify backend is running

```env
APP_URL="http://localhost:5173"
CORS_ORIGINS="http://localhost:5173,http://localhost:3000"
```

### Issue 4: Port Already in Use

**Problem:** Port 5000, 8000, or 5173 is already in use

**Solutions:**
```bash
# Windows - Find and kill process using port
# For port 5000:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/macOS - For port 5000:
lsof -i :5000
kill -9 <PID>

# Or use different ports in .env
PORT=5001
```

## Project Structure

```
Semicolon-Squad/
├── backend/                    # Node.js/Express API
│   ├── src/
│   │   ├── services/
│   │   │   └── ml/            # ML integration
│   │   ├── controllers/
│   │   │   └── victim/        # Victim routes
│   │   ├── middleware/        # Auth, validation, etc.
│   │   └── config/            # Configuration files
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── run.ps1 & run.sh       # Startup scripts
│   └── package.json
│
├── frontend/                   # React/Vite app
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   │   └── mlPipelineService.ts
│   │   └── styles/
│   ├── Dockerfile
│   ├── vite.config.ts
│   └── package.json
│
├── ml-service/                 # Python/FastAPI ML
│   ├── main.py                # FastAPI app with routes
│   ├── requirements.txt        # Python dependencies
│   ├── Dockerfile
│   ├── run.ps1 & run.sh       # Startup scripts
│   └── Vihaan-ML-2/           # ML model (optional)
│
├── prisma/                     # Database schema
│   └── schema.prisma
│
├── docker-compose.yml          # Full stack deployment
├── .env                        # Environment variables
└── README.md                   # This file
```

## API Endpoints

### ML Service (Python)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health status |
| `/v1/pipeline/json` | POST | Process text complaint |
| `/v1/pipeline` | POST | Process audio + text complaint |
| `/v1/classify` | POST | Classify text only |
| `/v1/transcribe` | POST | Transcribe audio only |

### Backend API

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/victim/auth/register` | POST | - | Register victim |
| `/api/v1/victim/auth/login` | POST | - | Login victim |
| `/api/v1/victim/ml/pipeline` | POST | Bearer | Submit complaint with ML analysis |
| `/api/v1/victim/complaints` | GET | Bearer | Get victim's complaints |
| `/api/health` | GET | - | API health check |

## Development Workflow

### Adding New Environment Variables

1. Add to `.env`:
   ```env
   NEW_VAR="value"
   ```

2. Update `backend/src/config/env.ts`:
   ```typescript
   newVar: process.env.NEW_VAR ?? 'default-value',
   ```

3. Use in code:
   ```typescript
   import { env } from './config/env';
   console.log(env.newVar);
   ```

### Debugging ML Integration

Check backend logs:
```bash
# Watch real-time logs (development mode)
npm run dev

# Check error middleware responses
# Look for "ML pipeline failed" in logs
```

Check ML service logs:
```bash
# Python service logs will show during run.ps1 or run.sh execution
# Look for "[ML]" prefixed messages
```

## Production Deployment

### Before Going Live

1. **Update Secrets:**
   ```env
   JWT_ACCESS_SECRET="production-random-secret-here"
   JWT_REFRESH_SECRET="production-random-secret-here"
   DATABASE_URL="production-database-url"
   ```

2. **Update CORS:**
   ```env
   APP_URL="https://yourdomain.com"
   CORS_ORIGINS="https://yourdomain.com"
   COOKIE_SECURE=true
   NODE_ENV="production"
   ```

3. **Database Migration:**
   ```bash
   npm run prisma:push
   ```

4. **Build Images:**
   ```bash
   docker-compose build --no-cache
   ```

5. **Run Services:**
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

## Support & Troubleshooting

- **ML Service Documentation:** http://localhost:8000/docs
- **Backend Logs:** Check terminal output
- **Frontend Console:** Open DevTools (F12) in browser
- **Database Logs:** `docker logs nyayasetu-db`

## License

Part of the Semicolon Squad NyayaSetu Project
