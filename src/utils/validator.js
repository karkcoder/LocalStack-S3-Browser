class Validator {
  static validateBucketName(name) {
    const errors = [];

    if (!name || typeof name !== "string") {
      errors.push("Bucket name is required and must be a string");
      return { isValid: false, errors };
    }

    const trimmedName = name.trim();

    if (trimmedName.length < 3 || trimmedName.length > 63) {
      errors.push("Bucket name must be between 3 and 63 characters long");
    }

    if (!/^[a-z0-9]/.test(trimmedName)) {
      errors.push("Bucket name must start with a lowercase letter or number");
    }

    if (!/[a-z0-9]$/.test(trimmedName)) {
      errors.push("Bucket name must end with a lowercase letter or number");
    }

    if (!/^[a-z0-9\-]+$/.test(trimmedName)) {
      errors.push(
        "Bucket name can only contain lowercase letters, numbers, and hyphens"
      );
    }

    if (trimmedName.includes("--")) {
      errors.push("Bucket name cannot contain consecutive hyphens");
    }

    // Check if it looks like an IP address
    const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    if (ipRegex.test(trimmedName)) {
      errors.push("Bucket name cannot be formatted as an IP address");
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedName: trimmedName,
    };
  }

  static validateObjectKey(key) {
    const errors = [];

    if (!key || typeof key !== "string") {
      errors.push("Object key is required and must be a string");
      return { isValid: false, errors };
    }

    const trimmedKey = key.trim();

    if (trimmedKey.length === 0) {
      errors.push("Object key cannot be empty");
    }

    if (trimmedKey.length > 1024) {
      errors.push("Object key cannot exceed 1024 characters");
    }

    // Check for invalid characters (basic check)
    const invalidChars = /[<>:"\\|?*\x00-\x1f]/;
    if (invalidChars.test(trimmedKey)) {
      errors.push("Object key contains invalid characters");
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedKey: trimmedKey,
    };
  }

  static validateFile(filePath) {
    const errors = [];

    if (!filePath || typeof filePath !== "string") {
      errors.push("File path is required and must be a string");
      return { isValid: false, errors };
    }

    // Check file extension and size limits could be added here
    // For now, we'll do basic validation

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedPath: filePath.trim(),
    };
  }

  static sanitizeInput(input) {
    if (typeof input !== "string") {
      return input;
    }

    return input.trim().replace(/[\x00-\x1f\x7f-\x9f]/g, "");
  }
}

module.exports = Validator;
