module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('pulse_choices', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
      pulse_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'pulses',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      text: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    });
  },

  // eslint-disable-next-line no-unused-vars
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('pulse_choices');
  },
};
