const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // Bucket operations
  listBuckets: () => ipcRenderer.invoke("list-buckets"),
  createBucket: (bucketName) => ipcRenderer.invoke("create-bucket", bucketName),
  deleteBucket: (bucketName) => ipcRenderer.invoke("delete-bucket", bucketName),

  // Object operations
  listObjects: (bucketName, prefix) =>
    ipcRenderer.invoke("list-objects", bucketName, prefix),
  uploadFile: (bucketName, key, filePath) =>
    ipcRenderer.invoke("upload-file", bucketName, key, filePath),
  downloadFile: (bucketName, key) =>
    ipcRenderer.invoke("download-file", bucketName, key),
  deleteObject: (bucketName, key) =>
    ipcRenderer.invoke("delete-object", bucketName, key),

  // File dialog
  showOpenDialog: () => ipcRenderer.invoke("show-open-dialog"),

  // Connection test
  testConnection: () => ipcRenderer.invoke("test-connection"),
});
