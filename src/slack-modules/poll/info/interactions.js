const db = require('../../../../sequelize');
const { choiceEmoji } = require('../helper');
const responseViewOpen = require('../../../slack-responses/web.views.open.json');
const pollRules = require('./rules-template.json');

function editField(poll, ruleText, propIndex) {
  const parts = ruleText.split('\t');
  let text = '';
  switch (propIndex) {
    case 'endDate':
      text = `${parts[0]}\tNever`;
      if (poll.endDate) {
        text = `${parts[0]}\t${poll.endDate.getFullYear()}-${poll.endDate.getMonth() + 1}-${poll.endDate.getDate()}`;
      }
      break;
    case 'votePerUser':
      text = `${parts[0]}\t${choiceEmoji(poll[propIndex])}`;
      break;
    default:
      text = `${parts[0]}\t:x:`;
      if (poll[propIndex] === 'yes') {
        text = `${parts[0]}\t:heavy_check_mark:`;
      }
  }

  return text;
}

module.exports = async (slackUser, slackReq) => {
  const poll = await db.Poll.findByPk(slackReq.module.params.pollId, {
    attributes: [
      'id',
      'question',
      'suggestion',
      'postAnonymous',
      'anonymousVotes',
      'voteChange',
      'votePerUser',
      'endDate',
    ],
  });

  pollRules.blocks[0].fields[0].text = editField(poll, pollRules.blocks[0].fields[0].text, 'postAnonymous');
  pollRules.blocks[0].fields[1].text = editField(poll, pollRules.blocks[0].fields[1].text, 'anonymousVotes');
  pollRules.blocks[3].fields[0].text = editField(poll, pollRules.blocks[3].fields[0].text, 'endDate');
  pollRules.blocks[3].fields[1].text = editField(poll, pollRules.blocks[3].fields[1].text, 'suggestion');
  pollRules.blocks[6].fields[0].text = editField(poll, pollRules.blocks[6].fields[0].text, 'voteChange');
  pollRules.blocks[6].fields[1].text = editField(poll, pollRules.blocks[6].fields[1].text, 'votePerUser');
  responseViewOpen.view = pollRules;
  return responseViewOpen;
};
