#!/bin/bash

echo "Starting LocalStack with Docker Compose..."
docker-compose up -d

echo "Waiting for LocalStack to be ready..."
sleep 10

echo "Testing LocalStack connection..."
if curl -s http://localhost:4566/health > /dev/null; then
    echo "LocalStack is ready!"
    echo "You can now start the Electron app with: npm start"
else
    echo "LocalStack may not be ready yet. Please check the logs with: docker-compose logs"
fi