// eslint-disable-next-line no-unused-vars
const db = require('../../../sequelize');
const { getPaginationButtons } = require('../../utils');

function choiceEmoji(index) {
  switch (index) {
    case 1: return ':one:';
    case 2: return ':two:';
    case 3: return ':three:';
    case 4: return ':four:';
    case 5: return ':five:';
    case 6: return ':six:';
    case 7: return ':seven:';
    case 8: return ':eight:';
    case 9: return ':nine:';
    case 10: return ':ten:';
    default: return ':loop:';
  }
}

function getVotesPerUser(votes) {
  const userIds = [];
  const perUsers = [];
  votes.forEach((vote) => {
    if (userIds.includes(vote.User.id)) {
      const userVote = perUsers.find((v) => v.id === vote.User.id);
      userVote.votes += 1;
      return;
    }

    perUsers.push({
      id: vote.User.id,
      name: vote.User.UserProfile.realName,
      image: vote.User.UserProfile.image24,
      votes: 1,
    });
    userIds.push(vote.User.id);
  });

  return perUsers;
}

async function generatePollBlocks(pollId, readOnly = false) {
  const blocks = [];
  const poll = await db.Poll.findByPk(pollId, {
    attributes: ['id', 'endDate', 'question', 'suggestion', 'postAnonymous', 'anonymousVotes'],
    include: [
      {
        model: db.User,
        attributes: ['id'],
        include: [
          {
            model: db.UserProfile,
            attributes: ['realName'],
          },
        ],
      },
      {
        model: db.PollChoice,
        attributes: ['id', 'text'],
        include: [
          {
            model: db.PollVote,
            attributes: ['createdBy'],
            include: [
              {
                model: db.User,
                attributes: ['id'],
                include: [
                  {
                    model: db.UserProfile,
                    attributes: ['realName', 'image24'],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    order: [
      [db.PollChoice, 'id', 'ASC'],
    ],
  });

  let author = poll.User.UserProfile.realName;
  if (poll.postAnonymous === 'yes') {
    author = 'Anonymous';
  }

  blocks.push({
    type: 'context',
    elements: [
      { type: 'plain_text', text: `Poll ID: #${poll.id},` },
      { type: 'plain_text', text: `Author: ${author}` },
    ],
  });

  blocks.push({
    type: 'section',
    text: { type: 'mrkdwn', text: `*${poll.question}*` },
    accessory: { type: 'button', text: { type: 'plain_text', text: 'Poll Rules' }, value: `poll:info pollId=${poll.id}` },
  });
  blocks.push({ type: 'divider' });

  const choiceTemplate = {
    type: 'section',
    text: { type: 'mrkdwn', text: '' },
  };
  if (!readOnly) {
    choiceTemplate.accessory = {
      type: 'button',
      action_id: '',
      text: { type: 'plain_text', text: 'Vote' },
      value: '',
    };
  }

  poll.PollChoices.forEach((item, index) => {
    let { text } = item;
    if (!text.match(/^:/)) {
      text = `${choiceEmoji(index + 1)} ${item.text}`;
    }

    choiceTemplate.text.text = text;
    if (!readOnly) {
      choiceTemplate.accessory.action_id = `vote_${poll.id}_${item.id}`;
      choiceTemplate.accessory.value = `poll:vote pollId=${poll.id}&choiceId=${item.id}`;
    }
    blocks.push(JSON.parse(JSON.stringify(choiceTemplate)));

    if (poll.anonymousVotes === 'yes') {
      let numberOfVotes = `${item.PollVotes.length} Votes`;
      if (!numberOfVotes) {
        numberOfVotes = 'No Votes';
      }

      const votesTemplate = { type: 'context', elements: [] };
      votesTemplate.elements.push({
        type: 'mrkdwn',
        text: numberOfVotes,
      });
      blocks.push(JSON.parse(JSON.stringify(votesTemplate)));
    } else {
      const votesPerUsers = getVotesPerUser(item.PollVotes);

      // Slack blocks only allow up to 10 elements maximum,
      // So we need to split it in chunks of 10
      let totalVotes = 0;
      let i;
      let j;
      const chunk = 10;
      const voteTemplates = [];
      for (i = 0, j = votesPerUsers.length; i < j; i += chunk) {
        const votes = votesPerUsers.slice(i, i + chunk);
        const template = { type: 'context', elements: [] };
        // eslint-disable-next-line no-loop-func
        votes.forEach((vote) => {
          totalVotes += vote.votes;
          template.elements.push({
            type: 'image',
            image_url: vote.image,
            alt_text: `${vote.name}, ${vote.votes} Votes`,
          });
        });

        voteTemplates.push(template);
      }

      if (!voteTemplates.length) {
        const template = { type: 'context', elements: [] };
        template.elements.push({ type: 'mrkdwn', text: 'No votes' });
        blocks.push(template);
      } else {
        if (voteTemplates.length === 1 && voteTemplates[0].elements.length < 9) {
          voteTemplates[0].elements.push({ type: 'mrkdwn', text: `${totalVotes} votes` });
        } else {
          const template = { type: 'context', elements: [] };
          template.elements.push({ type: 'mrkdwn', text: `${totalVotes} votes` });
          voteTemplates.push(template);
        }

        voteTemplates.forEach((vTemplate) => {
          blocks.push(vTemplate);
        });
      }
    }
  });

  if (poll.endDate) {
    blocks.push({ type: 'context', elements: [{ type: 'plain_text', text: `Voting Ends: ${poll.endDate}` }] });
  }

  if (poll.suggestion === 'yes' && !readOnly) {
    blocks.push({ type: 'divider' });
    blocks.push({
      type: 'actions',
      elements: [{
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Add a suggestion',
        },
        value: `poll:choices add=1&pollId=${poll.id}`,
      }],
    });
  }

  return blocks;
}

async function fetchPoll(slackUser, perPage, page, modulePath, readOnly = true, querystring) {
  const where = { createdBy: slackUser.id };
  const rows = await db.Poll.findAll({
    attributes: ['id', 'createdAt'],
    where,
    limit: perPage,
    offset: (perPage * page),
    order: [['createdAt', 'DESC']],
  });

  if (rows.length === 0) {
    let search = '...';
    if (querystring) {
      search = ', for the query: ';
      search += querystring;
    }

    return [{
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `We could not find any polls${search}`,
      },
    }];
  }

  const blocks = await generatePollBlocks(rows[0].id, readOnly);
  if (!readOnly) {
    return blocks;
  }

  blocks.push({ type: 'divider' });
  blocks.push({
    type: 'context',
    elements: [{ type: 'plain_text', text: `${rows[0].createdAt}`, emoji: true }],
  });

  const totalEntries = await db.Poll.count({ where });
  const paginationButton = { type: 'actions', elements: getPaginationButtons(totalEntries, perPage, page, modulePath) };
  paginationButton.elements.push({
    type: 'button',
    action_id: 're-post',
    text: {
      type: 'plain_text',
      text: 'Re-post to current channel',
    },
    value: `${modulePath} page=${page}&repost=1`,
  });
  blocks.push(paginationButton);

  return blocks;
}

module.exports = {
  fetchPoll,
  generatePollBlocks,
  choiceEmoji,
};
