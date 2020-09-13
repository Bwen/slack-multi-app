const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Poll extends Model {
    static associate(models) {
      Poll.belongsTo(models.User, { foreignKey: 'createdBy' });
      Poll.hasMany(models.PollChoice, { foreignKey: 'poll_id' });
    }
  }

  Poll.init({
    question: DataTypes.STRING,
    createdBy: DataTypes.INTEGER,
    endDate: {
      type: DataTypes.DATE,
      field: 'end_date',
    },
    postAnonymous: {
      type: DataTypes.ENUM(['yes', 'no']),
      field: 'post_anonymous',
    },
    anonymousVotes: {
      type: DataTypes.ENUM(['yes', 'no']),
      field: 'anonymous_votes',
    },
    voteChange: {
      type: DataTypes.ENUM(['yes', 'no']),
      field: 'vote_change',
    },
    suggestion: {
      type: DataTypes.ENUM(['yes', 'no']),
    },
    votePerUser: {
      type: DataTypes.INTEGER,
      field: 'vote_per_user',
    },
  }, {
    sequelize,
    modelName: 'Poll',
    tableName: 'polls',
  });

  return Poll;
};
