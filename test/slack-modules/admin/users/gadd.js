/* eslint-env node, mocha */
const { assert } = require('chai');
const { createSlackUser } = require('../../../utils');
const { createGroup } = require('../helper');

const db = require(`${process.env.root}/sequelize`);
const { MissingArgumentError, InvalidArgumentError } = require(`${process.env.root}/src/errors/validation`);
const gadd = require(`${process.env.root}/src/slack-modules/admin/users/gadd/command`);

describe('slack-modules admin:users:gadd', () => {
  beforeEach(async () => {
    await db.UserGroup.truncate();
    await db.Group.truncate();
    await db.User.truncate();
  });

  it('throws a validation error if no params', async () => {
    const slackReq = { module: { params: {} } };
    try {
      await gadd({}, slackReq);
      assert.isTrue(false, 'Should of throw an MissingArgumentError');
    } catch (e) {
      assert.instanceOf(e, MissingArgumentError);
      assert.equal(e.message, 'Missing arguments for: `admin:users:gadd`');
    }
  });

  it('throws a validation error if group not found', async () => {
    const user = await createSlackUser();
    const slackReq = { module: { params: { values: [user.slackId, 'invalid-group'] } } };
    try {
      await gadd({}, slackReq);
      assert.isTrue(false, 'Should of throw an InvalidArgumentError');
    } catch (e) {
      assert.instanceOf(e, InvalidArgumentError);
      assert.equal(e.message, 'Invalid argument for: `admin:users:gadd`');
      assert.equal(e.detail, 'Group not found `invalid-group`');
    }
  });

  it('throws a validation error if user not found', async () => {
    const slackReq = { module: { params: { values: ['invalid-user', 'invalid-group'] } } };
    try {
      await gadd({}, slackReq);
      assert.isTrue(false, 'Should of throw an InvalidArgumentError');
    } catch (e) {
      assert.instanceOf(e, InvalidArgumentError);
      assert.equal(e.message, 'Invalid argument for: `admin:users:gadd`');
      assert.equal(e.detail, 'User not found `invalid-user`');
    }
  });

  it('adds a user to a single group', async () => {
    const user = await createSlackUser();
    const group = await createGroup();
    const slackReq = { module: { params: { values: [user.slackId, group.name] } } };
    await gadd({}, slackReq);
    const links = await db.UserGroup.findAll({ where: { userId: user.id } });
    assert.equal(1, links.length);
    assert.equal(group.id, links[0].groupId);
  });

  it('adds a user to a multiple groups', async () => {
    const user = await createSlackUser();
    const group1 = await createGroup({ name: 'test1' });
    const group2 = await createGroup({ name: 'test2' });
    const slackReq = { module: { params: { values: [user.slackId, group1.name, group2.name] } } };
    await gadd({}, slackReq);
    const links = await db.UserGroup.findAll({ where: { userId: user.id } });
    assert.equal(2, links.length);
    assert.equal(group1.id, links[0].groupId);
    assert.equal(group2.id, links[1].groupId);
  });
});
