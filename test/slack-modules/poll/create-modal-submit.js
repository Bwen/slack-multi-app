/* eslint-env node, mocha */
const { assert } = require('chai');
const { createSlackUser } = require('../../test-utils');

const db = require(`${process.env.root}/sequelize`);
const pollSubmit = require('../../../src/slack-modules/poll/create/modal-submit');
const slackReq = require('../../payloads/slack-requests/poll-create-modal-submit.json');

describe('slack-modules poll:create submit (modal)', () => {
  beforeEach(async () => {
    await db.PollChoice.truncate();
    await db.Poll.truncate();
  });

  it('add choices according to the choices in the payload', async () => {
    const slackUser = await createSlackUser();
    const response = await pollSubmit(slackUser, slackReq);
    assert.equal(response.type, 'web.chat.postMessage');
    assert.equal(response.icon_emoji, ':bar_chart:');

    const block = response.blocks.find((b) => {
      if (b.accessory && b.accessory.value && b.accessory.value.match(/^poll:info /)) {
        return true;
      }
      return false;
    });

    const pollId = block.accessory.value.split('=')[1];
    const poll = await db.Poll.findByPk(pollId, {
      include: [{ model: db.PollChoice, attributes: ['id', 'text'] }],
    });

    assert.equal(poll.question, 'This is a test question');
    assert.equal(poll.PollChoices[0].text, 'Test choice 1');
    assert.equal(poll.PollChoices[1].text, 'Test choice 2');
    assert.equal(poll.PollChoices[2].text, 'Test choice 3');
    assert.equal(poll.endDate, null);
    assert.equal(poll.postAnonymous, 'yes');
    assert.equal(poll.anonymousVotes, 'yes');
    assert.equal(poll.voteChange, 'yes');
    assert.equal(poll.votePerUser, 2);
    assert.equal(poll.suggestion, 'no');
  });

  it('users defaults if no poll options checked', async () => {
    const slackUser = await createSlackUser();
    const req = JSON.parse(JSON.stringify(slackReq));
    delete req.module.params.options;

    const response = await pollSubmit(slackUser, req);
    assert.equal(response.type, 'web.chat.postMessage');
    assert.equal(response.icon_emoji, ':bar_chart:');

    const block = response.blocks.find((b) => {
      if (b.accessory && b.accessory.value && b.accessory.value.match(/^poll:info /)) {
        return true;
      }
      return false;
    });

    const pollId = block.accessory.value.split('=')[1];
    const poll = await db.Poll.findByPk(pollId, {
      include: [{ model: db.PollChoice, attributes: ['id', 'text'] }],
    });

    assert.equal(poll.question, 'This is a test question');
    assert.equal(poll.PollChoices[0].text, 'Test choice 1');
    assert.equal(poll.PollChoices[1].text, 'Test choice 2');
    assert.equal(poll.PollChoices[2].text, 'Test choice 3');
    assert.equal(poll.endDate, null);
    assert.equal(poll.postAnonymous, 'no');
    assert.equal(poll.anonymousVotes, 'no');
    assert.equal(poll.voteChange, 'no');
    assert.equal(poll.votePerUser, 2);
    assert.equal(poll.suggestion, 'no');
  });
});
