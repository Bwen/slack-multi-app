const db = require('../../../../sequelize');
const { generatePollBlocks } = require('../helper');
const responsePostUrl = require('../../../slack-responses/response.url.json');

async function updateVote(poll, choiceId, currentUserId) {
  let canVote = true;
  const now = new Date();
  if (poll.endDate && now > poll.endDate) {
    canVote = false;
  }

  if (poll.votePerUser !== 0) {
    const choiceIds = poll.PollChoices.map((choice) => choice.id);
    const votes = await db.PollVote.findAll({
      attributes: ['id', 'choiceId'],
      where: {
        createdBy: currentUserId,
        choice_id: choiceIds,
      },
    });

    if (poll.votePerUser <= votes.length) {
      canVote = false;

      // If we allowed to change vote we remove the current vote if any
      if (poll.voteChange === 'yes') {
        votes.forEach((vote) => {
          if (vote.choiceId === choiceId) {
            vote.destroy();
          }
        });
      }
    }
  }

  if (canVote) {
    await db.PollVote.create({
      choice_id: choiceId,
      createdBy: currentUserId,
    });
  }
}

module.exports = async (slackUser, slackReq) => {
  const poll = await db.Poll.findByPk(slackReq.module.params.pollId, {
    attributes: ['id', 'voteChange', 'votePerUser', 'endDate'],
    include: [{
      model: db.PollChoice,
      attributes: ['id'],
    }],
  });

  await updateVote(poll, slackReq.module.params.choiceId, slackUser.id);
  const blocks = await generatePollBlocks(poll.id);
  responsePostUrl.json.replace_original = true;
  responsePostUrl.json.blocks = blocks;
  return responsePostUrl;
};
