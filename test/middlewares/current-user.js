/* eslint-env node, mocha */
// Already mock-required in _beforeAll.test.js
const mockSlackApi = require('../mocks/wrapper-slack-api');

const mock = require('mock-require');

mock('../../src/wrapper-slack-api.js', mockSlackApi);

const { assert } = require('chai');

const db = require(`${process.env.root}/sequelize`);
const currentUser = require('../../src/middlewares/current-user');

let nextCalled = false;
const mockNext = () => { nextCalled = true; };

describe('current-user', () => {
  before(async () => {
    await db.User.truncate();
    await db.UserProfile.truncate();
  });

  it('creates user and profile if it does not exists body', async () => {
    const req = { body: { user_id: 'TESTSLACKUSERID1' }, query: {} };
    await currentUser()(req, {}, mockNext);
    assert.isTrue(nextCalled);
    assert.isTrue(mockSlackApi.isProfileCalled());

    assert.equal(req.currentUser.UserProfile.avatarHash, 'test');
    assert.equal(req.currentUser.UserProfile.statusText, 'test');
    assert.equal(req.currentUser.UserProfile.statusEmoji, ':test:');
    assert.equal(req.currentUser.UserProfile.statusExpiration, 0);
    assert.equal(req.currentUser.UserProfile.realName, 'test');
    assert.equal(req.currentUser.UserProfile.displayName, 'test');
    assert.equal(req.currentUser.UserProfile.email, 'test@email.com');
    assert.equal(req.currentUser.UserProfile.team, 'team-test');
    assert.equal(req.currentUser.UserProfile.imageOriginal, 'original.png');
    assert.equal(req.currentUser.UserProfile.image24, 'test24.png');
    assert.equal(req.currentUser.UserProfile.image32, 'test32.png');
    assert.equal(req.currentUser.UserProfile.image48, 'test48.png');
    assert.equal(req.currentUser.UserProfile.image72, 'test72.png');
    assert.equal(req.currentUser.UserProfile.image192, 'test192.png');
    assert.equal(req.currentUser.UserProfile.image512, 'test512.png');
  });

  it('creates user and profile if it does not exists payload', async () => {
    const req = { body: { payload: '{"user": {"id": "TESTSLACKUSERID2"}}' }, query: {} };
    await currentUser()(req, {}, mockNext);
    assert.isTrue(nextCalled);
    assert.isTrue(mockSlackApi.isProfileCalled());

    assert.equal(req.currentUser.UserProfile.avatarHash, 'test');
    assert.equal(req.currentUser.UserProfile.statusText, 'test');
    assert.equal(req.currentUser.UserProfile.statusEmoji, ':test:');
    assert.equal(req.currentUser.UserProfile.statusExpiration, 0);
    assert.equal(req.currentUser.UserProfile.realName, 'test');
    assert.equal(req.currentUser.UserProfile.displayName, 'test');
    assert.equal(req.currentUser.UserProfile.email, 'test@email.com');
    assert.equal(req.currentUser.UserProfile.team, 'team-test');
    assert.equal(req.currentUser.UserProfile.imageOriginal, 'original.png');
    assert.equal(req.currentUser.UserProfile.image24, 'test24.png');
    assert.equal(req.currentUser.UserProfile.image32, 'test32.png');
    assert.equal(req.currentUser.UserProfile.image48, 'test48.png');
    assert.equal(req.currentUser.UserProfile.image72, 'test72.png');
    assert.equal(req.currentUser.UserProfile.image192, 'test192.png');
    assert.equal(req.currentUser.UserProfile.image512, 'test512.png');
    mock.stopAll();
  });
});
