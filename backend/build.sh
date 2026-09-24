#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== Upgrading pip ==="
pip install --upgrade pip

echo "=== Installing pre-compiled dlib-bin wheel ==="
pip install dlib-bin Click

echo "=== Installing face_recognition_models from git ==="
pip install git+https://github.com/ageitgey/face_recognition_models.git

echo "=== Installing face-recognition without compiling dlib ==="
pip install face-recognition --no-deps

echo "=== Installing backend dependencies ==="
if [ -f "$SCRIPT_DIR/requirements.txt" ]; then
    pip install -r "$SCRIPT_DIR/requirements.txt"
elif [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
elif [ -f "backend/requirements.txt" ]; then
    pip install -r backend/requirements.txt
fi

echo "=== Build completed successfully ==="

