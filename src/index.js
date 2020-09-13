require('dotenv').config();
const compression = require('compression');
const bodyParser = require('body-parser');
const express = require('express');
const expressWinston = require('express-winston');
const path = require('path');
const logger = require('./logger');
const { processSlackRequest } = require('./utils');
const currentUser = require('./middlewares/current-user');
const slackModulePath = require('./middlewares/slack-module-path');
const slackAvailableCommands = require('./middlewares/slack-available-commands');
const slackUserActivity = require('./middlewares/slack-user-activity');
const slackGroupACL = require('./middlewares/slack-group-acl');

process.env.root = path.resolve(__dirname, '../');
const app = express();
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressWinston.logger(logger));

// The following order is important
app.use(currentUser());
app.use(slackModulePath);
app.use(slackUserActivity());
app.use(slackGroupACL());
app.use(slackAvailableCommands);

app.post('/commands', async (req, res) => {
  await processSlackRequest(req, res);
});

app.post('/interactions', async (req, res) => {
  await processSlackRequest(req, res);
});

app.post('/menus', async (req, res) => {
  await processSlackRequest(req, res);
});

app.get('/healthcheck', (req, res) => {
  // TODO: Check environment variables existence
  res.send();
});

app.listen(3000);
