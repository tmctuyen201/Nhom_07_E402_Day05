#!/bin/bash
# Railway start script for VinFast Assistant

# Set default environment variables
export ENVIRONMENT=${ENVIRONMENT:-production}
export PORT=${PORT:-8000}
export HOST=${HOST:-0.0.0.0}

# Start the FastAPI application
exec uvicorn backend.main:app --host $HOST --port $PORT