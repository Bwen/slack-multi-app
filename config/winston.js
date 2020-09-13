const winston = require('winston');

const { format } = winston;
const devFormat = format.printf((info) => {
  if (info.meta && info.meta instanceof Error) {
    return `${info.timestamp} ${info.level} ${info.message} : ${info.meta.stack}`;
  }

  if (info instanceof Error) {
    return `${info.timestamp} ${info.level} ${info.message} : ${info.stack}`;
  }

  return `${info.timestamp} ${info.level}: ${info.message}`;
});

module.exports = {
  development: {
    transports: [new winston.transports.Console()],
    format: format.combine(
      format.colorize({ all: true, colors: { info: 'blue', warning: 'yellow', error: 'red' } }),
      format.timestamp(),
      format.splat(),
      devFormat,
    ),
  },
  test: {
    transports: [new winston.transports.Console({ silent: true })],
  },
  production: {
    transports: [new winston.transports.Console()],
    format: format.combine(
      format.splat(),
      format.uncolorize(),
      format.json(),
    ),
  },
};
