# LocalStack S3 Browser

An Electron application for managing S3 buckets and objects using LocalStack for local development.

## Features

- Bucket Management: Create, delete, and list S3 buckets
- Object Management: Upload, download, and delete files
- Material Design UI: Clean and intuitive user interface
- LocalStack Integration: Works with LocalStack for local S3 development
- Connection Testing: Test connection to LocalStack service

## Prerequisites

- Node.js (version 14 or higher)
- Docker and Docker Compose
- LocalStack (configured via Docker Compose)

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd LocalStack-S3-Browser
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

### 1. Start LocalStack

First, start LocalStack using Docker Compose:

```bash
docker-compose up -d
```

This will start LocalStack on port 4566 with S3 service enabled.

### 2. Start the Electron App

```bash
npm start
```

For development mode with DevTools:

```bash
npm run dev
```

## Usage

### Connecting to LocalStack

1. Click the "Test Connection" button in the top navigation to verify connection to LocalStack
2. The app will automatically connect to LocalStack running on `http://localhost:4566`

### Managing Buckets

1. Create Bucket: Enter a bucket name and click "Create"
2. List Buckets: Buckets are automatically loaded and displayed in the left panel
3. Select Bucket: Click the folder icon to select and view bucket contents
4. Delete Bucket: Click the delete icon (bucket must be empty)

### Managing Objects

1. Select a Bucket: First select a bucket from the left panel
2. Upload File: Click "Upload" and select a file from your system
3. Download File: Click the download icon next to any object
4. Delete Object: Click the delete icon next to any object

### Bucket Naming Rules

- 3-63 characters long
- Start and end with lowercase letter or number
- Only lowercase letters, numbers, and hyphens
- No consecutive hyphens
- Cannot be formatted as an IP address

## Development

### Project Structure

```
LocalStack-S3-Browser/
├── main.js                    # Main Electron process
├── package.json              # Dependencies and scripts
├── package-scripts.json      # NPM scripts configuration
├── docker-compose.yml        # LocalStack configuration
├── start-localstack.bat      # Windows LocalStack starter
├── LICENSE                   # MIT License
├── README.md                 # Main documentation
├── QUICKSTART.md             # Quick start guide
├── assets/                   # Application assets (empty)
├── scripts/                  # Development and utility scripts
│   ├── README.md            # Scripts documentation
│   ├── setup-dev.bat        # Windows development setup
│   ├── setup-dev.sh         # Linux/macOS development setup
│   ├── start-localstack.bat # Windows LocalStack starter
│   ├── start-localstack.sh  # Linux/macOS LocalStack starter
│   └── start-no-gpu.bat     # Windows LocalStack without GPU
└── src/                      # Application source code
    ├── index.html           # Main HTML file
    ├── styles.css           # CSS styles
    ├── renderer.js          # Renderer process logic
    ├── preload.js           # Preload script for IPC
    ├── config/              # Configuration files
    │   └── electron-config.js
    ├── services/            # Service layer
    │   └── s3Service.js     # S3 operations service
    └── utils/               # Utility functions
        ├── logger.js        # Logging utilities
        └── validator.js     # Validation utilities
```

### Building

To package the application:

```bash
npm run pack
```

To create distribution files:

```bash
npm run dist
```

## Configuration

The application is configured to connect to LocalStack with the following default settings:

- Endpoint: http://localhost:4566
- Region: us-east-1
- Access Key ID: test
- Secret Access Key: test

These settings can be modified in `src/services/s3Service.js`.

## LocalStack Configuration

The included `docker-compose.yml` configures LocalStack with:

- S3 service enabled
- Debug mode enabled
- Data persistence in `./localstack-data` directory
- Web dashboard on port 8080 (if available)

## Troubleshooting

### Connection Issues

1. Ensure LocalStack is running: `docker-compose ps`
2. Check LocalStack logs: `docker-compose logs localstack`
3. Verify port 4566 is accessible
4. Use the "Test Connection" button in the app

### Common Errors

- Bucket already exists: Choose a different bucket name
- Bucket not empty: Delete all objects before deleting the bucket
- Connection refused: Ensure LocalStack is running and accessible

## Technologies Used

- Electron: Desktop application framework
- AWS SDK for JavaScript: S3 operations
- Materialize CSS: Material Design UI components
- LocalStack: Local AWS cloud stack
- Docker: Containerization for LocalStack

## License

This project is licensed under the MIT License - see the LICENSE file for details.
