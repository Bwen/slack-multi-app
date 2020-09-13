const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class GroupAcl extends Model {
    static associate(models) {
      GroupAcl.belongsTo(models.Group, { foreignKey: 'group_id' });
    }
  }

  GroupAcl.init({
    groupId: {
      type: DataTypes.INTEGER,
      field: 'group_id',
    },
    path: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'GroupAcl',
    tableName: 'group_acls',
  });

  return GroupAcl;
};
