const viewCreate = require('./views/create.json');
const choice = require('./views/choice.json');

function addChoiceToCreate(view) {
  const addButton = view.blocks.pop();
  const choiceId = view.blocks.filter((block) => block.block_id.match(/^choice_/)).length + 1;
  choice.block_id = `choice_${choiceId}`;
  choice.element.placeholder.text = `Choice #${choiceId}`;
  view.blocks.push(choice);
  view.blocks.push(addButton);

  const viewUpdate = JSON.parse(JSON.stringify(viewCreate));
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
