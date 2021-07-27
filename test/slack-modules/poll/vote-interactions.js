/* eslint-env node, mocha */
const { assert } = require('chai');
const { createSlackUser } = require('../../test-utils');
const { createPoll } = require('./helper');
const slackReq = require('../../payloads/slack-requests/poll-vote-interaction.json');
const vote = require('../../../src/slack-modules/poll/vote/interactions');

const db = require(`${process.env.root}/sequelize`);

describe('slack-modules poll:vote interactions', () => {
  beforeEach(async () => {
    await db.PollVote.truncate();
    await db.PollChoice.truncate();
    await db.Poll.truncate();
  });

  it('SlackUser cannot change vote or exceed maximum 2 votes', async () => {
    const poll = await createPoll({ voteChange: 'no', votePerUser: 2 });
    const choiceIds = poll.PollChoices.map((choice) => choice.id);
    const slackUser = await createSlackUser();
    slackReq.module.params.pollId = poll.id;
    // eslint-disable-next-line prefer-destructuring
    slackReq.module.params.choiceId = choiceIds[0];
    await vote(slackUser, slackReq);
    await vote(slackUser, slackReq);
    await vote(slackUser, slackReq);
    // eslint-disable-next-line prefer-destructuring
    slackReq.module.params.choiceId = choiceIds[1];
    await vote(slackUser, slackReq);
    const votes = await db.PollVote.findAll({ where: { createdBy: slackUser.id } });
    assert.equal(votes.length, 2);
  });

  it('SlackUser can change vote and cant exceed maximum 1 vote', async () => {
    const poll = await createPoll({ voteChange: 'yes', votePerUser: 1 });
    const choiceIds = poll.PollChoices.map((choice) => choice.id);
    const slackUser = await createSlackUser();
    slackReq.module.params.pollId = poll.id;
    let votes = [];

    // eslint-disable-next-line prefer-destructuring
    slackReq.module.params.choiceId = choiceIds[0];
    await vote(slackUser, slackReq);

    // Remove vote choice
    // eslint-disable-next-line prefer-destructuring
    slackReq.module.params.choiceId = choiceIds[0].toString();
    await vote(slackUser, slackReq);
    votes = await db.PollVote.findAll({ where: { createdBy: slackUser.id } });
    assert.equal(votes.length, 0);

    // Change vote to another choice
    // eslint-disable-next-line prefer-destructuring
    slackReq.module.params.choiceId = choiceIds[1];
    await vote(slackUser, slackReq);
    votes = await db.PollVote.findAll({ where: { createdBy: slackUser.id } });
    assert.equal(votes.length, 1);
    assert.equal(votes[0].choiceId, choiceIds[1]);
  });

  it('SlackUser cannot vote past end date', async () => {
    const endDate = new Date();
    const poll = await createPoll({ voteChange: 'no', votePerUser: 1, endDate });
    poll.endDate = endDate.setDate(endDate.getDate() - 1);
    await poll.save();
    const choiceIds = poll.PollChoices.map((choice) => choice.id);
    const slackUser = await createSlackUser();
    slackReq.module.params.pollId = poll.id;
    // eslint-disable-next-line prefer-destructuring
    slackReq.module.params.choiceId = choiceIds[0];
    await vote(slackUser, slackReq);
    const votes = await db.PollVote.findAll({ where: { createdBy: slackUser.id } });
    assert.equal(votes.length, 0);
  });
});
