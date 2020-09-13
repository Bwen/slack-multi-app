/* eslint-env node, mocha */
const { assert } = require('chai');
const { createGroup } = require('../helper');

const db = require(`${process.env.root}/sequelize`);
const { MissingArgumentError, InvalidArgumentError } = require(`${process.env.root}/src/errors/validation`);
const madd = require(`${process.env.root}/src/slack-modules/admin/groups/madd/command`);

describe('slack-modules admin:groups:madd', () => {
  before(async () => {
    await db.GroupAcl.truncate();
    await db.Group.truncate();
  });

  it('throws a validation error if no params', async () => {
    const slackReq = { module: { params: {} } };
    try {
      await madd({}, slackReq);
      assert.isTrue(false, 'Should of throw an MissingArgumentError');
    } catch (e) {
      assert.instanceOf(e, MissingArgumentError);
      assert.equal(e.message, 'Missing arguments for: `admin:groups:madd`');
    }
  });

  it('throws a validation error if group not found', async () => {
    const slackReq = { module: { params: { values: ['test:*', 'invalid'] } } };
    try {
      await madd({}, slackReq);
      assert.isTrue(false, 'Should of throw an InvalidArgumentError');
    } catch (e) {
      assert.instanceOf(e, InvalidArgumentError);
      assert.equal(e.message, 'Invalid argument for: `admin:groups:madd`');
      assert.equal(e.detail, 'Group not found `invalid`');
    }
  });

  it('adds ACL path to a single group', async () => {
    const group = await createGroup();
    const slackReq = { module: { params: { values: ['test1:*', group.name] } } };
    await madd({}, slackReq);
    const acls = await db.GroupAcl.findAll({ where: { path: 'test1:*' } });
    assert.equal(1, acls.length);
    assert.equal(group.id, acls[0].groupId);
  });

  it('adds ACL path to a multiple groups', async () => {
    const group1 = await createGroup({ name: 'test1' });
    const group2 = await createGroup({ name: 'test2' });
    const slackReq = { module: { params: { values: ['test2:*', group1.name, group2.name] } } };
    await madd({}, slackReq);
    const acls = await db.GroupAcl.findAll({ where: { path: 'test2:*' } });
    assert.equal(2, acls.length);
    assert.equal(group1.id, acls[0].groupId);
    assert.equal(group2.id, acls[1].groupId);
  });
});
