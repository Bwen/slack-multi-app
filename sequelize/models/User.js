const { Model } = require('sequelize');
const { getSlackApi } = require('../../src/slack-api-wrapper');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasOne(models.UserProfile, { through: 'user_profiles', foreignKey: 'user_id' });
      User.hasMany(models.UserActivity, { foreignKey: 'createdBy' });
      User.hasMany(models.Poll, { foreignKey: 'createdBy' });
      User.hasMany(models.PollVote, { foreignKey: 'createdBy' });
      User.belongsToMany(models.Group, { through: 'user_groups', foreignKey: 'user_id' });
    }

    async profileCheck(db) {
      if (!this.UserProfile) {
        const web = getSlackApi();
        const result = await web.users.profile.get({ user: this.slackId });
        this.UserProfile = await db.UserProfile.create({
          userId: this.id,
          avatarHash: result.profile.avatar_hash,
          statusText: result.profile.status_text,
          statusEmoji: result.profile.status_emoji,
          statusExpiration: result.profile.status_expiration,
          realName: result.profile.real_name,
          displayName: result.profile.display_name,
          email: result.profile.email,
          team: result.profile.team,
          imageOriginal: result.profile.image_original,
          image24: result.profile.image_24,
          image32: result.profile.image_32,
          image48: result.profile.image_48,
          image72: result.profile.image_72,
          image192: result.profile.image_192,
          image512: result.profile.image_512,
        });
      }
    }

    inGroup(name) {
      return this.Groups.find((group) => group.name === name) !== undefined;
    }
  }

  User.init({
    slackId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'slack_id',
    },
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
  });

  return User;
};
