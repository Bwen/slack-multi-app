module.exports = {
  // eslint-disable-next-line no-unused-vars
  up: async (queryInterface, Sequelize) => queryInterface.bulkInsert('groups', [
    {
      name: 'admin',
      description: 'Administrators of the Slack Bot',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),

  // eslint-disable-next-line no-unused-vars
  down: async (queryInterface, Sequelize) => queryInterface.bulkDelete('groups', null, {}),
};
