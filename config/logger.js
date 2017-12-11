import logger from 'winston';

const timeFormat = () => (new Date()).toLocaleTimeString();

if (!process.env.LOG_LEVEL) {
  process.env.LOG_LEVEL = 'debug';
}

logger.remove(logger.transports.Console)
  .add(logger.transports.Console, {
    timestamp: timeFormat,
    level: process.env.LOG_LEVEL,
    colorize: true
  });

export default logger;
