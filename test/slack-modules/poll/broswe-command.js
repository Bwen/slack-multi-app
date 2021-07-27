/* eslint-env node, mocha */
const { assert } = require('chai');
// eslint-disable-next-line import/no-extraneous-dependencies
const moment = require('moment');
const { createSlackUser } = require('../../test-utils');
const { createPoll, getBlock } = require('./helper');
const browseCommand = require('../../../src/slack-modules/poll/browse/command');

const db = require(`${process.env.root}/sequelize`);

describe('slack-modules poll:browse command', () => {
  beforeEach(async () => {
    await db.PollChoice.truncate();
    await db.Poll.truncate();
  });

  it('initially browses the most recent poll created by the SlackUser', async () => {
    const slackUser = await createSlackUser();
    const poll1 = await createPoll({ question: 'Poll number 1' });
    const poll1CreatedAt = new Date();
    poll1.createdAt = moment().subtract(5, 'days').toDate();
    await poll1.save();

    const poll2 = await createPoll({ question: 'Poll number 2' });
    poll2.createdAt = moment().toDate();
    await poll2.save();

    const response = await browseCommand(slackUser);
    const postAnonymous = getBlock(/Poll number 2/, response.blocks);
    assert.isNotNull(postAnonymous);
  });
});
