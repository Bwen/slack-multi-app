/* eslint-env node, mocha */
const { assert } = require('chai');
const { createSlackUser } = require('../../../utils');
const { createGroup } = require('../helper');

const db = require(`${process.env.root}/sequelize`);
const { MissingArgumentError, InvalidArgumentError } = require(`${process.env.root}/src/errors/validation`);
const gdel = require(`${process.env.root}/src/slack-modules/admin/users/gdel/command`);

describe('slack-modules admin:users:gdel', () => {
  beforeEach(async () => {
    await db.UserGroup.truncate();
    await db.Group.truncate();
    await db.User.truncate();
  });

  it('throws a validation error if no params', async () => {
    const slackReq = { module: { params: {} } };
    try {
      await gdel({}, slackReq);
      assert.isTrue(false, 'Should of throw an MissingArgumentError');
    } catch (e) {
      assert.instanceOf(e, MissingArgumentError);
      assert.equal(e.message, 'Missing arguments for: `admin:users:gdel`');
    }
  });

  it('throws a validation error if group not found', async () => {
    const user = await createSlackUser();
    const slackReq = { module: { params: { values: [user.slackId, 'invalid-group'] } } };
    try {
      await gdel({}, slackReq);
      assert.isTrue(false, 'Should of throw an InvalidArgumentError');
    } catch (e) {
      assert.instanceOf(e, InvalidArgumentError);
      assert.equal(e.message, 'Invalid argument for: `admin:users:gdel`');
      assert.equal(e.detail, 'Group not found `invalid-group`');
    }
  });

  it('throws a validation error if user not found', async () => {
    const slackReq = { module: { params: { values: ['invalid-user', 'invalid-group'] } } };
    try {
      await gdel({}, slackReq);
      assert.isTrue(false, 'Should of throw an InvalidArgumentError');
    } catch (e) {
      assert.instanceOf(e, InvalidArgumentError);
      assert.equal(e.message, 'Invalid argument for: `admin:users:gdel`');
      assert.equal(e.detail, 'User not found `invalid-user`');
    }
  });

  it('deletes a user to a single group', async () => {
    const user = await createSlackUser();
    const group = await createGroup();
    await db.UserGroup.create({ groupId: group.id, userId: user.id });
    const slackReq = { module: { params: { values: [user.slackId, group.name] } } };
    await gdel({}, slackReq);
    const links = await db.UserGroup.findAll({ where: { userId: user.id } });
    assert.equal(0, links.length);
  });

  it('deletes a user to a multiple groups', async () => {
    const user = await createSlackUser();
    const group1 = await createGroup({ name: 'test1' });
    const group2 = await createGroup({ name: 'test2' });
    await db.UserGroup.create({ groupId: group1.id, userId: user.id });
    await db.UserGroup.create({ groupId: group2.id, userId: user.id });
    const slackReq = { module: { params: { values: [user.slackId, group1.name, group2.name] } } };
    await gdel({}, slackReq);
    const links = await db.UserGroup.findAll({ where: { userId: user.id } });
    assert.equal(0, links.length);
  });
});
