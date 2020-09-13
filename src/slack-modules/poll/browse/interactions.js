const { fetchPoll } = require('../helper');
const responsePostUrl = require('../../../slack-responses/response.url.json');
const responsePostMessage = require('../../../slack-responses/web.chat.postMessage.json');

module.exports = async (slackUser, slackReq) => {
  if (slackReq.module.params.repost) {
    const blocks = await fetchPoll(slackUser, 1, slackReq.module.params.page, 'poll:browse', false);
    responsePostMessage.icon_emoji = ':bar_chart:';
    responsePostMessage.blocks = blocks;

    responsePostUrl.json.delete_original = true;
    delete responsePostUrl.json.replace_original;
    delete responsePostUrl.json.blocks;
    return [responsePostUrl, responsePostMessage];
  }

  if (slackReq.module.params.page || slackReq.module.params.page === 0) {
    const blocks = await fetchPoll(slackUser, 1, slackReq.module.params.page, 'poll:browse');
    responsePostUrl.json.replace_original = true;
    responsePostUrl.json.blocks = blocks;
    return responsePostUrl;
  }

  return {};
};
