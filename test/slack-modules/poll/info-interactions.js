/* eslint-env node, mocha */
const { assert } = require('chai');
const { createSlackUser } = require('../../test-utils');
const { createPoll, getBlock } = require('./helper');
const info = require('../../../src/slack-modules/poll/info/interactions');

const db = require(`${process.env.root}/sequelize`);

describe('slack-modules poll:info interactions (modal)', () => {
  beforeEach(async () => {
    await db.PollChoice.truncate();
    await db.Poll.truncate();
  });

  it('displays proper details of end date, anonymous & infinite voting', async () => {
    const votingEnd = new Date();
    const poll = await createPoll({
      endDate: votingEnd,
      postAnonymous: 'yes',
      anonymousVotes: 'yes',
      voteChange: 'no',
      suggestion: 'no',
      votePerUser: 0,
    });
    const slackUser = await createSlackUser();
    const response = await info(slackUser, {
      module: {
        path: ['poll', 'info'],
        params: { pollId: poll.id },
      },
    });

    assert.equal(response.type, 'web.views.open');
    assert.equal(response.view.type, 'modal');

    const endDate = getBlock(/Voting ends/, response.view.blocks).text.split('\t')[1];
    assert.equal(endDate, `${votingEnd.getFullYear()}-${votingEnd.getMonth() + 1}-${votingEnd.getDate()}`);

    const postAnonymous = getBlock(/Posted anonymously/, response.view.blocks).text.split('\t')[1];
    assert.equal(postAnonymous, ':heavy_check_mark:');

    const anonymousVotes = getBlock(/Anonymous votes/, response.view.blocks).text.split('\t')[1];
    assert.equal(anonymousVotes, ':heavy_check_mark:');

    const voteChange = getBlock(/Allow vote change/, response.view.blocks).text.split('\t')[1];
    assert.equal(voteChange, ':x:');

    const suggestion = getBlock(/Allow vote change/, response.view.blocks).text.split('\t')[1];
    assert.equal(suggestion, ':x:');

    const votePerUser = getBlock(/Votes per user/, response.view.blocks).text.split('\t')[1];
    assert.equal(votePerUser, ':loop:');
  });

  it('displays proper details of vote change, vote per user & suggestions', async () => {
    const poll = await createPoll({
      endDate: null,
      postAnonymous: 'no',
      anonymousVotes: 'no',
      voteChange: 'yes',
      suggestion: 'yes',
      votePerUser: 5,
    });
    const slackUser = await createSlackUser();
    const response = await info(slackUser, {
      module: {
        path: ['poll', 'info'],
        params: { pollId: poll.id },
      },
    });

    assert.equal(response.type, 'web.views.open');
    assert.equal(response.view.type, 'modal');

    const endDate = getBlock(/Voting ends/, response.view.blocks).text.split('\t')[1];
    assert.equal(endDate, 'Never');

    const postAnonymous = getBlock(/Posted anonymously/, response.view.blocks).text.split('\t')[1];
    assert.equal(postAnonymous, ':x:');

    const anonymousVotes = getBlock(/Anonymous votes/, response.view.blocks).text.split('\t')[1];
    assert.equal(anonymousVotes, ':x:');

    const voteChange = getBlock(/Allow vote change/, response.view.blocks).text.split('\t')[1];
    assert.equal(voteChange, ':heavy_check_mark:');

    const suggestion = getBlock(/Allow vote change/, response.view.blocks).text.split('\t')[1];
    assert.equal(suggestion, ':heavy_check_mark:');

    const votePerUser = getBlock(/Votes per user/, response.view.blocks).text.split('\t')[1];
    assert.equal(votePerUser, ':five:');
  });
});
