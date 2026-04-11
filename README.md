# 🏛️ NyayaSetu - Semicolon Squad

A comprehensive digital platform for simplified crime complaint registration, classification, and victim support in India.

## 🚀 Quick Start

### One-Command Setup (Windows)
```powershell
.\start-all.ps1
```

### One-Command Setup (Linux/macOS)
```bash
chmod +x start-all.sh
./start-all.sh
```

This will launch all services in separate terminals:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **ML Service**: http://127.0.0.1:8000

## 📋 Manual Setup (If Needed)

### Prerequisites
- Node.js 20+
- Python 3.10+
- PostgreSQL 16+ (optional, we provide Docker)

### 1. ML Service (Python)
```powershell
cd ml-service
.\run.ps1
# Wait for: "Starting ML service on http://127.0.0.1:8000"
```

### 2. Backend API (Node.js)
```powershell
cd backend
.\run.ps1
# Waits for: "Starting backend service on http://localhost:5000"
```

### 3. Frontend (React)
```bash
cd frontend
npm install
npm run dev
# Opens: http://localhost:5173
```

## 🧪 Test ML Integration

### Windows:
```powershell
.\test-ml-integration.ps1
```

### Linux/macOS:
```bash
chmod +x test-ml-integration.sh
./test-ml-integration.sh
```

## 📚 Full Documentation

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for:
- Detailed architecture
- Environment configuration
- API endpoint documentation
- Troubleshooting guides
- Production deployment

## 🐳 Docker Deployment

```bash
# Build all images
docker-compose build

# Start all services
docker-compose up

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📁 Project Structure

```
├── backend/              # Node.js/Express API
│   ├── src/
│   │   ├── services/ml/  # ML integration
│   │   ├── controllers/  # API endpoints
│   │   └── config/       # Configuration
│   └── run.ps1 & run.sh  # Startup scripts
│
├── frontend/             # React/Vite UI
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/     # API calls
│   └── run.ps1 & run.sh  # Startup scripts
│
├── ml-service/           # Python/FastAPI ML
│   ├── main.py           # FastAPI app
│   └── run.ps1 & run.sh  # Startup scripts
│
└── docker-compose.yml    # Full stack setup
```

## 🔧 Key Features

### Backend API
- ✅ User authentication (Victim, Officer, Admin)
- ✅ Complaint submission with ML analysis
- ✅ Crime classification using Vihaan-ML-2
- ✅ Zero FIR support
- ✅ Victim rights information
- ✅ Database management with PostgreSQL

### ML Service
- ✅ Audio transcription (Whisper)
- ✅ Named Entity Recognition
- ✅ Crime classification (IndicBERT)
- ✅ Urgency detection
- ✅ Victim rights generation
- ✅ Fallback heuristics for robustness

### Frontend
- ✅ Multi-language support (English, Hindi)
- ✅ Responsive design
- ✅ Real-time audio recording
- ✅ Live transcript display
- ✅ Role-based UI (Victim, Officer, Admin)

## 🛠️ Configuration

Key environment variables in `.env`:

```env
# Database Connection
DATABASE_URL="postgresql://user:password@host:port/database"

# ML Service Location
ML_SERVICE_URL="http://127.0.0.1:8000"

# JWT Secrets
JWT_ACCESS_SECRET="your-secret-here"
JWT_REFRESH_SECRET="your-secret-here"

# API Settings
PORT=5000
APP_URL="http://localhost:5173"
NODE_ENV="development"
```

## ❓ Troubleshooting

### Issue: "503 Service Unavailable" on Voice Transcription
1. Check ML service is running: `curl http://127.0.0.1:8000/health`
2. Verify `ML_SERVICE_URL` in `.env`
3. Ensure port 8000 is not blocked by firewall

### Issue: "Cannot connect to database"
1. Start PostgreSQL service
2. Verify `DATABASE_URL` in `.env`
3. Check database credentials

### Issue: "Port already in use"
```powershell
# Windows - Kill process on port
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/macOS
lsof -i :8000 | grep LISTEN
kill -9 <PID>
```

## 📖 API Documentation

Once the ML service is running, visit:
- **Swagger UI**: http://127.0.0.1:8000/docs
- **ReDoc**: http://127.0.0.1:8000/redoc

## 🤝 Contributing

Current team: Semicolon Squad

## 📄 License

This project is part of a collaborative educational initiative.

## 📞 Support

For issues or questions:
1. Check [SETUP_GUIDE.md](./SETUP_GUIDE.md) troubleshooting section
2. Review service logs in terminal windows
3. Open an issue with detailed error messages

---

**Last Updated:** April 12, 2026
**Status:** ✅ Production Ready
