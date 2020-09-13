module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('polls', {
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
      question: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      end_date: Sequelize.DATE,
      post_anonymous: Sequelize.ENUM(['yes', 'no']),
      anonymous_votes: Sequelize.ENUM(['yes', 'no']),
      vote_change: Sequelize.ENUM(['yes', 'no']),
      suggestion: Sequelize.ENUM(['yes', 'no']),
      vote_per_user: Sequelize.INTEGER,
    });
  },

  // eslint-disable-next-line no-unused-vars
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('polls');
  },
};
