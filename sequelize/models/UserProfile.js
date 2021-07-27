const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserProfile extends Model {
    static associate(models) {
      UserProfile.belongsTo(models.User, { foreignKey: 'user_id' });
    }
  }

  UserProfile.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
    },
    timezone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    timezoneOffset: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'timezone_offset',
    },
    avatarHash: {
      type: DataTypes.STRING,
      field: 'avatar_hash',
    },
    statusText: {
      type: DataTypes.STRING,
      field: 'status_text',
    },
    statusEmoji: {
      type: DataTypes.STRING,
      field: 'status_emoji',
    },
    statusExpiration: {
      type: DataTypes.INTEGER,
      field: 'status_expiration',
    },
    realName: {
      type: DataTypes.STRING,
      field: 'real_name',
    },
    displayName: {
      type: DataTypes.STRING,
      field: 'display_name',
    },
    email: DataTypes.STRING,
    team: DataTypes.STRING,
    imageOriginal: {
      type: DataTypes.STRING,
      field: 'image_original',
    },
    image24: {
      type: DataTypes.STRING,
      field: 'image_24',
    },
    image32: {
      type: DataTypes.STRING,
      field: 'image_32',
    },
    image48: {
      type: DataTypes.STRING,
      field: 'image_48',
    },
    image72: {
      type: DataTypes.STRING,
      field: 'image_72',
    },
    image192: {
      type: DataTypes.STRING,
      field: 'image_192',
    },
    image512: {
      type: DataTypes.STRING,
      field: 'image_512',
    },
  }, {
    sequelize,
    modelName: 'UserProfile',
    tableName: 'user_profiles',
  });

  return UserProfile;
};
