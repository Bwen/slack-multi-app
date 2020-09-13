const got = require('got');
const fs = require('fs');
const path = require('path');
const { readdir } = require('fs').promises;
const logger = require('../logger');
const { moduleNotFound, availableModules } = require('../renderer');

async function getFiles(dir) {
  const dirents = await readdir(dir, { withFileTypes: true });
  let files = await Promise.all(dirents.map((dirent) => {
    const res = path.resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  }));

  files = files.filter((file) => file.toString().match(/command.js|interactions.js|modal-submit.js|info.json$/));
  return Array.prototype.concat(...files);
}

let slackModuleList = [];
const slackModulesPath = path.resolve(__dirname, '..', 'slack-modules');
async function getModuleList() {
  // If the module list is already in memory we return it
  if (slackModuleList.length) {
    return JSON.parse(JSON.stringify(slackModuleList));
  }

  const list = [];
  const files = await getFiles(slackModulesPath);
  files.forEach((file) => {
    const parts = file
      .replace(slackModulesPath.toString(), '')
      .replace(/command.js|interactions.js|modal-submit.js|info.json$/, '')
      .split(path.sep).filter((i) => i);

    // Avoid duplicates in the list, since we look for many files
    if (!list.find((item) => JSON.stringify(item) === JSON.stringify(parts))) {
      list.push(parts);
    }
  });

  slackModuleList = JSON.parse(JSON.stringify(list));
  return list;
}

function getModuleInfos(list, depth = 0) {
  const data = [];
  list.forEach((pathParts) => {
    const infoPath = path.resolve(slackModulesPath, pathParts.join(path.sep), 'info.json');
    if (fs.existsSync(infoPath)) {
      // eslint-disable-next-line global-require,import/no-dynamic-require
      const info = require(infoPath);

      if ((depth + 1) === pathParts.length) {
        data.push([info.name, '', info.desc, info.usage]);
      }
    }
  });

  return data;
}

const logPrefix = 'middleware-available-commands: ';
module.exports = async (req, res, next) => {
  if (!req.slack) {
    logger.warn('req.slack is not set!');
    next();
    return false;
  }

  let list = await getModuleList();
  if (req.slack.module.path.length) {
    req.slack.module.path.forEach((part, i) => {
      list = list.filter((item) => item[i] === part);
    });
  } else {
    logger.info(`${logPrefix}No path, its probably just '/tt', we display first level available modules`);
    const data = getModuleInfos(list);
    data.unshift(['Command', 'Group', 'Description', 'Usage']);
    availableModules(res, req.slack, data);
    return false;
  }

  if (!list.length) {
    logger.info(`${logPrefix}Module path not found: ${req.slack.module.path.join(':')}`);
    // Reset the list to one less depth
    list = await getModuleList();
    req.slack.module.path.pop();
    req.slack.module.path.forEach((part, i) => {
      list = list.filter((item) => item[i] === part);
    });
    const data = getModuleInfos(list, req.slack.module.path.length);
    data.unshift(['Command', 'Group', 'Description', 'Usage']);
    moduleNotFound(res, req.slack, data);
    return false;
  }

  if (list.length > 1) {
    logger.info(`${logPrefix}Many commands found: ${JSON.stringify(list)}`);
    const data = getModuleInfos(list, req.slack.module.path.length);
    data.unshift(['Command', 'Group', 'Description', 'Usage']);
    availableModules(res, req.slack, data);
    return false;
  }

  next();
  return true;
};
