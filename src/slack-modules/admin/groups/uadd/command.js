const db = require(`${process.env.root}/sequelize`);
const { MissingArgumentError, InvalidArgumentError } = require(`${process.env.root}/src/errors/validation`);

const MODULE_PATH = 'admin:groups:uadd';
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

  // Check for invalid groups
  users.forEach((user, index) => {
    if (user === null) {
      throw new InvalidArgumentError(MODULE_PATH, `User not found \`${values[index]}\``);
    }
  });

  return [group, users];
}

module.exports = async (slackUser, slackReq) => {
  const [group, users] = await validateAndParse(slackReq.module.params.values);
  const promises = users.map(async (user) => {
    const link = db.UserGroup.build({ groupId: group.id, userId: user.id });
    await link.save();
  });
  await Promise.all(promises);
};
