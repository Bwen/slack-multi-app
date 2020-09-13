module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_profiles', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      avatar_hash: Sequelize.STRING,
      status_text: Sequelize.STRING,
      status_emoji: Sequelize.STRING,
      status_expiration: Sequelize.INTEGER,
      real_name: Sequelize.STRING,
      display_name: Sequelize.STRING,
      email: Sequelize.STRING,
      team: Sequelize.STRING,
      image_original: Sequelize.STRING,
      image_24: Sequelize.STRING,
      image_32: Sequelize.STRING,
      image_48: Sequelize.STRING,
      image_72: Sequelize.STRING,
      image_192: Sequelize.STRING,
      image_512: Sequelize.STRING,
    });
  },

  // eslint-disable-next-line no-unused-vars
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_profiles');
  },
};
