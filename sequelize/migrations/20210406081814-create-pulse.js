module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('pulses', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
      createdBy: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM(['running', 'paused', 'deleted']),
        defaultValue: 'paused',
        allowNull: false,
      },
      interval: {
        type: Sequelize.ENUM(['daily', 'weekly', 'monthly']),
        defaultValue: 'daily',
        allowNull: false,
      },
      day_of_week: {
        type: Sequelize.INTEGER,
        defaultValue: null,
        allowNull: true,
      },
      day_of_month: {
        type: Sequelize.INTEGER,
        defaultValue: null,
        allowNull: true,
      },
      time: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      next_pulse: {
        type: 'TIMESTAMP',
        allowNull: true,
      },
      user_slack_ids: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      question: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    });
  },

  // eslint-disable-next-line no-unused-vars
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('pulse');
  },
};
