@echo off
echo Starting LocalStack with Docker Compose...
docker-compose up -d

echo Waiting for LocalStack to be ready...
timeout /t 10 /nobreak > nul

echo Testing LocalStack connection...
curl -s http://localhost:4566/health > nul
if %errorlevel% == 0 (
    echo LocalStack is ready!
    echo You can now start the Electron app with: npm start
) else (
    echo LocalStack may not be ready yet. Please check the logs with: docker-compose logs
)