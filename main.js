const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs").promises;
const S3Service = require("./src/services/s3Service");

class ElectronApp {
  constructor() {
    this.mainWindow = null;
    this.s3Service = new S3Service();
    this.setupApp();
    this.setupIPC();
  }

  setupApp() {
    // Disable hardware acceleration to prevent GPU process crashes
    app.disableHardwareAcceleration();

    // Additional GPU-related command line switches for Windows compatibility
    app.commandLine.appendSwitch("--no-sandbox");
    app.commandLine.appendSwitch("--disable-gpu-sandbox");
    app.commandLine.appendSwitch("--disable-software-rasterizer");

    // Optional: completely disable GPU if still having issues
    if (process.env.DISABLE_GPU === "true") {
      app.commandLine.appendSwitch("--disable-gpu");
      app.commandLine.appendSwitch("--disable-gpu-compositing");
    }

    app.whenReady().then(() => {
      this.createWindow();

      app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createWindow();
        }
      });
    });

    app.on("window-all-closed", () => {
      if (process.platform !== "darwin") {
        app.quit();
      }
    });
  }

  createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, "src", "preload.js"),
        webSecurity: true,
        enableRemoteModule: false,
        experimentalFeatures: false,
      },
      icon: path.join(__dirname, "assets", "icon.png"),
      titleBarStyle: "default",
      show: false,
    });

    this.mainWindow.loadFile("src/index.html");

    // Show window when ready to prevent visual flash
    this.mainWindow.once("ready-to-show", () => {
      this.mainWindow.show();
    });

    // Open DevTools in development
    if (process.argv.includes("--dev")) {
      this.mainWindow.webContents.openDevTools();
    }
  }

  setupIPC() {
    // Bucket operations
    ipcMain.handle("list-buckets", async () => {
      try {
        return await this.s3Service.listBuckets();
      } catch (error) {
        throw new Error(`Failed to list buckets: ${error.message}`);
      }
    });

    ipcMain.handle("create-bucket", async (event, bucketName) => {
      try {
        return await this.s3Service.createBucket(bucketName);
      } catch (error) {
        throw new Error(`Failed to create bucket: ${error.message}`);
      }
    });

    ipcMain.handle("delete-bucket", async (event, bucketName) => {
      try {
        return await this.s3Service.deleteBucket(bucketName);
      } catch (error) {
        throw new Error(`Failed to delete bucket: ${error.message}`);
      }
    });

    // Object operations
    ipcMain.handle("list-objects", async (event, bucketName, prefix = "") => {
      try {
        return await this.s3Service.listObjects(bucketName, prefix);
      } catch (error) {
        throw new Error(`Failed to list objects: ${error.message}`);
      }
    });

    ipcMain.handle("upload-file", async (event, bucketName, key, filePath) => {
      try {
        const fileContent = await fs.readFile(filePath);
        return await this.s3Service.uploadFile(bucketName, key, fileContent);
      } catch (error) {
        throw new Error(`Failed to upload file: ${error.message}`);
      }
    });

    ipcMain.handle("download-file", async (event, bucketName, key) => {
      try {
        const result = await dialog.showSaveDialog(this.mainWindow, {
          defaultPath: key.split("/").pop(),
          filters: [{ name: "All Files", extensions: ["*"] }],
        });

        if (!result.canceled && result.filePath) {
          const data = await this.s3Service.downloadFile(bucketName, key);
          await fs.writeFile(result.filePath, data);
          return { success: true, path: result.filePath };
        }
        return { success: false, canceled: true };
      } catch (error) {
        throw new Error(`Failed to download file: ${error.message}`);
      }
    });

    ipcMain.handle("delete-object", async (event, bucketName, key) => {
      try {
        return await this.s3Service.deleteObject(bucketName, key);
      } catch (error) {
        throw new Error(`Failed to delete object: ${error.message}`);
      }
    });

    // File dialog operations
    ipcMain.handle("show-open-dialog", async () => {
      try {
        const result = await dialog.showOpenDialog(this.mainWindow, {
          properties: ["openFile", "multiSelections"],
          filters: [{ name: "All Files", extensions: ["*"] }],
        });
        return result;
      } catch (error) {
        throw new Error(`Failed to show file dialog: ${error.message}`);
      }
    });

    // Connection test
    ipcMain.handle("test-connection", async () => {
      try {
        return await this.s3Service.testConnection();
      } catch (error) {
        throw new Error(`Connection test failed: ${error.message}`);
      }
    });
  }
}

// Initialize the application
new ElectronApp();
