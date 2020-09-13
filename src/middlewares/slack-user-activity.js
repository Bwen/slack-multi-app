const logger = require('../logger');
const db = require('../../sequelize');

const logPrefix = 'middleware-user-activity: ';
module.exports = () => async (req, res, next) => {
  const params = new URLSearchParams(req.slack.module.params);
  req.lastActivity = await db.UserActivity.findOne({
    where: {
      createdBy: req.currentUser.id,
    },
    order: [
      ['createdAt', 'DESC'],
    ],
  });

  req.currentActivity = await db.UserActivity.create({
    channelId: req.slack.channelId,
    triggerId: req.slack.triggerId,
    responseUrl: req.slack.responseUrl,
    isCommand: req.slack.isCommand ? 'yes' : 'no',
    isInteraction: req.slack.isInteraction ? 'yes' : 'no',
    isModalSubmission: req.slack.isModalSubmission ? 'yes' : 'no',
    path: req.slack.module.path.join(':'),
    params: params.toString(),
    createdBy: req.currentUser.id,
  });

  logger.info(`${logPrefix}Logged activity ${req.slack.module.path.join(':')}`);
  next();
};
