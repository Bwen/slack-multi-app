module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_activities', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      channel_id: Sequelize.STRING,
      trigger_id: Sequelize.STRING,
      response_url: Sequelize.STRING,
      is_command: Sequelize.ENUM(['yes', 'no']),
      is_interaction: Sequelize.ENUM(['yes', 'no']),
      is_modal_submission: Sequelize.ENUM(['yes', 'no']),
      path: Sequelize.STRING,
      params: Sequelize.STRING,
      response: Sequelize.BLOB,
      createdBy: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  // eslint-disable-next-line no-unused-vars
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_activities');
  },
};
