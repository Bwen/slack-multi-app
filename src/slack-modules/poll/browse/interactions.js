const { fetchPoll } = require('../helper');
const responsePostUrl = require('../../../slack-responses/response.url.json');
const responsePostMessage = require('../../../slack-responses/web.chat.postMessage.json');

module.exports = async (slackUser, slackReq) => {
  if (slackReq.module.params.repost) {
    const blocks = await fetchPoll(slackUser, 1, slackReq.module.params.page, 'poll:browse', false);
    const responsePost = JSON.parse(JSON.stringify(responsePostMessage));
    responsePost.icon_emoji = ':bar_chart:';
    responsePost.blocks = blocks;

    const responseUrl = JSON.parse(JSON.stringify(responsePostUrl));
    responseUrl.json.delete_original = true;
    delete responseUrl.json.replace_original;
    delete responseUrl.json.blocks;
    return [responseUrl, responsePost];
  }

  if (slackReq.module.params.page || slackReq.module.params.page === 0) {
    const blocks = await fetchPoll(slackUser, 1, slackReq.module.params.page, 'poll:browse');
    const responseUrl = JSON.parse(JSON.stringify(responsePostUrl));
    responseUrl.json.replace_original = true;
    responseUrl.json.blocks = blocks;
    return responseUrl;
  }

  return {};
};
