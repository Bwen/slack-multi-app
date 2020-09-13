require('dotenv').config();
const path = require('path');
const logger = require('../src/logger');

const { env } = process;
let sqlitePath = './test/data/test.sqlite';
if (process.env.SEQUELIZE_CLI) {
  sqlitePath = path.resolve('./', 'test', 'data', 'test.sqlite');
}

// eslint-disable-next-line new-cap
module.exports = {
  development: {
    dialect: 'mysql',
    url: `mysql://${env.MYSQL_USER}:${env.MYSQL_PASSWORD}@${env.MYSQL_HOST}:${env.MYSQL_PORT}/${env.MYSQL_DATABASE}`,
    migrationStorageTableName: '_migrations',
    seederStorage: 'sequelize',
    seederStorageTableName: '_seeders',
    logging: (msg) => logger.info(msg),
  },
  test: {
    dialect: 'sqlite',
    url: `sqlite:${sqlitePath}`,
    migrationStorageTableName: '_migrations',
    seederStorage: 'sequelize',
    seederStorageTableName: '_seeders',
    logging: (msg) => logger.info(msg),
  },
  production: {
    dialect: 'mysql',
    url: `mysql://${env.MYSQL_USER}:${env.MYSQL_PASSWORD}@${env.MYSQL_HOST}:${env.MYSQL_PORT}/${env.MYSQL_DATABASE}`,
    migrationStorageTableName: '_migrations',
    seederStorage: 'sequelize',
    seederStorageTableName: '_seeders',
    logging: (msg) => logger.info(msg),
  },
};
