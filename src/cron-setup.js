const path = require('path');
const { readdir } = require('fs').promises;
const nodeCron = require('node-cron');
const logger = require('./logger');

async function getCronFiles(dir) {
  const dirents = await readdir(dir, { withFileTypes: true });
  let files = await Promise.all(dirents.map((dirent) => {
    const res = path.resolve(dir, dirent.name);
    return dirent.isDirectory() ? getCronFiles(res) : res;
  }));

  files = files.filter((file) => file.toString().match(/cron.js$/));
  return Array.prototype.concat(...files);
}

function validateStructure(cron) {
  if (!Object.prototype.hasOwnProperty.call(cron, 'schedule') || typeof cron.schedule !== 'string') {
    return false;
  }

  if (!Object.prototype.hasOwnProperty.call(cron, 'task') || typeof cron.task !== 'function') {
    return false;
  }

  return true;
}

module.exports = async (slackModulesPath) => {
  const cronFiles = await getCronFiles(slackModulesPath);
  cronFiles.forEach((file) => {
    try {
      const cron = require(file);
      if (!validateStructure(cron)) {
        return;
      }

      nodeCron.schedule(cron.schedule, cron.task, {});
    } catch (e) {
      logger.error(e);
    }
  });
};
