#!/bin/bash

echo "Stopping services..."

# Kill processes on ports 3001 and 5005
FRONTEND_PID=$(lsof -ti:3001)
BACKEND_PID=$(lsof -ti:5005)

[ ! -z "$FRONTEND_PID" ] && kill $FRONTEND_PID && echo "Frontend stopped"
[ ! -z "$BACKEND_PID" ] && kill $BACKEND_PID && echo "Backend stopped"

echo "Done."
