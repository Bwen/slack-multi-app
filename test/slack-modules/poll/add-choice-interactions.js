/* eslint-env node, mocha */
const { assert } = require('chai');
const addChoices = require('../../../src/slack-modules/poll/choices/interactions');
const payloadAddChoice = require('../../payloads/slack-requests/poll-add-choices-interaction.json');
const payloadAddMoreChoice = require('../../payloads/slack-requests/poll-add-choices-more-interaction.json');

function countChoices(blocks) {
  let total = 0;
  blocks.forEach((block) => {
    if (block.block_id.match(/^choice_/)) {
      total += 1;
    }
  });

  return total;
}

describe('slack-modules poll:choices interactions (modal)', () => {
  it('add choices to an existing poll message modal', async () => {
    const response = await addChoices({}, payloadAddChoice);
    assert.equal(response.type, 'web.views.open');
    assert.match(response.view.private_metadata, /responseUrl=/);
    assert.match(response.view.private_metadata, /pollId=/);
  });

  it('add more choices modal', async () => {
    const beforeChoiceCount = countChoices(payloadAddMoreChoice.view.blocks);
    const response = await addChoices({}, payloadAddMoreChoice);
    assert.equal(response.type, 'web.views.update');
    assert.equal(response.view_id, 'V01HVMLSMMG');
    assert.equal(response.hash, '1609537358.kClh5MjK');
    assert.match(response.view.private_metadata, /responseUrl=/);
    assert.match(response.view.private_metadata, /pollId=/);

    const afterChoiceCount = countChoices(response.view.blocks);
    assert.notEqual(beforeChoiceCount, afterChoiceCount);
    assert.equal(beforeChoiceCount + 1, afterChoiceCount);
  });
});
