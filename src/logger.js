const { createLogger } = require('winston');

const env = process.env.NODE_ENV || 'development';
const winstonOptions = require('../config/winston')[env];

module.exports = createLogger(winstonOptions);
