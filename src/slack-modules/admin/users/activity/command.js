const db = require(`${process.env.root}/sequelize`);

const MODULE_PATH = 'admin:users:activity';
const ENTRIES_LIMIT = 20;
function validateAndParse(values) {
  return values;
}

module.exports = async (slackUser, slackReq) => {
  const filters = validateAndParse(slackReq.module.params.values);
  const { count, rows } = await db.UserActivity.findAndCountAll({
    attributes: ['path', 'params', 'createdAt', 'createdBy'],
    include: [{
      model: db.User,
      attributes: ['id'],
      include: [{
        model: db.UserProfile,
        attributes: ['realName'],
      }],
    }],
    limit: ENTRIES_LIMIT,
    order: [['createdAt', 'DESC']],
  });

  const data = [['Path', 'Params', 'Created', 'User']];
  rows.forEach((activity) => {
    data.push([
      activity.path,
      activity.params,
      activity.createdAt,
      activity.User.UserProfile.realName,
    ]);
  });

  return {
    type: 'renderer.dataList',
    data,
    total: count,
    limit: ENTRIES_LIMIT,
  };
};
