/* eslint-env node, mocha */
const { assert } = require('chai');
const { createSlackUser } = require('../test-utils');
const slackUserActivity = require('../../src/middlewares/slack-user-activity')();

const db = require(`${process.env.root}/sequelize`);

let nextCalled = false;
const mockNext = () => {
  nextCalled = true;
};

describe('middleware slack-user-activity', () => {
  beforeEach(async () => {
    await db.UserActivity.truncate();
  });

  it('user requests are saved', async () => {
    const user = await createSlackUser();
    const req = {
      currentUser: user,
      slack: {
        channelId: '321',
        triggerId: '456',
        responseUrl: 'https://test.com/test/test',
        isCommand: true,
        isInteraction: true,
        isModalSubmission: true,
        module: {
          path: ['admin', 'users', 'list'],
          params: {
            test1: 'value1',
            test2: 'value2',
            values: ['arg1', 'arg2'],
          },
        },
      },
    };

    await slackUserActivity(req, {}, mockNext);
    assert.isTrue(nextCalled, 'Next should have been called');

    const activities = await db.UserActivity.findAll({ where: { createdBy: user.id } });
    assert.equal(activities.length, 1);
    assert.equal(activities[0].createdBy, user.id);
    assert.equal(activities[0].channelId, '321');
    assert.equal(activities[0].triggerId, '456');
    assert.equal(activities[0].responseUrl, 'https://test.com/test/test');
    assert.equal(activities[0].isCommand, 'yes');
    assert.equal(activities[0].isInteraction, 'yes');
    assert.equal(activities[0].isModalSubmission, 'yes');
    assert.equal(activities[0].response, null);
    assert.equal(activities[0].path, req.slack.module.path.join(':'));
    assert.equal(activities[0].params, 'test1=value1&test2=value2&values=arg1%2Carg2');

    // Current Activity should be set at the req level
    assert.equal(req.currentActivity.createdBy, user.id);
    assert.equal(req.currentActivity.channelId, '321');
    assert.equal(req.currentActivity.triggerId, '456');
    assert.equal(req.currentActivity.responseUrl, 'https://test.com/test/test');
    assert.equal(req.currentActivity.isCommand, 'yes');
    assert.equal(req.currentActivity.isInteraction, 'yes');
    assert.equal(req.currentActivity.isModalSubmission, 'yes');
    assert.equal(req.currentActivity.response, null);
    assert.equal(req.currentActivity.path, req.slack.module.path.join(':'));
    assert.equal(req.currentActivity.params, 'test1=value1&test2=value2&values=arg1%2Carg2');

    // Last activity should be null (we only called it once)
    assert.equal(req.lastActivity, null);
  });
});
