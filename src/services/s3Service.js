const {
  S3Client,
  ListBucketsCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
} = require("@aws-sdk/client-s3");

const Logger = require("../utils/logger");
const Validator = require("../utils/validator");

class S3Service {
  constructor() {
    this.client = this.createS3Client();
  }

  createS3Client() {
    return new S3Client({
      endpoint: "http://localhost:4566", // LocalStack endpoint
      region: "us-east-1",
      credentials: {
        accessKeyId: "test",
        secretAccessKey: "test",
      },
      forcePathStyle: true, // Required for LocalStack
      tls: false,
    });
  }

  async testConnection() {
    try {
      Logger.info("Testing connection to LocalStack S3 service");
      const command = new ListBucketsCommand({});
      await this.client.send(command);
      Logger.info("Connection to LocalStack successful");
      return { success: true, message: "Connected to LocalStack successfully" };
    } catch (error) {
      Logger.error("Connection test failed", error);
      return { success: false, message: error.message };
    }
  }

  async listBuckets() {
    try {
      const command = new ListBucketsCommand({});
      const response = await this.client.send(command);
      return response.Buckets || [];
    } catch (error) {
      console.error("Error listing buckets:", error);
      throw error;
    }
  }

  async createBucket(bucketName) {
    try {
      // Validate bucket name
      const validation = Validator.validateBucketName(bucketName);
      if (!validation.isValid) {
        const errorMessage = `Invalid bucket name: ${validation.errors.join(
          ", "
        )}`;
        Logger.warn(errorMessage);
        throw new Error(errorMessage);
      }

      Logger.info(`Creating bucket: ${validation.sanitizedName}`);
      const command = new CreateBucketCommand({
        Bucket: validation.sanitizedName,
      });

      const response = await this.client.send(command);
      Logger.info(`Bucket created successfully: ${validation.sanitizedName}`);
      return response;
    } catch (error) {
      Logger.error("Error creating bucket", error);
      if (
        error.name === "BucketAlreadyExists" ||
        error.name === "BucketAlreadyOwnedByYou"
      ) {
        throw new Error(`Bucket "${bucketName}" already exists`);
      }
      throw error;
    }
  }

  async deleteBucket(bucketName) {
    try {
      // First check if bucket exists and is empty
      await this.ensureBucketIsEmpty(bucketName);

      const command = new DeleteBucketCommand({
        Bucket: bucketName,
      });

      const response = await this.client.send(command);
      return response;
    } catch (error) {
      console.error("Error deleting bucket:", error);
      if (error.name === "NoSuchBucket") {
        throw new Error(`Bucket "${bucketName}" does not exist`);
      }
      if (error.name === "BucketNotEmpty") {
        throw new Error(
          `Bucket "${bucketName}" is not empty. Please delete all objects first.`
        );
      }
      throw error;
    }
  }

  async listObjects(bucketName, prefix = "") {
    try {
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
        MaxKeys: 1000,
      });

      const response = await this.client.send(command);
      return response.Contents || [];
    } catch (error) {
      console.error("Error listing objects:", error);
      if (error.name === "NoSuchBucket") {
        throw new Error(`Bucket "${bucketName}" does not exist`);
      }
      throw error;
    }
  }

  async uploadFile(bucketName, key, fileContent) {
    try {
      // Validate object key
      const validation = Validator.validateObjectKey(key);
      if (!validation.isValid) {
        const errorMessage = `Invalid object key: ${validation.errors.join(
          ", "
        )}`;
        Logger.warn(errorMessage);
        throw new Error(errorMessage);
      }

      Logger.info(
        `Uploading file: ${validation.sanitizedKey} to bucket: ${bucketName}`
      );
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: validation.sanitizedKey,
        Body: fileContent,
        ContentType: this.getContentType(validation.sanitizedKey),
      });

      const response = await this.client.send(command);
      Logger.info(`File uploaded successfully: ${validation.sanitizedKey}`);
      return response;
    } catch (error) {
      Logger.error("Error uploading file", error);
      if (error.name === "NoSuchBucket") {
        throw new Error(`Bucket "${bucketName}" does not exist`);
      }
      throw error;
    }
  }

  async downloadFile(bucketName, key) {
    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const response = await this.client.send(command);

      // Convert stream to buffer
      const chunks = [];
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (error.name === "NoSuchBucket") {
        throw new Error(`Bucket "${bucketName}" does not exist`);
      }
      if (error.name === "NoSuchKey") {
        throw new Error(
          `Object "${key}" does not exist in bucket "${bucketName}"`
        );
      }
      throw error;
    }
  }

  async deleteObject(bucketName, key) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const response = await this.client.send(command);
      return response;
    } catch (error) {
      console.error("Error deleting object:", error);
      if (error.name === "NoSuchBucket") {
        throw new Error(`Bucket "${bucketName}" does not exist`);
      }
      throw error;
    }
  }

  async ensureBucketIsEmpty(bucketName) {
    try {
      const objects = await this.listObjects(bucketName);
      if (objects.length > 0) {
        throw new Error("BucketNotEmpty");
      }
    } catch (error) {
      if (error.message === "BucketNotEmpty") {
        const bucketNotEmptyError = new Error(
          `Bucket "${bucketName}" is not empty`
        );
        bucketNotEmptyError.name = "BucketNotEmpty";
        throw bucketNotEmptyError;
      }
      throw error;
    }
  }

  isValidBucketName(name) {
    // AWS S3 bucket naming rules
    if (!name || name.length < 3 || name.length > 63) {
      return false;
    }

    // Must start and end with lowercase letter or number
    if (!/^[a-z0-9]/.test(name) || !/[a-z0-9]$/.test(name)) {
      return false;
    }

    // Can only contain lowercase letters, numbers, and hyphens
    if (!/^[a-z0-9\-]+$/.test(name)) {
      return false;
    }

    // Cannot contain consecutive hyphens
    if (name.includes("--")) {
      return false;
    }

    // Cannot be formatted as an IP address
    const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    if (ipRegex.test(name)) {
      return false;
    }

    return true;
  }

  getContentType(filename) {
    const ext = filename.split(".").pop()?.toLowerCase();
    const contentTypes = {
      txt: "text/plain",
      html: "text/html",
      css: "text/css",
      js: "application/javascript",
      json: "application/json",
      xml: "application/xml",
      pdf: "application/pdf",
      zip: "application/zip",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      svg: "image/svg+xml",
      mp4: "video/mp4",
      mp3: "audio/mpeg",
      wav: "audio/wav",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    };

    return contentTypes[ext] || "application/octet-stream";
  }
}

module.exports = S3Service;
