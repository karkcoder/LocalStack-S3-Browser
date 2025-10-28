// LocalStack S3 File Explorer - Renderer Process
class S3FileExplorer {
  constructor() {
    this.currentBucket = null;
    this.buckets = [];
    this.objects = [];
    this.connectionSettings = {
      endpoint: "http://localhost:4566",
      region: "us-east-1",
      accessKey: "test",
      secretKey: "test",
    };
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadConnectionSettings();
  }

  setupEventListeners() {
    // Connection
    document.getElementById("connect-btn").addEventListener("click", () => {
      this.testConnection();
    });

    // Bucket operations
    document.getElementById("create-bucket").addEventListener("click", () => {
      this.createBucket();
    });

    document.getElementById("refresh-buckets").addEventListener("click", () => {
      this.loadBuckets();
    });

    // File operations
    document.getElementById("upload-file").addEventListener("click", () => {
      this.uploadFile();
    });

    document.getElementById("refresh-objects").addEventListener("click", () => {
      this.loadObjects();
    });

    // Enter key handling
    document.getElementById("bucket-name").addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.createBucket();
      }
    });

    // Connection settings
    document.getElementById("endpoint").addEventListener("change", (e) => {
      this.connectionSettings.endpoint = e.target.value;
    });

    document.getElementById("region").addEventListener("change", (e) => {
      this.connectionSettings.region = e.target.value;
    });

    document.getElementById("access-key").addEventListener("change", (e) => {
      this.connectionSettings.accessKey = e.target.value;
    });

    document.getElementById("secret-key").addEventListener("change", (e) => {
      this.connectionSettings.secretKey = e.target.value;
    });

    // File input
    document.getElementById("file-input").addEventListener("change", (e) => {
      this.handleFileSelection(e.target.files);
    });

    // Modal events
    document.getElementById("confirm-cancel").addEventListener("click", () => {
      this.hideModal("confirm-modal");
    });
  }

  loadConnectionSettings() {
    document.getElementById("endpoint").value =
      this.connectionSettings.endpoint;
    document.getElementById("region").value = this.connectionSettings.region;
    document.getElementById("access-key").value =
      this.connectionSettings.accessKey;
    document.getElementById("secret-key").value =
      this.connectionSettings.secretKey;
  }

  async testConnection() {
    this.showLoading("Connecting to LocalStack...");

    try {
      // Update connection settings for the backend
      await window.electronAPI.updateConnectionSettings(
        this.connectionSettings
      );

      const result = await window.electronAPI.testConnection();
      this.hideLoading();

      if (result.success) {
        this.showToast("Connected successfully!", "success");
        this.loadBuckets();
      } else {
        this.showToast("Connection failed: " + result.message, "error");
      }
    } catch (error) {
      this.hideLoading();
      this.showToast(`Connection error: ${error.message}`, "error");
    }
  }

  async loadBuckets() {
    try {
      const buckets = await window.electronAPI.listBuckets();
      this.buckets = buckets;
      this.renderBuckets();
      this.showToast(`Loaded ${buckets.length} bucket(s)`, "success");
    } catch (error) {
      this.showToast(`Error loading buckets: ${error.message}`, "error");
      console.error("Error loading buckets:", error);
    }
  }

  async createBucket() {
    const bucketNameInput = document.getElementById("bucket-name");
    const bucketName = bucketNameInput.value.trim();

    if (!bucketName) {
      this.showToast("Please enter a bucket name", "warning");
      return;
    }

    if (!this.isValidBucketName(bucketName)) {
      this.showToast(
        "Invalid bucket name. Use lowercase letters, numbers, and hyphens only.",
        "error"
      );
      return;
    }

    this.showLoading("Creating bucket...");

    try {
      await window.electronAPI.createBucket(bucketName);
      bucketNameInput.value = "";
      this.hideLoading();
      this.showToast(`Bucket "${bucketName}" created successfully`, "success");
      this.loadBuckets();
    } catch (error) {
      this.hideLoading();
      this.showToast(`Error creating bucket: ${error.message}`, "error");
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
      this.showToast(`Bucket "${bucketName}" deleted successfully`, "success");

      if (this.currentBucket === bucketName) {
        this.currentBucket = null;
        this.renderFiles([]);
        this.showEmptyState();
      }

      this.loadBuckets();
    } catch (error) {
      this.hideLoading();
      this.showToast(`Error deleting bucket: ${error.message}`, "error");
      console.error("Error deleting bucket:", error);
    }
  }
  async selectBucket(bucketName) {
    this.currentBucket = bucketName;
    this.updateCurrentBucketDisplay();
    this.hideEmptyState();
    this.loadObjects();

    // Update active bucket in UI
    document.querySelectorAll(".bucket-item").forEach((item) => {
      item.classList.remove("active");
    });
    document
      .querySelector(`[data-bucket="${bucketName}"]`)
      .classList.add("active");
  }

  async loadObjects() {
    if (!this.currentBucket) return;

    try {
      const objects = await window.electronAPI.listObjects(this.currentBucket);
      this.objects = objects;
      this.renderFiles(objects);
      this.showToast(`Loaded ${objects.length} file(s)`, "success");
    } catch (error) {
      this.showToast(`Error loading files: ${error.message}`, "error");
      console.error("Error loading objects:", error);
    }
  }

  uploadFile() {
    if (!this.currentBucket) {
      this.showToast("Please select a bucket first", "warning");
      return;
    }

    // Trigger file input
    document.getElementById("file-input").click();
  }

  async handleFileSelection(files) {
    if (!files || files.length === 0) return;

    for (const file of files) {
      await this.uploadSingleFile(file);
    }
  }

  async uploadSingleFile(file) {
    this.showLoading(`Uploading ${file.name}...`);

    try {
      const objectKey = file.name;

      await window.electronAPI.uploadFile(
        this.currentBucket,
        objectKey,
        file.path
      );

      this.hideLoading();
      this.showToast(`File "${file.name}" uploaded successfully`, "success");
      this.loadObjects();
    } catch (error) {
      this.hideLoading();
      this.showToast(`Error uploading ${file.name}: ${error.message}`, "error");
      console.error("Error uploading file:", error);
    }
  }

  async downloadFile(bucketName, key) {
    this.showLoading("Downloading file...");

    try {
      const result = await window.electronAPI.downloadFile(bucketName, key);
      this.hideLoading();

      if (result.success && !result.canceled) {
        this.showToast(`File downloaded successfully`, "success");
      } else if (result.canceled) {
        this.showToast("Download canceled", "warning");
      }
    } catch (error) {
      this.hideLoading();
      this.showToast(`Error downloading file: ${error.message}`, "error");
      console.error("Error downloading file:", error);
    }
  }

  async deleteObject(bucketName, key) {
    const confirmed = await this.showConfirmDialog(
      "Delete File",
      `Are you sure you want to delete "${key}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    this.showLoading("Deleting file...");

    try {
      await window.electronAPI.deleteObject(bucketName, key);
      this.hideLoading();
      this.showToast(`File "${key}" deleted successfully`, "success");
      this.loadObjects();
    } catch (error) {
      this.hideLoading();
      this.showToast(`Error deleting file: ${error.message}`, "error");
      console.error("Error deleting object:", error);
    }
  }

  renderBuckets() {
    const bucketsList = document.getElementById("buckets-list");
    bucketsList.innerHTML = "";

    if (this.buckets.length === 0) {
      const div = document.createElement("div");
      div.className = "bucket-item";
      div.innerHTML = `
        <div class="text-center" style="padding: 2rem; color: #64748b;">
          <i class="material-icons" style="font-size: 2rem; margin-bottom: 0.5rem;">folder_open</i>
          <p>No buckets found</p>
        </div>
      `;
      bucketsList.appendChild(div);
      return;
    }

    this.buckets.forEach((bucket) => {
      const div = document.createElement("div");
      div.className = "bucket-item";
      div.setAttribute("data-bucket", bucket.Name);
      div.onclick = () => this.selectBucket(bucket.Name);

      div.innerHTML = `
        <i class="material-icons">folder</i>
        <div style="flex: 1;">
          <div class="bucket-name">${bucket.Name}</div>
          <div class="bucket-date">${this.formatDate(bucket.CreationDate)}</div>
        </div>
        <div class="bucket-actions">
          <button class="btn-icon delete-bucket-btn" title="Delete">
            <i class="material-icons">delete</i>
          </button>
        </div>
      `;

      // Add event listener for delete button
      const deleteBtn = div.querySelector(".delete-bucket-btn");
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.deleteBucket(bucket.Name);
      });

      bucketsList.appendChild(div);
    });
  }

  renderFiles(files) {
    const filesBody = document.getElementById("files-body");
    filesBody.innerHTML = "";

    if (files.length === 0) {
      filesBody.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: #64748b;">
          <i class="material-icons" style="font-size: 3rem; margin-bottom: 1rem;">description</i>
          <p>No files found in this bucket</p>
        </div>
      `;
      return;
    }

    files.forEach((file) => {
      const div = document.createElement("div");
      div.className = "file-item";

      div.innerHTML = `
        <div class="file-name" data-bucket="${this.currentBucket}" data-key="${
        file.Key
      }">
          <i class="material-icons">description</i>
          <span class="file-name-text">${file.Key}</span>
        </div>
        <div class="file-size">${this.formatFileSize(file.Size)}</div>
        <div class="file-date">${this.formatDate(file.LastModified)}</div>
        <div class="file-actions">
          <button class="btn-download download-file-btn" title="Download">
            Download
          </button>
          <button class="btn-delete delete-file-btn" title="Delete">
            Delete
          </button>
        </div>
      `;

      // Add event listeners for action buttons
      const downloadBtn = div.querySelector(".download-file-btn");
      const deleteBtn = div.querySelector(".delete-file-btn");

      downloadBtn.addEventListener("click", () => {
        this.downloadFile(this.currentBucket, file.Key);
      });

      deleteBtn.addEventListener("click", () => {
        this.deleteObject(this.currentBucket, file.Key);
      });

      // Add hover event listeners for tag display
      const fileNameDiv = div.querySelector(".file-name");
      this.setupTagHover(fileNameDiv);

      filesBody.appendChild(div);
    });
  }

  setupTagHover(fileNameElement) {
    let hoverTimeout;
    let tooltip;

    fileNameElement.addEventListener("mouseenter", (e) => {
      const bucketName = e.target.closest(".file-name").dataset.bucket;
      const objectKey = e.target.closest(".file-name").dataset.key;

      // Clear any existing timeout
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }

      // Show tooltip after a short delay
      hoverTimeout = setTimeout(async () => {
        try {
          const tags = await window.electronAPI.getObjectTags(
            bucketName,
            objectKey
          );
          this.showTagTooltip(e.target, tags, objectKey);
        } catch (error) {
          console.error("Error fetching tags:", error);
          // Show tooltip indicating no tags or error
          this.showTagTooltip(e.target, [], objectKey, "No tags available");
        }
      }, 500); // 500ms delay before showing tooltip
    });

    fileNameElement.addEventListener("mouseleave", () => {
      // Clear timeout if mouse leaves before tooltip is shown
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
      // Hide tooltip
      this.hideTagTooltip();
    });
  }

  showTagTooltip(targetElement, tags, objectKey, errorMessage = null) {
    // Remove any existing tooltip
    this.hideTagTooltip();

    const tooltip = document.createElement("div");
    tooltip.className = "tag-tooltip";
    tooltip.id = "tag-tooltip";

    if (errorMessage) {
      tooltip.innerHTML = `
        <div class="tooltip-header">
          <strong>${objectKey}</strong>
        </div>
        <div class="tooltip-content">
          <em>${errorMessage}</em>
        </div>
      `;
    } else if (tags.length === 0) {
      tooltip.innerHTML = `
        <div class="tooltip-header">
          <strong>${objectKey}</strong>
        </div>
        <div class="tooltip-content">
          <em>No tags</em>
        </div>
      `;
    } else {
      const tagsList = tags
        .map(
          (tag) =>
            `<div class="tag-item">
          <span class="tag-key">${tag.Key}:</span>
          <span class="tag-value">${tag.Value}</span>
        </div>`
        )
        .join("");

      tooltip.innerHTML = `
        <div class="tooltip-header">
          <strong>${objectKey}</strong>
        </div>
        <div class="tooltip-content">
          <div class="tags-label">Tags:</div>
          ${tagsList}
        </div>
      `;
    }

    document.body.appendChild(tooltip);

    // Position tooltip
    const rect = targetElement.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
    let top = rect.top - tooltipRect.height - 8;

    // Adjust if tooltip would go off-screen
    if (left < 8) left = 8;
    if (left + tooltipRect.width > window.innerWidth - 8) {
      left = window.innerWidth - tooltipRect.width - 8;
    }
    if (top < 8) {
      top = rect.bottom + 8; // Show below if no room above
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.style.opacity = "1";
  }

  hideTagTooltip() {
    const existingTooltip = document.getElementById("tag-tooltip");
    if (existingTooltip) {
      existingTooltip.remove();
    }
  }

  updateCurrentBucketDisplay() {
    const currentBucketSpan = document.getElementById("current-bucket-name");
    if (currentBucketSpan) {
      currentBucketSpan.textContent = this.currentBucket || "Select a bucket";
    }
  }

  showEmptyState() {
    const emptyState = document.getElementById("no-bucket-selected");
    const filesContainer = document.getElementById("files-container");

    emptyState.classList.remove("hide");
    filesContainer.classList.add("hide");
  }

  hideEmptyState() {
    const emptyState = document.getElementById("no-bucket-selected");
    const filesContainer = document.getElementById("files-container");

    emptyState.classList.add("hide");
    filesContainer.classList.remove("hide");
  }

  showLoading(message) {
    const modal = document.getElementById("loading-modal");
    const messageEl = document.getElementById("loading-message");
    messageEl.textContent = message;
    modal.classList.remove("hide");
  }

  hideLoading() {
    const modal = document.getElementById("loading-modal");
    modal.classList.add("hide");
  }

  showModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove("hide");
  }

  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add("hide");
  }

  showConfirmDialog(title, message) {
    return new Promise((resolve) => {
      const modal = document.getElementById("confirm-modal");
      document.getElementById("confirm-title").textContent = title;
      document.getElementById("confirm-message").textContent = message;

      const confirmButton = document.getElementById("confirm-action");
      const cancelButton = document.getElementById("confirm-cancel");

      // Clean up previous event listeners
      const newConfirmButton = confirmButton.cloneNode(true);
      const newCancelButton = cancelButton.cloneNode(true);
      confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
      cancelButton.parentNode.replaceChild(newCancelButton, cancelButton);

      newConfirmButton.addEventListener("click", () => {
        this.hideModal("confirm-modal");
        resolve(true);
      });

      newCancelButton.addEventListener("click", () => {
        this.hideModal("confirm-modal");
        resolve(false);
      });

      this.showModal("confirm-modal");
    });
  }

  showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 4000);
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
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  }
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.fileExplorer = new S3FileExplorer();
});
