/* eslint-env node, mocha */
const mock = require('mock-require');

let profileCalled = false;
mock('../../src/wrapper-slack-api.js', {
  getSlackApi: () => ({
    users: {
      profile: {
        get: async () => new Promise((resolve) => {
          profileCalled = true;
          resolve({
            profile: {
              avatar_hash: 'test',
              status_text: 'test',
              status_emoji: ':test:',
              status_expiration: 0,
              real_name: 'test',
              display_name: 'test',
              email: 'test@email.com',
              team: 'team-test',
              image_original: 'original.png',
              image_24: 'test24.png',
              image_32: 'test32.png',
              image_48: 'test48.png',
              image_72: 'test72.png',
              image_192: 'test192.png',
              image_512: 'test512.png',
            },
          });
        }),
      },
    },
  }),
});

const { assert } = require('chai');
const db = require('../../sequelize');
const currentUser = require('../../src/middlewares/current-user');

let nextCalled = false;
const mockNext = () => { nextCalled = true; };

describe('current-user', () => {
  before(async () => {
    await db.User.truncate();
    await db.UserProfile.truncate();
  });

  // const randomId = Math.floor(Math.random() * 9999999999);
  it('creates user and profile if it does not exists body', async () => {
    const req = { body: { user_id: 'TESTSLACKUSERID1' } };
    await currentUser()(req, {}, mockNext);
    assert.isTrue(nextCalled);
    assert.isTrue(profileCalled);

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
    const req = { body: { payload: '{"user": {"id": "TESTSLACKUSERID2"}}' } };
    await currentUser()(req, {}, mockNext);
    assert.isTrue(nextCalled);
    assert.isTrue(profileCalled);

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
