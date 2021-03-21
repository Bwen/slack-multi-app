const responseViewOpen = require('../../../slack-responses/web.views.open.json');
const responsePostMessage = require('../../../slack-responses/web.chat.postMessage.json');
const viewCreate = require('./views/create.json');
const db = require('../../../../sequelize');
const { generatePollBlocks } = require('../helper');

async function quickCreate(slackUser, params) {
  let suggestion = 'yes';
  if (params.length >= 3) {
    suggestion = 'no';
  }

  const question = params.shift();
  const poll = await db.Poll.create({
    question,
    createdBy: slackUser.id,
    endDate: null,
    postAnonymous: 'no',
    anonymousVotes: 'yes',
    voteChange: 'no',
    suggestion,
    votePerUser: 1,
  });

  if (params.length) {
    // eslint-disable-next-line no-plusplus
    const promises = params.map(async (choice) => {
      const pollChoice = db.PollChoice.build({
        pollId: poll.id,
        text: choice,
      });
      await pollChoice.save();
    });

    await Promise.all(promises);
  }

  return poll.id;
}

module.exports = async (slackUser, slackReq) => {
  // If we have params without a key it is the quick create poll command
  if (slackReq.module.params.values && slackReq.module.params.values.length) {
    const pollId = await quickCreate(slackUser, slackReq.module.params.values);

    responsePostMessage.icon_emoji = ':bar_chart:';
    responsePostMessage.blocks = await generatePollBlocks(pollId);
    return responsePostMessage;
  }

  const createModal = JSON.parse(JSON.stringify(viewCreate));
  createModal.private_metadata += ` channel=${slackReq.channelId}`;
  responseViewOpen.view = createModal;
  return responseViewOpen;
};
