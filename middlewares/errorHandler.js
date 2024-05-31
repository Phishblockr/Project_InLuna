const winston = require('winston');

const logger = winston.createLogger({
  level: 'error',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' })
  ]
});

const errorHandler = (err, req, res, next) => {
  logger.error(err.message);
  res.status(500).json({ error: 'Server error' });
};

module.exports = errorHandler;
