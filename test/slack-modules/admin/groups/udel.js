/* eslint-env node, mocha */
const { assert } = require('chai');
const { createSlackUser } = require('../../../utils');
const { createGroup } = require('../helper');

const db = require(`${process.env.root}/sequelize`);
const { MissingArgumentError, InvalidArgumentError } = require(`${process.env.root}/src/errors/validation`);
const udel = require(`${process.env.root}/src/slack-modules/admin/groups/udel/command`);

describe('slack-modules admin:groups:udel', () => {
  beforeEach(async () => {
    await db.UserGroup.truncate();
    await db.Group.truncate();
    await db.User.truncate();
  });

  it('throws a validation error if no params', async () => {
    const slackReq = { module: { params: {} } };
    try {
      await udel({}, slackReq);
      assert.isTrue(false, 'Should of throw an MissingArgumentError');
    } catch (e) {
      assert.instanceOf(e, MissingArgumentError);
      assert.equal(e.message, 'Missing arguments for: `admin:groups:udel`');
    }
  });

  it('throws a validation error if group not found', async () => {
    const slackReq = { module: { params: { values: ['invalid-group', 'invalid-user'] } } };
    try {
      await udel({}, slackReq);
      assert.isTrue(false, 'Should of throw an InvalidArgumentError');
    } catch (e) {
      assert.instanceOf(e, InvalidArgumentError);
      assert.equal(e.message, 'Invalid argument for: `admin:groups:udel`');
      assert.equal(e.detail, 'Group not found `invalid-group`');
    }
  });

  it('throws a validation error if user not found', async () => {
    const group = await createGroup();
    const slackReq = { module: { params: { values: [group.name, 'invalid-user'] } } };
    try {
      await udel({}, slackReq);
      assert.isTrue(false, 'Should of throw an InvalidArgumentError');
    } catch (e) {
      assert.instanceOf(e, InvalidArgumentError);
      assert.equal(e.message, 'Invalid argument for: `admin:groups:udel`');
      assert.equal(e.detail, 'User not found `invalid-user`');
    }
  });

  it('deletes a single user to a group', async () => {
    const group = await createGroup();
    const user = await createSlackUser();
    await db.UserGroup.create({ groupId: group.id, userId: user.id });
    const slackReq = { module: { params: { values: [group.name, user.slackId] } } };
    await udel({}, slackReq);
    const links = await db.UserGroup.findAll({ where: { userId: user.id } });
    assert.equal(0, links.length);
  });

  it('deletes multiple users to a group', async () => {
    const group = await createGroup({ name: 'test1' });
    const user1 = await createSlackUser({ slackId: 'TESTSLACKUSERID1' });
    const user2 = await createSlackUser({ slackId: 'TESTSLACKUSERID2' });
    await db.UserGroup.create({ groupId: group.id, userId: user1.id });
    await db.UserGroup.create({ groupId: group.id, userId: user2.id });
    const slackReq = { module: { params: { values: [group.name, user1.slackId, user2.slackId] } } };
    await udel({}, slackReq);
    const links = await db.UserGroup.findAll({ where: { groupId: group.id } });
    assert.equal(0, links.length);
  });
});
