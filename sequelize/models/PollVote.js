const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PollVote extends Model {
    static associate(models) {
      PollVote.belongsTo(models.PollChoice, { foreignKey: 'choice_id' });
      PollVote.belongsTo(models.User, { foreignKey: 'createdBy' });
    }
  }

  PollVote.init({
    choiceId: {
      type: DataTypes.INTEGER,
      field: 'choice_id',
    },
    createdBy: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'PollVote',
    tableName: 'poll_votes',
  });

  return PollVote;
};
