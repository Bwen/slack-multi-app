const logger = require('../logger');
const db = require('../../sequelize');

const logPrefix = 'middleware-current-user: ';
module.exports = () => async (req, res, next) => {
  let userId = null;
  if (req.body && req.body.user_id) {
    userId = req.body.user_id;
  } else if (req.body && req.body.payload) {
    const payload = JSON.parse(req.body.payload);
    userId = payload.user.id;
  }

  if (userId) {
    // eslint-disable-next-line no-unused-vars
    const [user, created] = await db.User.findOrCreate({
      where: { slackId: userId },
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
