# Development Scripts

This directory contains helpful scripts for development and deployment.

## Available Scripts

### start-localstack.sh / start-localstack.bat

Starts LocalStack using Docker Compose with proper configuration.

### setup-dev.sh / setup-dev.bat

Sets up the development environment by installing dependencies and starting LocalStack.

### start-no-gpu.bat

Starts LocalStack without GPU acceleration for systems that don't support it.

## Usage

### Linux/macOS

```bash
chmod +x scripts/*.sh
./scripts/start-localstack.sh
```

### Windows

```batch
scripts\start-localstack.bat
```
