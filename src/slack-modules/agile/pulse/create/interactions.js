const viewCreate = require('./views/create.json');
const choice = require('./views/choice.json');
const weeklyBlocks = require('./views/weekly-interval.json');
const monthlyBlocks = require('./views/monthly-interval.json');
const { findIndexByBlockId } = require('../../../../utils');

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

function removeAll(view) {
  const monthlyIndex = findIndexByBlockId('monthly', view.blocks);
  if (monthlyIndex !== null) {
    view.blocks.splice(monthlyIndex, 1);
  }

  const weeklyIndex = findIndexByBlockId('weekly', view.blocks);
  if (weeklyIndex !== null) {
    view.blocks.splice(weeklyIndex, 1);
  }

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

function addIntervalBlocks(oldView, blocks) {
  const response = removeAll(oldView);
  const { view } = response;

  const intervalIndex = findIndexByBlockId('interval', view.blocks) + 1;
  const splicedBlocks = view.blocks.splice(intervalIndex);
  view.blocks.push(...blocks);
  view.blocks.push(...splicedBlocks);

  const viewUpdate = JSON.parse(JSON.stringify(viewCreate));
  viewUpdate.blocks = view.blocks;
  viewUpdate.private_metadata = view.private_metadata;
  return {
    type: 'web.views.update',
    view_id: response.view_id,
    hash: response.hash,
    view: viewUpdate,
  };
}

module.exports = (slackUser, slackReq) => {
  if (slackReq.module.params.addChoice) {
    return addChoiceToCreate(slackReq.view);
  }

  // if we are changing the interval value in the drop down
  if (slackReq.module.params.interval) {
    switch (slackReq.module.params.interval) {
      case 'weekly':
        return addIntervalBlocks(slackReq.view, weeklyBlocks);
      case 'monthly':
        return addIntervalBlocks(slackReq.view, monthlyBlocks);
      case 'daily':
        return removeAll(slackReq.view);
      default:
        break;
    }
  }

  return {};
};
