const db = require('../../../../sequelize');
const responsePostMessage = require('../../../slack-responses/web.chat.postMessage.json');
const { generatePollBlocks } = require('../helper');

async function savePoll(slackUser, params) {
  if (!params.options) {
    // eslint-disable-next-line no-param-reassign
    params.options = [];
  }

  const today = new Date();
  let endDate = new Date(params.end_date);
  if (params.end_date && today > endDate) {
    endDate = null;
  }

  const poll = await db.Poll.create({
    question: params.question,
    createdBy: slackUser.id,
    endDate,
    postAnonymous: params.options.includes('post_anonymous') ? 'yes' : 'no',
    anonymousVotes: params.options.includes('anonymous_votes') ? 'yes' : 'no',
    voteChange: params.options.includes('vote_change') ? 'yes' : 'no',
    suggestion: params.options.includes('suggestion') ? 'yes' : 'no',
    votePerUser: parseInt(params.vote_per_user, 10),
  });

  const promises = params.choice.map(async (choice) => {
    const pollChoice = db.PollChoice.build({
      pollId: poll.id,
      text: choice,
    });
    await pollChoice.save();
  });
  await Promise.all(promises);

  return poll.id;
}

module.exports = async (slackUser, slackReq) => {
  const pollId = await savePoll(slackUser, slackReq.module.params);
  responsePostMessage.icon_emoji = ':bar_chart:';
  responsePostMessage.blocks = await generatePollBlocks(pollId);
  return responsePostMessage;
};
