// const { fetchPoll } = require('../helper');
const responseViewOpen = require('../../../slack-responses/web.views.open.json');
const addChoices = require('./views/add-choices.json');
const choice = require('../create/views/choice.json');

function countChoices(blocks) {
  let total = 0;
  blocks.forEach((block) => {
    if (block.block_id.match(/^choice_/)) {
      total += 1;
    }
  });

  return total;
}

function generateNewChoice(blocks, pollId) {
  const addButton = blocks.pop();
  const choiceId = countChoices(blocks) + 1;
  const newChoice = JSON.parse(JSON.stringify(choice));
  newChoice.block_id = `choice_${choiceId}`;
  newChoice.element.placeholder.text = `Choice #${choiceId}`;
  blocks.push(newChoice);
  addButton.elements[0].value = `poll:choices add_more=1&pollId=${pollId}`;
  blocks.push(addButton);

  return blocks;
}

module.exports = async (slackUser, slackReq) => {
  const { pollId } = slackReq.module.params;
  const newChoices = JSON.parse(JSON.stringify(addChoices));
  newChoices.private_metadata = `poll:choices pollId=${pollId}&responseUrl=${slackReq.responseUrl}`;

  if (slackReq.module.params.add) {
    newChoices.blocks = generateNewChoice(newChoices.blocks, pollId);
    responseViewOpen.view = newChoices;
    return responseViewOpen;
  }

  if (slackReq.module.params.add_more) {
    newChoices.private_metadata = slackReq.view.private_metadata;
    newChoices.blocks = generateNewChoice(slackReq.view.blocks, pollId);
    return {
      type: 'web.views.update',
      view_id: slackReq.view.id,
      hash: slackReq.view.hash,
      view: newChoices,
    };
  }

  return {};
};
