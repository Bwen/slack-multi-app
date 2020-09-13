const viewUpdate = require('./views/update.json');
const choice = require('./views/choice.json');

function countChoices(blocks) {
  let total = 0;
  blocks.forEach((block) => {
    if (block.block_id.match(/^choice_/)) {
      total += 1;
    }
  });

  return total;
}

function addChoiceToCreate(view) {
  const addButton = view.blocks.pop();
  const choiceId = countChoices(view.blocks) + 1;
  choice.block_id = `choice_${choiceId}`;
  choice.element.placeholder.text = `Choice #${choiceId}`;
  view.blocks.push(choice);
  view.blocks.push(addButton);
  viewUpdate.blocks = view.blocks;
  viewUpdate.private_metadata = view.private_metadata;
  return {
    type: 'web.views.update',
    view_id: view.id,
    hash: view.hash,
    view: viewUpdate,
  };
}

module.exports = (slackUser, slackReq) => {
  if (slackReq.module.params.addChoice) {
    return addChoiceToCreate(slackReq.view);
  }

  return {};
};
