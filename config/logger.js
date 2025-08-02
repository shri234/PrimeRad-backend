const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');

// Function to convert UTC timestamp to IST
const convertToIST = (utcTimestamp) => {
  return new Date(utcTimestamp).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
  });
};

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(), // Adds UTC timestamp
    format.printf(({ timestamp, level, message }) => {
      const istTimestamp = convertToIST(timestamp); // Convert to IST
      return `${istTimestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '7d',
    }),
  ],
});

module.exports = logger;
