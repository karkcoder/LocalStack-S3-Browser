#!/bin/bash

echo "Setting up development environment..."

echo "Installing npm dependencies..."
npm install

echo "Starting LocalStack..."
./scripts/start-localstack.sh

echo "Development environment setup complete!"
echo "Run 'npm start' to launch the application."