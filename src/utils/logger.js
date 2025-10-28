class Logger {
  static levels = {
    ERROR: "ERROR",
    WARN: "WARN",
    INFO: "INFO",
    DEBUG: "DEBUG",
  };

  static log(level, message, error = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${level}: ${message}`;

    console.log(logMessage);

    if (error) {
      console.error("Error details:", error);
    }

    // In production, you might want to send logs to a service
    // or write them to a file
    if (process.env.NODE_ENV === "production") {
      // TODO: Implement file logging or remote logging
    }
  }

  static error(message, error = null) {
    this.log(this.levels.ERROR, message, error);
  }

  static warn(message, error = null) {
    this.log(this.levels.WARN, message, error);
  }

  static info(message, error = null) {
    this.log(this.levels.INFO, message, error);
  }

  static debug(message, error = null) {
    if (process.env.NODE_ENV === "development") {
      this.log(this.levels.DEBUG, message, error);
    }
  }
}

module.exports = Logger;
