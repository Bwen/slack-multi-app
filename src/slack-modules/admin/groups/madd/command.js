const db = require(`${process.env.root}/sequelize`);
const { MissingArgumentError, InvalidArgumentError } = require(`${process.env.root}/src/errors/validation`);

const MODULE_PATH = 'admin:groups:madd';
async function validateAndParse(values) {
  if (values === undefined || !values.length || values.length < 2) {
    throw new MissingArgumentError(MODULE_PATH);
  }

  const path = values.shift();
  const promises = values.map((name) => db.Group.findOne({ where: { name } }));
  const groups = await Promise.all(promises);

  // Check for invalid groups
  groups.forEach((group, index) => {
    if (group === null) {
      throw new InvalidArgumentError(MODULE_PATH, `Group not found \`${values[index]}\``);
    }
  });

  return [path, groups];
}

module.exports = async (slackUser, slackReq) => {
  const [path, groups] = await validateAndParse(slackReq.module.params.values);
  const promises = groups.map(async (group) => {
    const acl = db.GroupAcl.build({ groupId: group.id, path });
    await acl.save();
  });
  await Promise.all(promises);
};
