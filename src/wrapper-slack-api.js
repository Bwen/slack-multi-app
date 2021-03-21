const { WebClient } = require('@slack/web-api');

module.exports = {
  getSlackApi: () => new WebClient(process.env.SLACK_TOKEN),
};
