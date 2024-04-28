const winston = require("winston");
require("winston-daily-rotate-file");
const fs = require("fs");
const path = require("path");
const moment = require("moment-timezone");
const config = require("./logConfig.json");
const logPath = path.join(process.cwd(), "logs");

/**
 * Create a log folder in root if not exist
 */
if (!fs.existsSync(logPath)) {
  fs.mkdirSync(logPath);
}
/**
 * Winston transport options for stdout & stderr
 */
const option = {
  file: {
    filename: `${logPath}/app-%DATE%.log`,
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    level: "debug",
    maxFiles: config.maxFiles,
    maxSize: config.maxSize,
    eol: "\r\n",
    tailable: true,
  },
  console: {
    debugStdout: true,
    stderrLevels: ["error", "critical"],
    level: "debug",
    handleExceptions: true,
    json: false,
    colorize: true,
    eol: "\r\n",
  },
};

const { createLogger, format, transports } = winston;
const { combine, printf } = format;
// Setup stdout & stderr transport
const transportSetup = {
  transports: [new transports.Console(option.console)],
  format: combine(
    format.timestamp(),
    format.splat(),
    winston.format.json(),
    printf(({ level, timestamp, message }) => {
      const lvl = level.toUpperCase();
      return `${lvl} [TIMESTAMP=${moment(timestamp)
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DD HH:mm:ss")}] [BODY=${message}]
-----------------------xxxxx----------------------------------`;
    })
  ),
};
// add transport if write log file it On
if (config.writeLogFile) {
  transportSetup.transports.push(new transports.DailyRotateFile(option.file));
}
const logger = createLogger(transportSetup);
/**
 * Tracing all crtical node exceptions
 */

process
  .on("unhandledRejection", (reason, p) => {
    logger.error(reason.stack || reason);
  })
  .on("uncaughtException", (err) => {
    logger.error(err.stack || err);
  })
  .on("exit", (err) => {
    logger.error("Opps! Node Server crashed .");
  });

module.exports = { logger };
