/* eslint-env node, mocha */
const { assert } = require('chai');
const { createGroup } = require('../helper');

const db = require(`${process.env.root}/sequelize`);
const { MissingArgumentError, InvalidArgumentError } = require(`${process.env.root}/src/errors/validation`);
const mdel = require(`${process.env.root}/src/slack-modules/admin/groups/mdel/command`);

describe('slack-modules admin:groups:mdel', () => {
  before(async () => {
    await db.GroupAcl.truncate();
    await db.Group.truncate();
  });

  it('throws a validation error if no params', async () => {
    const slackReq = { module: { params: {} } };
    try {
      await mdel({}, slackReq);
      assert.isTrue(false, 'Should of throw an MissingArgumentError');
    } catch (e) {
      assert.instanceOf(e, MissingArgumentError);
      assert.equal(e.message, 'Missing arguments for: `admin:groups:mdel`');
    }
  });

  it('throws a validation error if group not found', async () => {
    const group = await createGroup();
    await db.GroupAcl.create({ groupId: group.id, path: 'test:*' });
    const slackReq = { module: { params: { values: ['test:*', 'invalid'] } } };
    try {
      await mdel({}, slackReq);
      assert.isTrue(false, 'Should of throw an InvalidArgumentError');
    } catch (e) {
      assert.instanceOf(e, InvalidArgumentError);
      assert.equal(e.message, 'Invalid argument for: `admin:groups:mdel`');
      assert.equal(e.detail, 'Group not found `invalid`');
    }
  });

  it('throws a validation error if path not found', async () => {
    const slackReq = { module: { params: { values: ['invalid', 'invalid'] } } };
    try {
      await mdel({}, slackReq);
      assert.isTrue(false, 'Should of throw an InvalidArgumentError');
    } catch (e) {
      assert.instanceOf(e, InvalidArgumentError);
      assert.equal(e.message, 'Invalid argument for: `admin:groups:mdel`');
      assert.equal(e.detail, 'ACL path not found `invalid`');
    }
  });

  it('deletes an ACL path to from single group', async () => {
    const group = await createGroup({ name: 'group1' });
    await db.GroupAcl.create({ groupId: group.id, path: 'test1:*' });

    const slackReq = { module: { params: { values: ['test1:*', group.name] } } };
    await mdel({}, slackReq);
    const acls = await db.GroupAcl.findAll({ where: { path: 'test1:*' } });
    assert.equal(0, acls.length);
  });

  it('deletes an ACL path to from multiple groups', async () => {
    const group1 = await createGroup({ name: 'group1' });
    await db.GroupAcl.create({ groupId: group1.id, path: 'test2:*' });

    const group2 = await createGroup({ name: 'group2' });
    await db.GroupAcl.create({ groupId: group2.id, path: 'test2:*' });

    const slackReq = { module: { params: { values: ['test2:*', group1.name, group2.name] } } };
    await mdel({}, slackReq);
    const acls = await db.GroupAcl.findAll({ where: { path: 'test2:*' } });
    assert.equal(0, acls.length);
  });
});
