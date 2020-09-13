const db = require(`${process.env.root}/sequelize`);
const { MissingArgumentError, InvalidArgumentError } = require(`${process.env.root}/src/errors/validation`);

const MODULE_PATH = 'admin:users:gadd';
async function validateAndParse(values) {
  if (values === undefined || !values.length || values.length < 2) {
    throw new MissingArgumentError(MODULE_PATH);
  }

  const slackId = values.shift();
  const user = await db.User.findOne({ where: { slackId } });
  if (user === null) {
    throw new InvalidArgumentError(MODULE_PATH, `User not found \`${slackId}\``);
  }

  const promises = values.map((name) => db.Group.findOne({ where: { name } }));
  const groups = await Promise.all(promises);

  // Check for invalid groups
  groups.forEach((group, index) => {
    if (group === null) {
      throw new InvalidArgumentError(MODULE_PATH, `Group not found \`${values[index]}\``);
    }
  });

  return [user, groups];
}

module.exports = async (slackUser, slackReq) => {
  const [user, groups] = await validateAndParse(slackReq.module.params.values);
  const promises = groups.map(async (group) => {
    const link = db.UserGroup.build({ groupId: group.id, userId: user.id });
    await link.save();
  });
  await Promise.all(promises);
};
