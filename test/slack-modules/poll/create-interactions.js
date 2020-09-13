/* eslint-env node, mocha */
const { assert } = require('chai');
const pollCreate = require('../../../src/slack-modules/poll/create/interactions');
const payloadCreateAddChoice = require('../../payloads/slack-requests/poll-create-interaction-add-choice.json');

function countChoices(blocks) {
  let total = 0;
  blocks.forEach((block) => {
    if (block.block_id.match(/^choice_/)) {
      total += 1;
    }
  });

  return total;
}

describe('slack-modules poll:create interactions (modal)', () => {
  it('add choices according to the choices in the payload', async () => {
    const beforeChoiceCount = countChoices(payloadCreateAddChoice.view.blocks);
    const response = await pollCreate({}, payloadCreateAddChoice);
    assert.equal(response.type, 'web.views.update');
    assert.equal(response.view_id, 'V01AFVDUWRW');
    assert.equal(response.hash, '1598825277.dJNEfO4R');
    assert.match(response.view.private_metadata, /C018ETVMD0T/);

    const afterChoiceCount = countChoices(response.view.blocks);
    assert.notEqual(beforeChoiceCount, afterChoiceCount);
    assert.equal(beforeChoiceCount + 1, afterChoiceCount);
  });
});
