#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================="
echo "    Starting Naive RAG Studio (React + Python)"
echo "=========================================="

# Check venv
if [ ! -d "$DIR/backend/venv" ]; then
    echo "Creating Python virtual environment in backend/venv..."
    python3 -m venv "$DIR/backend/venv"
    "$DIR/backend/venv/bin/pip" install -r "$DIR/backend/requirements.txt"
fi

# Check frontend node_modules
if [ ! -d "$DIR/frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    (cd "$DIR/frontend" && npm install)
fi

echo "Starting Backend API on http://127.0.0.1:8000 ..."
(cd "$DIR/backend" && PYTHONPATH=. ./venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload) &
BACKEND_PID=$!

echo "Starting React Frontend on http://localhost:3000 ..."
(cd "$DIR/frontend" && BROWSERSLIST_CONFIG=.browserslistrc npm run dev -- --host 127.0.0.1 --port 3000) &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true; exit" SIGINT SIGTERM

echo "------------------------------------------"
echo "Naive RAG Studio is running!"
echo "Backend:  http://127.0.0.1:8000"
echo "Frontend: http://127.0.0.1:3000"
echo "Press Ctrl+C to stop both servers."
echo "------------------------------------------"

wait

