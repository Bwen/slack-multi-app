/* eslint-env node, mocha */
const { assert } = require('chai');
const { createSlackUser } = require('../../utils');
const { createPoll } = require('./helper');
const db = require('../../../sequelize');
const addChoiceSubmit = require('../../../src/slack-modules/poll/choices/modal-submit');
const slackReq = require('../../payloads/slack-requests/poll-add-choices-model-submit.json');

function countChoices(blocks) {
  let total = 0;
  blocks.forEach((block) => {
    if (block.accessory && block.accessory.action_id && block.accessory.action_id.match(/^vote_/)) {
      total += 1;
    }
  });

  return total;
}

describe('slack-modules poll:choices add submit (modal)', () => {
  beforeEach(async () => {
    await db.PollChoice.truncate();
    await db.Poll.truncate();
  });

  it('add choices according to the choices in the payload', async () => {
    const slackUser = await createSlackUser();
    const poll = await createPoll({ question: 'Poll number 1' });
    const pollCreatedAt = new Date();
    poll.createdAt = pollCreatedAt.setDate(pollCreatedAt.getDate() - 5);
    poll.save();

    slackReq.module.params.pollId = poll.id;
    const response = await addChoiceSubmit(slackUser, slackReq);
    assert.equal(response.type, 'response.url');
    assert.equal(response.responseType, 'json');
    assert.equal(response.json.replace_original, true);
    assert.equal(countChoices(response.json.blocks), 6);
  });
});
