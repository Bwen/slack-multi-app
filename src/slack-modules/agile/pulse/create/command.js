const responseViewOpen = require('../../../../slack-responses/web.views.open.json');
const viewCreate = require('./views/create.json');

module.exports = async (slackUser, slackReq) => {
  const createModal = JSON.parse(JSON.stringify(viewCreate));
  createModal.private_metadata += ` channel=${slackReq.channelId}`;
  responseViewOpen.view = createModal;

  return responseViewOpen;
};
