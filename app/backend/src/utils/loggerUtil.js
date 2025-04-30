import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure log directory exists
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  // Custom format to handle error objects properly
  winston.format((info) => {
    // Process error objects in metadata
    if (info.error instanceof Error) {
      info.error = {
        message: info.error.message,
        name: info.error.name,
        stack: info.error.stack,
      };
    }
    // Process metadata for any other errors
    Object.keys(info).forEach(key => {
      if (info[key] instanceof Error) {
        info[key] = {
          message: info[key].message,
          name: info[key].name,
          stack: info[key].stack,
        };
      }
    });
    return info;
  })(),
  winston.format.printf(
    ({ level, message, timestamp, ...metadata }) => {
      let metadataStr = '';
      if (Object.keys(metadata).length > 0) {
        if (metadata.stack) {
          metadataStr = `\n${metadata.stack}`;
        } else {
          metadataStr = `\n${JSON.stringify(metadata, null, 2)}`;
        }
      }
      return `[${timestamp}] [${level.toUpperCase().padEnd(7)}] ${message.replace(/^\] /, '')}${metadataStr}`;
    }
  )
);

// Configure console format for better readability
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  logFormat
);

// Create the logger
const winstonLogger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  transports: [
    // Write to all logs with level 'info' and below to combined.log
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log'),
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Console output for development
    new winston.transports.Console({
      format: consoleFormat,
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    }),
  ],
});

// Create a logger instance that uses import.meta
function createLoggerWithMeta(callingModule) {
  const moduleName = path.basename(callingModule.filename);
  
  return {
    debug: (message, meta = {}) => winstonLogger.debug(`[${moduleName}] ${message}`, meta),
    info: (message, meta = {}) => winstonLogger.info(`[${moduleName}] ${message}`, meta),
    warn: (message, meta = {}) => winstonLogger.warn(`[${moduleName}] ${message}`, meta),
    error: (message, meta = {}) => winstonLogger.error(`[${moduleName}] ${message}`, meta),
    logger: winstonLogger // Original winston logger for advanced usage
  };
}

// Extract the caller filename from the stack trace
function getCallerInfo(stack) {
  // Stack trace format:
  // Error
  //     at Object.<anonymous> (/path/to/file.js:line:column)
  const stackLines = stack.split('\n');
  // Skip the first two lines (Error and this function call)
  for (let i = 2; i < stackLines.length; i++) {
    const match = stackLines[i].match(/\s+at\s.+\((.+):\d+:\d+\)/);
    if (match && match[1]) {
      return match[1];
    }
  }
  return 'unknown';
}

// Create a simplified logger that automatically detects the calling module
const log = {
  debug: (message, meta = {}) => {
    const stack = new Error().stack;
    const callerInfo = getCallerInfo(stack);
    return createLoggerWithMeta({ filename: callerInfo }).debug(message, meta);
  },
  info: (message, meta = {}) => {
    const stack = new Error().stack;
    const callerInfo = getCallerInfo(stack);
    return createLoggerWithMeta({ filename: callerInfo }).info(message, meta);
  },
  warn: (message, meta = {}) => {
    const stack = new Error().stack;
    const callerInfo = getCallerInfo(stack);
    return createLoggerWithMeta({ filename: callerInfo }).warn(message, meta);
  },
  error: (message, meta = {}) => {
    const stack = new Error().stack;
    const callerInfo = getCallerInfo(stack);
    return createLoggerWithMeta({ filename: callerInfo }).error(message, meta);
  }
};

// Export the simplified logger as the default
export default log;

// Also export the createLoggerWithMeta function for advanced use cases
export { createLoggerWithMeta as logger };