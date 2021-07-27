const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PulseChoice extends Model {
    static associate(models) {
      PulseChoice.belongsTo(models.Pulse, { foreignKey: 'pulse_id' });
      PulseChoice.hasMany(models.PulseValue, { foreignKey: 'choice_id' });
    }
  }

  PulseChoice.init({
    pulseId: {
      type: DataTypes.INTEGER,
      field: 'pulse_id',
    },
    text: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'PulseChoice',
    tableName: 'pulse_choices',
  });

  return PulseChoice;
};
