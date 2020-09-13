const rawMessages = require('./raw-messages');

const TEXT_AVAILABLE_COMMANDS = 'Available commands';
const TEXT_MODULE_NOT_FOUND = ':warning: Module not found';
const TEXT_ACCESS_DENIED = ':hand::robot_face: Access Denied';
module.exports = {
  dataList: (res, slackReq, data) => {
    if (slackReq.isCommand) {
      return rawMessages.renderList(data);
    }

    return '';
  },
  availableModules: (res, slackReq, moduleInfo) => {
    if (slackReq.isCommand) {
      const list = rawMessages.renderList(moduleInfo);
      res.send(`*${TEXT_AVAILABLE_COMMANDS}*:${list}`);
    }
  },
  moduleNotFound: (res, slackReq, moduleInfo) => {
    if (slackReq.isCommand) {
      const list = rawMessages.renderList(moduleInfo);
      res.send(`${TEXT_MODULE_NOT_FOUND}\n\n*${TEXT_AVAILABLE_COMMANDS}*:${list}`);
    }
  },
  accessDenied: (res, slackReq) => {
    if (slackReq.isCommand) {
      res.send(`${TEXT_ACCESS_DENIED}`);
    }
  },
};
