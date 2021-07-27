const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PulseValue extends Model {
    static associate(models) {
      PulseValue.belongsTo(models.PulseChoice, { foreignKey: 'choice_id' });
      PulseValue.belongsTo(models.User, { foreignKey: 'createdBy' });
    }
  }

  PulseValue.init({
    choiceId: {
      type: DataTypes.INTEGER,
      field: 'choice_id',
    },
    createdBy: DataTypes.INTEGER,
    comment: DataTypes.TEXT,
  }, {
    sequelize,
    modelName: 'PulseValue',
    tableName: 'pulse_values',
  });

  return PulseValue;
};
