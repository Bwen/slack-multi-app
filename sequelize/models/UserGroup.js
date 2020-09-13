const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  // eslint-disable-next-line camelcase
  class UserGroup extends Model {
    // eslint-disable-next-line no-unused-vars
    static associate(models) {}
  }

  UserGroup.init({
    userId: {
      type: DataTypes.INTEGER,
      field: 'user_id',
    },
    groupId: {
      type: DataTypes.INTEGER,
      field: 'group_id',
    },
  }, {
    sequelize,
    modelName: 'UserGroup',
    tableName: 'user_groups',
  });

  UserGroup.removeAttribute('id');

  // eslint-disable-next-line camelcase
  return UserGroup;
};
