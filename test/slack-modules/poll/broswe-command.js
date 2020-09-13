/* eslint-env node, mocha */
const { assert } = require('chai');
const { createSlackUser } = require('../../utils');
const { createPoll, getBlock } = require('./helper');
const browseCommand = require('../../../src/slack-modules/poll/browse/command');
const db = require('../../../sequelize');

describe('slack-modules poll:browse command', () => {
  beforeEach(async () => {
    await db.PollChoice.truncate();
    await db.Poll.truncate();
  });

  it('initially browses the most recent poll created by the SlackUser', async () => {
    const slackUser = await createSlackUser();
    const poll1 = await createPoll({ question: 'Poll number 1' });
    const poll1CreatedAt = new Date();
    poll1.createdAt = poll1CreatedAt.setDate(poll1CreatedAt.getDate() - 5);
    poll1.save();

    const poll2 = await createPoll({ question: 'Poll number 2' });
    const poll2CreatedAt = new Date();
    poll2.createdAt = poll2CreatedAt.setDate(poll2CreatedAt.getDate() - 1);
    poll2.save();

    const response = await browseCommand(slackUser);
    const postAnonymous = getBlock(/Poll number 2/, response.blocks);
    assert.isNotNull(postAnonymous);
  });
});
