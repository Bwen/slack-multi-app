const db = require('../../../sequelize');
const { createSlackUser } = require('../../utils');

async function createPoll(options) {
  const slackUser = await createSlackUser();
  const poll = db.Poll.build({
    question: options.question ? options.question : 'Test Question',
    createdBy: slackUser.id,
    endDate: options.endDate ? options.endDate : null,
    postAnonymous: options.postAnonymous ? options.postAnonymous : 'no',
    anonymousVotes: options.anonymousVotes ? options.anonymousVotes : 'no',
    voteChange: options.voteChange ? options.voteChange : 'no',
    suggestion: options.suggestion ? options.suggestion : 'no',
    votePerUser: options.votePerUser || options.votePerUser === 0 ? options.votePerUser : 1,
  });
  await poll.save();

  const promises = ['Choice #1', 'Choice #2', 'Choice #3', 'Choice #4'].map(async (text) => {
    const pollChoice = db.PollChoice.build({
      pollId: poll.id,
      text,
    });
    await pollChoice.save();
    return pollChoice;
  });
  poll.PollChoices = await Promise.all(promises);

  return poll;
}

function getBlock(text, blocks) {
  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    if (block.type === 'section') {
      if (block.fields && block.fields.length) {
        for (let j = 0; j < block.fields.length; j += 1) {
          const field = block.fields[j];
          if (field.text.match(text)) {
            return field;
          }
        }
      }

      if (block.text && block.text.text && block.text.text.match(text)) {
        return block;
      }
    }
  }

  return null;
}

module.exports = {
  createPoll,
  getBlock,
};
