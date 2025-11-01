#!/bin/bash
echo "🚀 Starting AlgoTrading AI System..."

# Start backend in background
echo "📡 Starting FastAPI backend on :8000..."
cd backend
pip install -r requirements.txt -q
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

# Wait for backend
sleep 3

# Start frontend
echo "🎨 Starting Next.js frontend on :3000..."
cd frontend
npm install -q
npm run dev &
FRONTEND_PID=$!

echo "✅ Both services running"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"

wait $BACKEND_PID $FRONTEND_PID
