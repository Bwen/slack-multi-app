/* eslint-env node, mocha */
const { assert } = require('chai');
const { createSlackUser } = require('../test-utils');
const slackGroupAcl = require('../../src/middlewares/slack-group-acl')();

const db = require(`${process.env.root}/sequelize`);

let nextCalled = false;
const mockNext = () => { nextCalled = true; };

let sendCalled = false;
const mockSend = () => { sendCalled = true; };

describe('middleware slack-group-acl', () => {
  beforeEach(async () => {
    await db.UserGroup.truncate();
    await db.GroupAcl.truncate();
    await db.Group.truncate();
  });

  it('user without access gets access denied', async () => {
    const user = await createSlackUser();
    const group = await db.Group.create({ name: 'test', description: 'Test Group Description' });
    await db.GroupAcl.create({ groupId: group.id, path: 'admin:*' });
    const res = { send: mockSend };
    const req = {
      currentUser: user,
      slack: {
        isCommand: true,
        module: { path: ['admin', 'users', 'list'] },
      },
    };

    nextCalled = false;
    sendCalled = false;
    const result = await slackGroupAcl(req, res, mockNext);
    assert.isFalse(result, 'The return of slack-group-acl should be false');
    assert.isFalse(nextCalled, 'Next should NOT have been called');
    assert.isTrue(sendCalled, 'res.send should have been called');
  });

  it('user with access', async () => {
    const user = await createSlackUser();
    const group = await db.Group.create({ name: 'test', description: 'Test Group Description' });
    user.Groups = [group];
    await db.GroupAcl.create({ groupId: group.id, path: 'admin:*' });
    await db.UserGroup.create({ userId: user.id, groupId: group.id });
    const res = { send: mockSend };
    const req = {
      currentUser: user,
      slack: {
        clearCache: true,
        isCommand: true,
        module: { path: ['admin', 'users', 'list'] },
      },
    };

    nextCalled = false;
    sendCalled = false;
    const result = await slackGroupAcl(req, res, mockNext);
    assert.isTrue(result, 'The return of slack-group-acl should be true');
    assert.isTrue(nextCalled, 'Next should have been called');
    assert.isFalse(sendCalled, 'res.send should NOT have been called');
  });
});
