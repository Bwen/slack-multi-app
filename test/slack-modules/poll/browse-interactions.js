/* eslint-env node, mocha */
const { assert } = require('chai');
const { createSlackUser } = require('../../test-utils');
const { createPoll, getBlock } = require('./helper');
const browseInteraction = require('../../../src/slack-modules/poll/browse/interactions');

const db = require(`${process.env.root}/sequelize`);

describe('slack-modules poll:browse interactions', () => {
  beforeEach(async () => {
    await db.PollChoice.truncate();
    await db.Poll.truncate();
  });

  it('browses slackUser polls in reverse chronological order', async () => {
    const slackUser = await createSlackUser();
    const poll1 = await createPoll({ question: 'Poll number 1' });
    const poll1CreatedAt = new Date();
    poll1.createdAt = poll1CreatedAt.setDate(poll1CreatedAt.getDate() - 5);
    poll1.save();

    const poll2 = await createPoll({ question: 'Poll number 2' });
    const poll2CreatedAt = new Date();
    poll2.createdAt = poll2CreatedAt.setDate(poll2CreatedAt.getDate() - 1);
    poll2.save();

    const response1 = await browseInteraction(slackUser, { module: { path: ['poll', 'browse'], params: { page: 0 } } });
    const postAnonymous1 = getBlock(/Poll number 2/, response1.json.blocks);
    assert.isNotNull(postAnonymous1);

    const response2 = await browseInteraction(slackUser, { module: { path: ['poll', 'browse'], params: { page: 1 } } });
    const postAnonymous2 = getBlock(/Poll number 1/, response2.json.blocks);
    assert.isNotNull(postAnonymous2);
  });

  it('slackUser re-posts an existing poll to the current channel', async () => {
    const slackUser = await createSlackUser();
    const poll = await createPoll({ question: 'Poll number 2' });
    const pollCreatedAt = new Date();
    poll.createdAt = pollCreatedAt.setDate(pollCreatedAt.getDate() - 1);
    poll.save();

    const responses = await browseInteraction(slackUser, { module: { path: ['poll', 'browse'], params: { page: 0, repost: 1 } } });
    const postAnonymous = getBlock(/Poll number 2/, responses[1].blocks);
    assert.isNotNull(postAnonymous);
  });
});
