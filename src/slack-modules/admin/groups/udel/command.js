const db = require(`${process.env.root}/sequelize`);
const { MissingArgumentError, InvalidArgumentError } = require(`${process.env.root}/src/errors/validation`);

const MODULE_PATH = 'admin:groups:udel';
async function validateAndParse(values) {
  if (values === undefined || !values.length || values.length < 2) {
    throw new MissingArgumentError(MODULE_PATH);
  }

  const groupName = values.shift();
  const group = await db.Group.findOne({ where: { name: groupName } });
  if (group === null) {
    throw new InvalidArgumentError(MODULE_PATH, `Group not found \`${groupName}\``);
  }

  const promises = values.map((slackId) => db.User.findOne({ where: { slackId } }));
  const users = await Promise.all(promises);

  // Check for invalid users
  users.forEach((user, index) => {
    if (user === null) {
      throw new InvalidArgumentError(MODULE_PATH, `User not found \`${values[index]}\``);
    }
  });

  return [group, users];
}

module.exports = async (slackUser, slackReq) => {
  const [group, users] = await validateAndParse(slackReq.module.params.values);
  const links = await db.UserGroup.findAll({
    where: {
      groupId: group.id,
      userId: users.map((user) => user.id),
    },
  });

  const promises = links.map(async (link) => link.destroy());
  await Promise.all(promises);
};
