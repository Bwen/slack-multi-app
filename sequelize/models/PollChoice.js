const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PollChoice extends Model {
    static associate(models) {
      PollChoice.hasMany(models.PollVote, { foreignKey: 'choice_id' });
      PollChoice.belongsTo(models.Poll, { foreignKey: 'poll_id' });
    }
  }

  PollChoice.init({
    pollId: {
      type: DataTypes.INTEGER,
      field: 'poll_id',
    },
    text: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'PollChoice',
    tableName: 'poll_choices',
  });

  return PollChoice;
};
