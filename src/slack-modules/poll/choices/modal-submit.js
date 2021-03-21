const db = require('../../../../sequelize');
const responsePostUrl = require('../../../slack-responses/response.url.json');
const { generatePollBlocks } = require('../helper');

async function saveNewChoices(pollId, choices) {
  const promises = choices.map(async (choice) => {
    const pollChoice = db.PollChoice.build({
      pollId,
      text: choice,
    });
    await pollChoice.save();
  });
  await Promise.all(promises);
}

module.exports = async (slackUser, slackReq) => {
  const choices = slackReq.module.params.choice;
  const { pollId } = slackReq.module.params;
  await saveNewChoices(pollId, choices);

  const blocks = await generatePollBlocks(pollId);
  responsePostUrl.json.replace_original = true;
  responsePostUrl.json.blocks = blocks;
  return responsePostUrl;
};
