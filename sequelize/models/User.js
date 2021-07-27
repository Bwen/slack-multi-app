const { Model } = require('sequelize');
// eslint-disable-next-line import/no-extraneous-dependencies
const moment = require('moment');
const { getSlackApi } = require('../../src/wrapper-slack-api');

/**
 * Calls Slack API to retireve user info and returns an object
 * reflecting the Sequelize Model columns for UserProfile
 *
 * @param userId
 * @param slackId
 * @returns {}
 */
async function getProfileData(userId, slackId) {
  const web = getSlackApi();
  const result = await web.users.info({ user: slackId });
  return {
    userId,
    timezone: result.user.tz,
    timezoneOffset: result.user.tz_offset,
    avatarHash: result.user.profile.avatar_hash,
    statusText: result.user.profile.status_text,
    statusEmoji: result.user.profile.status_emoji,
    statusExpiration: result.user.profile.status_expiration,
    realName: result.user.profile.real_name,
    displayName: result.user.profile.display_name,
    email: result.user.profile.email,
    team: result.user.profile.team,
    imageOriginal: result.user.profile.image_original,
    image24: result.user.profile.image_24,
    image32: result.user.profile.image_32,
    image48: result.user.profile.image_48,
    image72: result.user.profile.image_72,
    image192: result.user.profile.image_192,
    image512: result.user.profile.image_512,
  };
}

/**
 * If the provided date is older than 7 days return true
 *
 * @param updatedAt
 * @returns {boolean}
 */
function isStale(updatedAt) {
  const lastUpdated = moment(updatedAt, 'YYY-MM-DD');
  return moment().diff(lastUpdated, 'days') > 7;
}

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
        const data = await getProfileData(this.id, this.slackId);
        this.UserProfile = await db.UserProfile.create(data);

        // We dont wanna call Slack API on every request for user info
        // But we do want to update it if its stale or missing info in newly added columns
      } else if (isStale(this.UserProfile.updatedAt) || !this.UserProfile.timezone) {
        const data = await getProfileData(this.id, this.slackId);
        this.UserProfile = await db.UserProfile.update(data, { where: { id: this.UserProfile.id } });
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
