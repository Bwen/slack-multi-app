const db = require(`${process.env.root}/sequelize`);
const { Op } = require('sequelize');

const logger = require(`${process.env.root}/src/logger`);
const messageUpdate = require(`${process.env.root}/src/slack-responses/web.chat.update.json`);
const messageDelete = require(`${process.env.root}/src/slack-responses/web.chat.delete.json`);

async function userHasValue(slackUser, pulseId, miliSecondsTimestamp) {
  const messageTime = new Date(miliSecondsTimestamp);
  const startOfDay = new Date(messageTime.getFullYear(), messageTime.getMonth(), messageTime.getDate(), 0, 0, 0);
  const endOfDay = new Date(messageTime.getFullYear(), messageTime.getMonth(), messageTime.getDate(), 23, 59, 59);

  // Check if we already have a value for today
  return await db.PulseValue.findOne({
    attributes: ['createdAt', 'comment'],
    include: [{
      model: db.PulseChoice,
      attributes: ['text'],
      where: { pulse_id: pulseId },
      include: [{
        model: db.Pulse,
        attributes: [],
        where: {
          id: pulseId,
        },
      }],
    }],
    where: {
      createdBy: slackUser.id,
      createdAt: {
        [Op.between]: [startOfDay, endOfDay],
      },
    },
    order: [['createdAt', 'ASC']],
  });
}

async function fetchPulseByChoiceId(slackUser, choiceId) {
  return await db.Pulse.findOne({
    attributes: ['id', 'time', 'interval', 'name'],
    include: [
      {
        model: db.PulseChoice,
        attributes: [],
        where: {
          id: choiceId,
        },
      },
      {
        model: db.User,
        attributes: ['id'],
        include: [{ model: db.UserProfile, attributes: ['realName'] }],
      },
    ],
    where: {
      userSlackIds: {
        [Op.substring]: slackUser.slackId,
      },
    },
  });
}

function getHeaderBlocks(pulse) {
  return [
    {
      type: 'context',
      block_id: 'pulse-info',
      elements: [
        {
          type: 'mrkdwn',
          text: `_${pulse.interval} pulse ${pulse.time} (*${pulse.name}*), created by ${pulse.User.UserProfile.realName}_`,
        },
      ],
    },
    {
      type: 'divider',
    },
  ];
}

function getValueBlocks(text, createdAt, comment) {
  const blocks = [{
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `_${text}_`,
    },
  }];

  if (comment) {
    blocks.push({
      block_id: 'comment',
      type: 'context',
      elements: [{ type: 'mrkdwn', text: `*_${comment}_*` }],
    });
  }

  blocks.push({
    type: 'context',
    elements: [{ type: 'mrkdwn', text: `_${createdAt}_` }],
  });
  return blocks;
}

module.exports = async (slackUser, slackReq) => {
  const logPrefix = `${slackReq.module.path.join(':')}:interactions:`;

  // If user request to be removed from the pulse we do so and delete the message
  if (slackReq.module.params.removeFrom) {
    const pulse = await db.Pulse.findByPk(slackReq.module.params.removeFrom);
    const userIds = pulse.userSlackIds.split(',');
    const index = userIds.indexOf(slackUser.slackId);
    if (index > -1) {
      userIds.splice(index, 1);
    }

    pulse.userSlackIds = userIds.join(',');
    await pulse.save();

    return messageDelete;
  }

  if (!slackReq.module.params.save) {
    return {};
  }

  if (!slackReq.module.params.choiceId) {
    return {};
  }

  const responseUpdate = JSON.parse(JSON.stringify(messageUpdate));
  const pulse = await fetchPulseByChoiceId(slackUser, slackReq.module.params.choiceId);
  if (!pulse) {
    logger.info(`${logPrefix} User ${slackUser.slackId} is not a member of pulse #${slackReq.module.params.choiceId}`);

    responseUpdate.blocks = [];
    responseUpdate.blocks.push({
      block_id: 'warning',
      type: 'section',
      text: { type: 'mrkdwn', text: ':skull: You are not a member of this pulse :skull:' },
    });
    return responseUpdate;
  }

  const miliSecondsTimestamp = parseInt(slackReq.module.params.unixTimestamp, 10) * 1000;
  const value = await userHasValue(slackUser, pulse.id, miliSecondsTimestamp);
  if (value) {
    logger.info(`${logPrefix} User ${slackUser.slackId} already has value for pulse #${pulse.id} for today`);

    responseUpdate.blocks = getHeaderBlocks(pulse);
    responseUpdate.blocks.push({
      block_id: 'warning',
      type: 'section',
      text: { type: 'mrkdwn', text: ':x: You already saved a value for this day :x:' },
    });
    responseUpdate.blocks.push({ type: 'divider' });
    responseUpdate.blocks.push(...getValueBlocks(value.PulseChoice.text, value.createdAt, value.comment));
    return responseUpdate;
  }

  const createdAt = new Date(miliSecondsTimestamp);
  await db.PulseValue.create({
    choiceId: slackReq.module.params.choiceId,
    createdBy: slackUser.id,
    comment: slackReq.module.params.comment,
    createdAt,
  });

  responseUpdate.blocks = getHeaderBlocks(pulse);
  responseUpdate.blocks.push(...getValueBlocks(slackReq.module.params.choiceText, createdAt, slackReq.module.params.comment));
  return responseUpdate;
};
