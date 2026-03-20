#!/bin/bash

echo "Starting AI Chat Application..."
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo "Stopping services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "Done."
    exit 0
}

trap cleanup SIGINT SIGTERM

# Install backend dependencies if needed
if [ ! -d "apps/backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd apps/backend
    npm install
    if [ $? -ne 0 ]; then
        echo "Failed to install backend dependencies"
        exit 1
    fi
    cd ../..
    echo "✓ Backend dependencies installed"
fi

# Install frontend dependencies if needed
if [ ! -d "apps/frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd apps/frontend
    npm install
    if [ $? -ne 0 ]; then
        echo "Failed to install frontend dependencies"
        exit 1
    fi
    cd ../..
    echo "✓ Frontend dependencies installed"
fi

echo ""
echo "Starting services..."

# Start backend
cd apps/backend
npm run dev > ../../backend.log 2>&1 &
BACKEND_PID=$!
cd ../..

sleep 2

# Start frontend
cd apps/frontend
PORT=3001 BROWSER=none npm start > ../../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ../..

sleep 3

echo ""
echo "Services started!"
echo ""
echo "Frontend: http://localhost:3001"
echo "Backend:  http://localhost:5005"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
