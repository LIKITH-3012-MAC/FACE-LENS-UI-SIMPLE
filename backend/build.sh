#!/usr/bin/env bash
set -e

echo "=== Upgrading pip ==="
pip install --upgrade pip

echo "=== Installing pre-compiled dlib-bin wheel ==="
pip install dlib-bin

echo "=== Installing face-recognition without compiling dlib ==="
pip install face-recognition --no-deps

echo "=== Installing backend dependencies ==="
pip install -r requirements.txt

echo "=== Build completed successfully ==="
