/* eslint-env node, mocha */
const { assert } = require('chai');
const { createSlackUser } = require('../../../test-utils');
const { createGroup } = require('../helper');

const db = require(`${process.env.root}/sequelize`);
const { MissingArgumentError, InvalidArgumentError } = require(`${process.env.root}/src/errors/validation`);
const uadd = require(`${process.env.root}/src/slack-modules/admin/groups/uadd/command`);

describe('slack-modules admin:groups:uadd', () => {
  beforeEach(async () => {
    await db.UserGroup.truncate();
    await db.Group.truncate();
    await db.User.truncate();
  });

  it('throws a validation error if no params', async () => {
    const slackReq = { module: { params: {} } };
    try {
      await uadd({}, slackReq);
      assert.isTrue(false, 'Should of throw an MissingArgumentError');
    } catch (e) {
      assert.instanceOf(e, MissingArgumentError);
      assert.equal(e.message, 'Missing arguments for: `admin:groups:uadd`');
    }
  });

  it('throws a validation error if group not found', async () => {
    const slackReq = { module: { params: { values: ['invalid-group', 'invalid-user'] } } };
    try {
      await uadd({}, slackReq);
      assert.isTrue(false, 'Should of throw an InvalidArgumentError');
    } catch (e) {
      assert.instanceOf(e, InvalidArgumentError);
      assert.equal(e.message, 'Invalid argument for: `admin:groups:uadd`');
      assert.equal(e.detail, 'Group not found `invalid-group`');
    }
  });

  it('throws a validation error if user not found', async () => {
    const group = await createGroup();
    const slackReq = { module: { params: { values: [group.name, 'invalid-user'] } } };
    try {
      await uadd({}, slackReq);
      assert.isTrue(false, 'Should of throw an InvalidArgumentError');
    } catch (e) {
      assert.instanceOf(e, InvalidArgumentError);
      assert.equal(e.message, 'Invalid argument for: `admin:groups:uadd`');
      assert.equal(e.detail, 'User not found `invalid-user`');
    }
  });

  it('adds a single user to a group', async () => {
    const group = await createGroup();
    const user = await createSlackUser();
    const slackReq = { module: { params: { values: [group.name, user.slackId] } } };
    await uadd({}, slackReq);
    const links = await db.UserGroup.findAll({ where: { userId: user.id } });
    assert.equal(1, links.length);
    assert.equal(group.id, links[0].groupId);
  });

  it('adds multiple users to a group', async () => {
    const group = await createGroup({ name: 'test1' });
    const user1 = await createSlackUser({ slackId: 'TESTSLACKUSERID1' });
    const user2 = await createSlackUser({ slackId: 'TESTSLACKUSERID2' });
    const slackReq = { module: { params: { values: [group.name, user1.slackId, user2.slackId] } } };
    await uadd({}, slackReq);
    const links = await db.UserGroup.findAll({ where: { groupId: group.id } });
    assert.equal(2, links.length);
    assert.equal(user1.id, links[0].userId);
    assert.equal(user2.id, links[1].userId);
  });
});
