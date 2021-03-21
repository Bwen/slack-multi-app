const db = require('../../../../sequelize');
const { generatePollBlocks } = require('../helper');
const messageUpdate = require('../../../slack-responses/web.chat.update.json');

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
          if (parseInt(vote.choiceId, 10) === parseInt(choiceId, 10)) {
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
  messageUpdate.blocks = await generatePollBlocks(poll.id);
  return messageUpdate;
};
