module.exports = {
  up: async (queryInterface, Sequelize) => [
    await queryInterface.addColumn('user_profiles', 'timezone_offset', {
      type: Sequelize.INTEGER,
      after: 'user_id',
    }),
    await queryInterface.addColumn('user_profiles', 'timezone', {
      type: Sequelize.STRING,
      after: 'user_id',
    }),
  ],

  down: async (queryInterface) => [
    await queryInterface.removeColumn('user_profiles', 'timezone'),
    await queryInterface.removeColumn('user_profiles', 'timezone_offset'),
  ],
};
