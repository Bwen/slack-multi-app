const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Group extends Model {
    static associate(models) {
      Group.belongsToMany(models.User, { through: 'user_groups', foreignKey: 'group_id' });
      Group.hasMany(models.GroupAcl, { foreignKey: 'group_id' });
    }
  }

  Group.init({
    name: DataTypes.STRING,
    description: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Group',
    tableName: 'groups',
  });

  return Group;
};
