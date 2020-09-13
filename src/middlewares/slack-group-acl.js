const logger = require('../logger');
const db = require('../../sequelize');
const { accessDenied } = require('../renderer');

let acls = {};
async function fetchGroupACLs() {
  const groups = await db.Group.findAll({
    attributes: ['name'],
    include: [
      {
        model: db.GroupAcl,
        attributes: ['path'],
      },
    ],
  });

  const list = {};
  for (let i = 0; i < groups.length; i += 1) {
    const { name } = groups[i];
    const groupAcls = groups[i].GroupAcls;
    for (let j = 0; j < groupAcls.length; j += 1) {
      const { path } = groupAcls[j];
      if (!Object.prototype.hasOwnProperty.call(path, list)) {
        list[path] = [];
      }

      list[path].push(name);
    }
  }

  return list;
}

const logPrefix = 'middleware-group-acl: ';
module.exports = () => async (req, res, next) => {
  if (!acls.length || req.slack.clearCache) {
    acls = await fetchGroupACLs();
  }

  logger.info(`${logPrefix}Checking module path ACL...`);
  let checkGroups = [];
  const paths = Object.keys(acls);
  const modulePath = req.slack.module.path.join(':');
  for (let i = 0; i < paths.length; i += 1) {
    const regex = new RegExp(paths[i], 'i');
    if (modulePath.match(regex)) {
      checkGroups = [...checkGroups, ...acls[paths[i]]];
    }
  }

  if (checkGroups.length) {
    // Remove duplicates
    checkGroups = [...new Set(checkGroups)];
    logger.info(`${logPrefix}Groups found for ${modulePath}: ${checkGroups.join(',')}`);

    let hasAccess = false;
    // Check if current user has the necessary group,
    // Many groups can have access, user need at least one
    for (let i = 0; i < checkGroups.length; i += 1) {
      const group = checkGroups[i];
      if (req.currentUser.inGroup(group)) {
        logger.info(`${logPrefix}User (${req.currentUser.UserProfile.realName}) granted access to protected path ${modulePath}`);
        hasAccess = true;
        break;
      }
    }

    if (!hasAccess) {
      logger.warn(`${logPrefix}User (${req.currentUser.UserProfile.realName}) tried to access ${modulePath} without authorization`);
      accessDenied(res, req.slack);
      return false;
    }
  }

  next();
  return true;
};
