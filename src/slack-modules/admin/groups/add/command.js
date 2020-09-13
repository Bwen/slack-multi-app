const db = require(`${process.env.root}/sequelize`);
const { MissingArgumentError } = require(`${process.env.root}/src/errors/validation`);

const MODULE_PATH = 'admin:groups:add';
function validateAndParse(values) {
  if (values === undefined || !values.length || values.length < 2) {
    throw new MissingArgumentError(MODULE_PATH);
  }

  return values;
}

module.exports = async (slackUser, slackReq) => {
  const values = validateAndParse(slackReq.module.params.values);

  await db.Group.findOrCreate({
    where: { name: values[0] },
    defaults: { description: values[1] },
    order: [['name', 'ASC']],
  });
};
