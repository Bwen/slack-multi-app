require('dotenv').config();
const compression = require('compression');
const bodyParser = require('body-parser');
const express = require('express');
const expressWinston = require('express-winston');
const path = require('path');
const healthCheck = require('express-healthcheck');

process.env.root = path.resolve(__dirname, '../');

const logger = require('./logger');
const { processSlackRequest, processRawRequest } = require('./utils');
const slackSignatureCheck = require('./middlewares/slack-signature-check');
const currentUser = require('./middlewares/current-user');
const slackModulePath = require('./middlewares/slack-module-path');
const slackAvailableCommands = require('./middlewares/slack-available-commands');
const slackUserActivity = require('./middlewares/slack-user-activity');
const slackGroupACL = require('./middlewares/slack-group-acl');
const setupCron = require('./cron-setup');

const slackModulesPath = path.resolve(__dirname, 'slack-modules');

// We need to save the raw body of the request for validating x-slack-signature in its middleware
const rawBodySaver = (req, res, buf) => {
  if (buf && buf.length) {
    req.rawBody = buf.toString('utf8');
  }
};

const app = express();
app.use(express.static('public'));
app.use(compression());
app.use(bodyParser.json({ verify: rawBodySaver }));
app.use(bodyParser.urlencoded({ verify: rawBodySaver, extended: true }));
app.use(expressWinston.logger(logger));

setupCron(slackModulesPath);

// The following order is important
app.use('/healthcheck', healthCheck());
app.use(slackSignatureCheck());
app.use(currentUser());
app.use(slackModulePath);
app.use(slackUserActivity());
app.use(slackGroupACL());
app.use(slackAvailableCommands);

app.post('/commands', async (req, res) => {
  await processSlackRequest(req, res, slackModulesPath);
});

app.post('/interactions', async (req, res) => {
  await processSlackRequest(req, res, slackModulesPath);
});

app.post('/menus', async (req, res) => {
  await processSlackRequest(req, res, slackModulesPath);
});

app.get('*', async (req, res) => {
  await processRawRequest(req, res, slackModulesPath);
});

app.listen(3000);
