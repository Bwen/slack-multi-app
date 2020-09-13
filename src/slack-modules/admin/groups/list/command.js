const db = require(`${process.env.root}/sequelize`);

const MODULE_PATH = 'admin:groups:list';
const ENTRIES_LIMIT = 20;
function validateAndParse(values) {
  return values;
}

module.exports = async (slackUser, slackReq) => {
  const filters = validateAndParse(slackReq.module.params.values);
  const { count, rows } = await db.Group.findAndCountAll({
    attributes: ['name', 'description'],
    include: [{
      model: db.User,
      attributes: ['id'],
      include: [{
        model: db.UserProfile,
        attributes: ['realName'],
      }],
    }],
    limit: ENTRIES_LIMIT,
  });

  const data = [['Name', 'Description', 'Users']];
  rows.forEach((group) => {
    data.push([group.name, group.description, group.Users.map((user) => user.UserProfile.realName).join(', ')]);
  });

  return {
    type: 'renderer.dataList',
    data,
    total: count,
    limit: ENTRIES_LIMIT,
  };
};
