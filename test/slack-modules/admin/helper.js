const db = require('../../../sequelize');
const { createSlackUser } = require('../../utils');

async function createGroup(options = {}) {
  // eslint-disable-next-line no-unused-vars
  const [group, created] = await db.Group.findOrCreate({
    where: { name: options.name ? options.name : 'test' },
    defaults: {
      name: options.name ? options.name : 'test',
      description: options.description ? options.description : 'Test Group Description',
    },
  });

  return group;
}

module.exports = {
  createGroup,
};
