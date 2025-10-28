# Quick Start Guide - LocalStack S3 Browser

## 🚀 Quick Setup (5 minutes)

### Prerequisites

- [Node.js](https://nodejs.org/) (version 14 or higher)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Step 1: Setup the Environment

```bash
# Clone or navigate to the project directory
cd LocalStack-S3-Browser

# Install dependencies and start LocalStack
npm run setup
```

### Step 2: Start the Application

```bash
npm start
```

That's it! The application should now be running.

## ✅ Quick Test

1. **Test Connection**: Click "Test Connection" in the top-right corner
2. **Create a Bucket**: Enter a name like "my-test-bucket" and click "Create"
3. **Upload a File**: Select the bucket, click "Upload", and choose any file
4. **Download the File**: Click the download button next to your uploaded file

## 🐛 Troubleshooting

### LocalStack not starting?

```bash
# Check Docker is running
docker --version

# Check LocalStack status
npm run localstack:logs

# Restart LocalStack
npm run localstack:stop
npm run localstack:start
```

### Can't connect to LocalStack?

- Make sure Docker Desktop is running
- Wait 10-15 seconds after starting LocalStack
- Check that port 4566 is not blocked by firewall

### App won't start?

```bash
# Clean install
rm -rf node_modules
npm install
npm start
```

## 📚 What's Next?

- Read the full [README.md](README.md) for detailed documentation
- Explore the `scripts/` folder for additional utilities
- Check out the Material Design UI components

## 🔧 Development Mode

For development with DevTools:

```bash
npm run dev
```

## 🛑 Stop Everything

```bash
npm run clean
```

This stops LocalStack and cleans up Docker resources.

---

**Need help?** Check the main [README.md](README.md) or the [troubleshooting section](#troubleshooting) above.
