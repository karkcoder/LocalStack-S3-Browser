// LocalStack S3 Browser - Renderer Process
class S3Browser {
  constructor() {
    this.currentBucket = null;
    this.buckets = [];
    this.objects = [];
    this.init();
  }

  init() {
    this.initializeMaterialize();
    this.setupEventListeners();
    this.loadBuckets();
    this.testConnection();
  }

  initializeMaterialize() {
    // Initialize modals
    M.Modal.init(document.querySelectorAll(".modal"));

    // Initialize tooltips if any
    M.Tooltip.init(document.querySelectorAll(".tooltipped"));
  }

  setupEventListeners() {
    // Connection test
    document.getElementById("test-connection").addEventListener("click", () => {
      this.testConnection();
    });

    // Bucket operations
    document.getElementById("create-bucket").addEventListener("click", () => {
      this.createBucket();
    });

    document.getElementById("refresh-buckets").addEventListener("click", () => {
      this.loadBuckets();
    });

    // Object operations
    document.getElementById("upload-file").addEventListener("click", () => {
      this.uploadFile();
    });

    document.getElementById("refresh-objects").addEventListener("click", () => {
      this.loadObjects();
    });

    // Enter key handling for bucket creation
    document.getElementById("bucket-name").addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.createBucket();
      }
    });

    // Enter key handling for object key
    document.getElementById("object-key").addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.uploadFile();
      }
    });
  }

  async testConnection() {
    this.showLoading("Testing connection to LocalStack...");

    try {
      const result = await window.electronAPI.testConnection();
      this.hideLoading();

      if (result.success) {
        this.showConnectionStatus(
          "Connected to LocalStack successfully",
          "success"
        );
        this.showToast("Connection successful", "green");
      } else {
        this.showConnectionStatus("Failed to connect to LocalStack", "error");
        this.showToast("Connection failed", "red");
      }
    } catch (error) {
      this.hideLoading();
      this.showConnectionStatus(`Connection error: ${error.message}`, "error");
      this.showToast(`Connection error: ${error.message}`, "red");
    }
  }

  async loadBuckets() {
    this.showLoading("Loading buckets...");

    try {
      const buckets = await window.electronAPI.listBuckets();
      this.buckets = buckets;
      this.renderBuckets();
      this.hideLoading();
      this.showToast(`Loaded ${buckets.length} bucket(s)`, "blue");
    } catch (error) {
      this.hideLoading();
      this.showToast(`Error loading buckets: ${error.message}`, "red");
      console.error("Error loading buckets:", error);
    }
  }

  async createBucket() {
    const bucketNameInput = document.getElementById("bucket-name");
    const bucketName = bucketNameInput.value.trim();

    if (!bucketName) {
      this.showToast("Please enter a bucket name", "orange");
      return;
    }

    if (!this.isValidBucketName(bucketName)) {
      this.showToast(
        "Invalid bucket name. Use lowercase letters, numbers, and hyphens only.",
        "red"
      );
      return;
    }

    this.showLoading("Creating bucket...");

    try {
      await window.electronAPI.createBucket(bucketName);
      bucketNameInput.value = "";
      M.updateTextFields();
      this.hideLoading();
      this.showToast(`Bucket "${bucketName}" created successfully`, "green");
      this.loadBuckets();
    } catch (error) {
      this.hideLoading();
      this.showToast(`Error creating bucket: ${error.message}`, "red");
      console.error("Error creating bucket:", error);
    }
  }

  async deleteBucket(bucketName) {
    const confirmed = await this.showConfirmDialog(
      "Delete Bucket",
      `Are you sure you want to delete the bucket "${bucketName}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    this.showLoading("Deleting bucket...");

    try {
      await window.electronAPI.deleteBucket(bucketName);
      this.hideLoading();
      this.showToast(`Bucket "${bucketName}" deleted successfully`, "green");

      if (this.currentBucket === bucketName) {
        this.currentBucket = null;
        this.renderObjects([]);
        this.hideUploadSection();
      }

      this.loadBuckets();
    } catch (error) {
      this.hideLoading();
      this.showToast(`Error deleting bucket: ${error.message}`, "red");
      console.error("Error deleting bucket:", error);
    }
  }

  async selectBucket(bucketName) {
    this.currentBucket = bucketName;
    this.updateCurrentBucketDisplay();
    this.showUploadSection();
    this.loadObjects();

    // Update active bucket in UI
    document.querySelectorAll(".collection-item").forEach((item) => {
      item.classList.remove("active");
    });
    document
      .querySelector(`[data-bucket="${bucketName}"]`)
      .classList.add("active");
  }

  async loadObjects() {
    if (!this.currentBucket) return;

    this.showLoading("Loading objects...");

    try {
      const objects = await window.electronAPI.listObjects(this.currentBucket);
      this.objects = objects;
      this.renderObjects(objects);
      this.hideLoading();
      this.showToast(`Loaded ${objects.length} object(s)`, "blue");
    } catch (error) {
      this.hideLoading();
      this.showToast(`Error loading objects: ${error.message}`, "red");
      console.error("Error loading objects:", error);
    }
  }

  async uploadFile() {
    if (!this.currentBucket) {
      this.showToast("Please select a bucket first", "orange");
      return;
    }

    try {
      const result = await window.electronAPI.showOpenDialog();

      if (
        result.canceled ||
        !result.filePaths ||
        result.filePaths.length === 0
      ) {
        return;
      }

      const filePath = result.filePaths[0];
      const fileName = filePath.split(/[\\/]/).pop();
      const objectKey =
        document.getElementById("object-key").value.trim() || fileName;

      this.showLoading("Uploading file...");

      await window.electronAPI.uploadFile(
        this.currentBucket,
        objectKey,
        filePath
      );

      document.getElementById("object-key").value = "";
      M.updateTextFields();

      this.hideLoading();
      this.showToast(
        `File "${fileName}" uploaded successfully as "${objectKey}"`,
        "green"
      );
      this.loadObjects();
    } catch (error) {
      this.hideLoading();
      this.showToast(`Error uploading file: ${error.message}`, "red");
      console.error("Error uploading file:", error);
    }
  }

  async downloadFile(bucketName, key) {
    this.showLoading("Downloading file...");

    try {
      const result = await window.electronAPI.downloadFile(bucketName, key);

      this.hideLoading();

      if (result.success && !result.canceled) {
        this.showToast(`File downloaded to: ${result.path}`, "green");
      } else if (result.canceled) {
        this.showToast("Download canceled", "orange");
      }
    } catch (error) {
      this.hideLoading();
      this.showToast(`Error downloading file: ${error.message}`, "red");
      console.error("Error downloading file:", error);
    }
  }

  async deleteObject(bucketName, key) {
    const confirmed = await this.showConfirmDialog(
      "Delete Object",
      `Are you sure you want to delete "${key}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    this.showLoading("Deleting object...");

    try {
      await window.electronAPI.deleteObject(bucketName, key);
      this.hideLoading();
      this.showToast(`Object "${key}" deleted successfully`, "green");
      this.loadObjects();
    } catch (error) {
      this.hideLoading();
      this.showToast(`Error deleting object: ${error.message}`, "red");
      console.error("Error deleting object:", error);
    }
  }

  renderBuckets() {
    const bucketsList = document.getElementById("buckets-list");
    bucketsList.innerHTML = "";

    if (this.buckets.length === 0) {
      bucketsList.innerHTML =
        '<li class="collection-item center-align grey-text">No buckets found</li>';
      return;
    }

    this.buckets.forEach((bucket) => {
      const li = document.createElement("li");
      li.className = "collection-item";
      li.setAttribute("data-bucket", bucket.Name);

      li.innerHTML = `
                <div class="bucket-name">
                    <i class="material-icons">folder</i>
                    <span>${bucket.Name}</span>
                </div>
                <div class="bucket-actions">
                    <button class="btn-small blue waves-effect" onclick="s3Browser.selectBucket('${bucket.Name}')">
                        <i class="material-icons">folder_open</i>
                    </button>
                    <button class="btn-small red waves-effect" onclick="s3Browser.deleteBucket('${bucket.Name}')">
                        <i class="material-icons">delete</i>
                    </button>
                </div>
            `;

      bucketsList.appendChild(li);
    });
  }

  renderObjects(objects) {
    const objectsContainer = document.getElementById("objects-container");
    const noBucketSelected = document.getElementById("no-bucket-selected");
    const objectsList = document.getElementById("objects-list");

    if (!this.currentBucket) {
      objectsContainer.classList.add("hide");
      noBucketSelected.classList.remove("hide");
      return;
    }

    noBucketSelected.classList.add("hide");
    objectsContainer.classList.remove("hide");
    objectsList.innerHTML = "";

    if (objects.length === 0) {
      objectsList.innerHTML = `
                <tr>
                    <td colspan="4" class="center-align grey-text">No objects found in this bucket</td>
                </tr>
            `;
      return;
    }

    objects.forEach((obj) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
                <td>
                    <div class="object-name">
                        <i class="material-icons">description</i>
                        <span class="text-truncate">${obj.Key}</span>
                    </div>
                </td>
                <td class="object-size">${this.formatFileSize(obj.Size)}</td>
                <td class="object-date">${this.formatDate(
                  obj.LastModified
                )}</td>
                <td>
                    <div class="object-actions">
                        <button class="btn-small green waves-effect" onclick="s3Browser.downloadFile('${
                          this.currentBucket
                        }', '${obj.Key}')">
                            <i class="material-icons">cloud_download</i>
                        </button>
                        <button class="btn-small red waves-effect" onclick="s3Browser.deleteObject('${
                          this.currentBucket
                        }', '${obj.Key}')">
                            <i class="material-icons">delete</i>
                        </button>
                    </div>
                </td>
            `;
      objectsList.appendChild(tr);
    });
  }

  updateCurrentBucketDisplay() {
    const currentBucketSpan = document.getElementById("current-bucket");
    currentBucketSpan.textContent = this.currentBucket
      ? ` - ${this.currentBucket}`
      : "";
  }

  showUploadSection() {
    document.getElementById("upload-section").classList.remove("hide");
  }

  hideUploadSection() {
    document.getElementById("upload-section").classList.add("hide");
  }

  showConnectionStatus(message, type) {
    const statusDiv = document.getElementById("connection-status");
    const messageSpan = document.getElementById("connection-message");

    messageSpan.textContent = message;
    statusDiv.className = `card-panel ${type}`;
    statusDiv.classList.remove("hide");

    // Auto-hide after 5 seconds
    setTimeout(() => {
      statusDiv.classList.add("hide");
    }, 5000);
  }

  showLoading(message) {
    const modal = M.Modal.getInstance(document.getElementById("loading-modal"));
    document.getElementById("loading-message").textContent = message;
    modal.open();
  }

  hideLoading() {
    const modal = M.Modal.getInstance(document.getElementById("loading-modal"));
    modal.close();
  }

  showConfirmDialog(title, message) {
    return new Promise((resolve) => {
      const modal = M.Modal.getInstance(
        document.getElementById("confirm-modal")
      );
      document.getElementById("confirm-title").textContent = title;
      document.getElementById("confirm-message").textContent = message;

      const confirmButton = document.getElementById("confirm-action");
      const newConfirmButton = confirmButton.cloneNode(true);
      confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);

      newConfirmButton.addEventListener("click", () => {
        resolve(true);
      });

      // Handle cancel/close
      const cancelButtons = document.querySelectorAll(
        "#confirm-modal .modal-close"
      );
      cancelButtons.forEach((button) => {
        if (button !== newConfirmButton) {
          button.addEventListener(
            "click",
            () => {
              resolve(false);
            },
            { once: true }
          );
        }
      });

      modal.open();
    });
  }

  showToast(message, className = "blue") {
    M.toast({ html: message, classes: className, displayLength: 4000 });
  }

  isValidBucketName(name) {
    // AWS S3 bucket naming rules (simplified)
    const bucketNameRegex = /^[a-z0-9][a-z0-9\-]*[a-z0-9]$/;
    return name.length >= 3 && name.length <= 63 && bucketNameRegex.test(name);
  }

  formatFileSize(bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  }
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.s3Browser = new S3Browser();
});
