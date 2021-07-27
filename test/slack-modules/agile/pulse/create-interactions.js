/* eslint-env node, mocha */
const { assert } = require('chai');

const { createSlackUser } = require('../../../test-utils');
const pulseCreateInteractions = require('../../../../src/slack-modules/agile/pulse/create/interactions');
const slackReqPayload = require('../../../payloads/slack-requests/agile-pulse-create-interactions.json');
const weeklyBlocks = require('../../../../src/slack-modules/agile/pulse/create/views/weekly-interval.json');
const monthlyBlocks = require('../../../../src/slack-modules/agile/pulse/create/views/monthly-interval.json');

function countChoices(blocks) {
  let total = 0;
  blocks.forEach((block) => {
    if (block.block_id.match(/^choice_/)) {
      total += 1;
    }
  });

  return total;
}

let slackReq = null;
describe('slack-modules agile:pulse:create interactions', () => {
  beforeEach(() => {
    slackReq = JSON.parse(JSON.stringify(slackReqPayload));
  });

  it('add choice', async () => {
    slackReq.module.params.addChoice = 1;
    const oldChoiceCount = countChoices(slackReq.view.blocks);
    const slackUser = await createSlackUser();
    const response = await pulseCreateInteractions(slackUser, slackReq);
    assert.equal(response.type, 'web.views.update');
    assert.include(response.view_id, slackReq.view.id);
    assert.include(response.hash, slackReq.view.hash);
    assert.equal(countChoices(response.view.blocks), oldChoiceCount + 1);
  });

  it('change interval weekly', async () => {
    slackReq.module.params.interval = 'weekly';
    const slackUser = await createSlackUser();
    const response = await pulseCreateInteractions(slackUser, slackReq);
    assert.equal(response.type, 'web.views.update');
    assert.include(response.view_id, slackReq.view.id);
    assert.include(response.hash, slackReq.view.hash);
    assert.include(response.view.blocks, weeklyBlocks[0]);
  });

  it('change interval monthly', async () => {
    slackReq.module.params.interval = 'monthly';
    const slackUser = await createSlackUser();
    const response = await pulseCreateInteractions(slackUser, slackReq);
    assert.equal(response.type, 'web.views.update');
    assert.include(response.view_id, slackReq.view.id);
    assert.include(response.hash, slackReq.view.hash);
    assert.include(response.view.blocks, monthlyBlocks[0]);
  });

  it('change interval daily', async () => {
    slackReq.module.params.interval = 'daily';
    const slackUser = await createSlackUser();
    const response = await pulseCreateInteractions(slackUser, slackReq);
    assert.equal(response.type, 'web.views.update');
    assert.include(response.view_id, slackReq.view.id);
    assert.include(response.hash, slackReq.view.hash);
    assert.notInclude(response.view.blocks, weeklyBlocks[0]);
    assert.notInclude(response.view.blocks, monthlyBlocks[0]);
  });
});
