const db = require(`${process.env.root}/sequelize`);

// const MODULE_PATH = 'admin:users:list';
const ENTRIES_LIMIT = 20;
// function validateAndParse(values) {
//   return values;
// }

// eslint-disable-next-line no-unused-vars
module.exports = async (slackUser, slackReq) => {
  // const filters = validateAndParse(slackReq.module.params.values);
  const { count, rows } = await db.User.findAndCountAll({
    attributes: ['slackId'],
    include: [
      {
        model: db.UserProfile,
        attributes: ['displayName', 'realName'],
      },
      {
        model: db.Group,
        attributes: ['name'],
      },
    ],
    limit: ENTRIES_LIMIT,
    order: [['UserProfile', 'realName', 'ASC']],
  });

  const data = [['Slack Id', 'Name', 'Display Name', 'Groups']];
  rows.forEach((user) => {
    data.push([
      user.slackId,
      user.UserProfile ? user.UserProfile.realName : '',
      user.UserProfile ? user.UserProfile.displayName : '',
      user.Groups.map((group) => group.name).join(', '),
    ]);
  });

  return {
    type: 'renderer.dataList',
    data,
    total: count,
    limit: ENTRIES_LIMIT,
  };
};
