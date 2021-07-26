const logger = require('../logger');
const db = require('../../sequelize');

const logPrefix = 'middleware-current-user: ';
module.exports = () => async (req, res, next) => {
  let userSlackId = null;
  if (Object.prototype.hasOwnProperty.call(req.query, 'currentUserSlackId')) {
    userSlackId = req.query.currentUserSlackId;
  } else if (req.body && req.body.user_id) {
    userSlackId = req.body.user_id;
  } else if (req.body && req.body.payload) {
    const payload = JSON.parse(req.body.payload);
    userSlackId = payload.user.id;
  }

  if (userSlackId) {
    // eslint-disable-next-line no-unused-vars
    const [user, created] = await db.User.findOrCreate({
      where: { slackId: userSlackId },
      include: [db.Group, db.UserProfile],
    });
    await user.profileCheck(db);

    if (!req.slack) {
      req.slack = {};
    }

    logger.info(`${logPrefix}Found current user and loaded req.currentUser: ${user.UserProfile.realName}`);
    req.currentUser = user;
  }

  next();
};
