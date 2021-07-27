const db = require(`${process.env.root}/sequelize`);
const { findIndexByBlockId } = require(`${process.env.root}/src/utils`);
const { fetchPulses, getSearchQueryFromParams, generatePrivateMessageBlocks } = require('../helper');
const viewModifyMembers = require('./views/modify-members.json');

const responsePostUrl = require(`${process.env.root}/src/slack-responses/response.url.json`);
const responsePrivateMessage = require(`${process.env.root}/src/slack-responses/web.conversations.open.json`);
const responseViewOpen = require(`${process.env.root}/src/slack-responses/web.views.open.json`);

module.exports = async (slackUser, slackReq) => {
  if (slackReq.module.params.modifyMembers) {
    const view = JSON.parse(JSON.stringify(viewModifyMembers));

    // Set the current members
    const pulse = await db.Pulse.findByPk(slackReq.module.params.pulseId);
    const indexMembers = findIndexByBlockId('members', view.blocks);
    view.blocks[indexMembers].element.initial_users = pulse.userSlackIds.split(',');

    const response = JSON.parse(JSON.stringify(responseViewOpen));
    response.view = view;
    response.view.private_metadata += `&pulseId=${slackReq.module.params.pulseId}`;
    return response;
  }

  if (slackReq.module.params.sample) {
    const response = JSON.parse(JSON.stringify(responsePrivateMessage));
    response.channel = slackUser.slackId;
    response.blocks = await generatePrivateMessageBlocks(slackReq.module.params.pulseId);
    return response;
  }

  if (slackReq.module.params.status) {
    const pulse = await db.Pulse.findByPk(slackReq.module.params.pulseId);
    if (!pulse) {
      return {};
    }

    pulse.status = slackReq.module.params.status;
    await pulse.save();
  }

  // Also used to refresh current page after interaction
  if (slackReq.module.params.page || slackReq.module.params.page === 0) {
    const query = getSearchQueryFromParams(slackReq.module.params);
    const blocks = await fetchPulses(slackUser, 1, slackReq.module.params.page, slackReq.module.path, query);
    const responseUrl = JSON.parse(JSON.stringify(responsePostUrl));
    responseUrl.json.replace_original = true;
    responseUrl.json.blocks = blocks;
    return responseUrl;
  }

  return {};
};
