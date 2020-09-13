const db = require(`${process.env.root}/sequelize`);
const { MissingArgumentError, InvalidArgumentError } = require(`${process.env.root}/src/errors/validation`);

const MODULE_PATH = 'admin:groups:del';
async function validateAndParse(values) {
  if (values === undefined || !values.length) {
    throw new MissingArgumentError(MODULE_PATH);
  }

  const promises = values.map((name) => db.Group.findOne({ where: { name } }));
  const groups = await Promise.all(promises);

  // Check for invalid groups
  groups.forEach((group, index) => {
    if (group === null) {
      throw new InvalidArgumentError(MODULE_PATH, `Group not found \`${values[index]}\``);
    }
  });

  return groups;
}

module.exports = async (slackUser, slackReq) => {
  const groups = await validateAndParse(slackReq.module.params.values);
  const promises = groups.map(async (group) => group.destroy());
  await Promise.all(promises);
};
