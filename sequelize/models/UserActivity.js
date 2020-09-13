const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserActivity extends Model {
    static associate(models) {
      UserActivity.belongsTo(models.User, { foreignKey: 'createdBy' });
    }
  }

  UserActivity.init({
    createdBy: DataTypes.INTEGER,
    channelId: {
      type: DataTypes.STRING,
      field: 'channel_id',
    },
    triggerId: {
      type: DataTypes.STRING,
      field: 'trigger_id',
    },
    responseUrl: {
      type: DataTypes.STRING,
      field: 'response_url',
    },
    isCommand: {
      type: DataTypes.ENUM(['yes', 'no']),
      field: 'is_command',
    },
    isInteraction: {
      type: DataTypes.ENUM(['yes', 'no']),
      field: 'is_interaction',
    },
    isModalSubmission: {
      type: DataTypes.ENUM(['yes', 'no']),
      field: 'is_modal_submission',
    },
    path: DataTypes.STRING,
    params: DataTypes.STRING,
    response: DataTypes.BLOB,
  }, {
    sequelize,
    modelName: 'UserActivity',
    tableName: 'user_activities',
  });

  return UserActivity;
};
