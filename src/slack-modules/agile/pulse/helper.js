const moment = require('moment-timezone');
const { Op } = require('sequelize');
const db = require('../../../../sequelize');
const { getPaginationButtons, findIndexByBlockId, getSearchSection } = require('../../../utils');
const pulseInfoView = require('./browse/views/pulse-info.json');
const pulsePrivateMessageView = require('./message/views/pulse-message.json');

async function generatePulseBlocks(pulse, page, query) {
  const { blocks } = JSON.parse(JSON.stringify(pulseInfoView).replace('{SLACK_APP_DOMAIN}', process.env.SLACK_APP_DOMAIN));
  const indexName = findIndexByBlockId('name', blocks);
  blocks[indexName].text.text = pulse.name;

  const indexId = findIndexByBlockId('id', blocks);
  blocks[indexId].elements[0].text += pulse.id;

  const indexStatus = findIndexByBlockId('status', blocks);
  // Remove current status
  blocks[indexStatus].elements.forEach((ele, i) => {
    if (ele.action_id === pulse.status) {
      blocks[indexStatus].elements.splice(i, 1);
    }
  });

  // Add pulse id to actions
  blocks[indexStatus].elements.forEach((ele) => {
    // eslint-disable-next-line no-param-reassign
    ele.value += `&pulseId=${pulse.id}&page=${page}`;
    if (query) {
      // eslint-disable-next-line no-param-reassign
      ele.value += ` "${query.raw}"`;
    }
  });

  const indexInfo = findIndexByBlockId('info', blocks);
  blocks[indexInfo].fields[0].text = `*Author:*\n${pulse.User.UserProfile.realName}`;
  blocks[indexInfo].fields[2].text = `*Status:*\n${pulse.status}`;
  blocks[indexInfo].fields[3].text = `*Interval:*\n${pulse.interval} at _${pulse.time}_`;

  const next3Dates = pulse.getNext3PulseDates();
  const indexNextDates = findIndexByBlockId('next_dates', blocks);
  if (pulse.interval === 'weekly') {
    blocks[indexInfo].fields[3].text = '*Interval:*\n';
    blocks[indexInfo].fields[3].text += `Every ${next3Dates[0].format('dddd')} at ${pulse.time}`;
  } else if (pulse.interval === 'monthly') {
    blocks[indexInfo].fields[3].text = '*Interval:*\n';
    if (pulse.dayOfMonth === 0) {
      blocks[indexInfo].fields[3].text += `Every last day of the month at ${pulse.time}`;
    } else {
      blocks[indexInfo].fields[3].text += `Every ${next3Dates[0].date()} of the month at ${pulse.time}`;
    }
  }

  blocks[indexNextDates].elements = [];
  next3Dates.forEach((date) => {
    blocks[indexNextDates].elements.push({ type: 'plain_text', text: `${date.toString()} - ${pulse.User.UserProfile.timezone}` });
  });

  const indexModifyMembers = findIndexByBlockId('modify_members', blocks);
  blocks[indexModifyMembers].accessory.value += `&pulseId=${pulse.id}&page=${page}`;
  if (query) {
    blocks[indexModifyMembers].accessory.value += ` "${query.raw}"`;
  }

  const indexMembers = findIndexByBlockId('members', blocks);
  const memberIds = pulse.userSlackIds.split(',');
  const rows = await db.User.findAll({
    attributes: [],
    where: { slackId: memberIds },
    include: [
      {
        model: db.UserProfile,
        attributes: ['realName', 'image24'],
      },
    ],
  });

  if (rows.length >= 1) {
    blocks[indexMembers].elements = [];

    // Slack blocks only allow up to 10 elements maximum,
    // So we need to split it in chunks of 10
    let i;
    let j;
    const chunk = 10;
    const memberBlocks = [];
    for (i = 0, j = rows.length; i < j; i += chunk) {
      const tenMembers = rows.slice(i, i + chunk);
      const template = { type: 'context', elements: [] };
      // eslint-disable-next-line no-loop-func
      tenMembers.forEach((row) => {
        template.elements.push({
          type: 'image',
          image_url: row.UserProfile.image24,
          alt_text: row.UserProfile.realName,
        });
      });

      memberBlocks.push(template);
    }

    const previousBlocks = blocks.splice(indexMembers).slice(1);
    blocks.push(...memberBlocks);
    blocks.push(...previousBlocks);
  } else {
    blocks.splice(indexMembers, 1);
  }

  const indexQuestion = findIndexByBlockId('question', blocks);
  blocks[indexQuestion].fields = [{ type: 'mrkdwn', text: `*Question:*\n${pulse.question}` }];
  pulse.PulseChoices.forEach((choice, i) => {
    blocks[indexQuestion].fields.push({ type: 'mrkdwn', text: `*Choice #${i + 1}:*\n${choice.text}` });
  });

  const indexSample = findIndexByBlockId('sample', blocks);
  blocks[indexSample].elements[0].value += `&pulseId=${pulse.id}&page=${page}`;
  if (query) {
    blocks[indexSample].elements[0].value += ` "${query.raw}"`;
  }

  return blocks;
}

async function fetchPulses(slackUser, perPage, page, modulePath, query) {
  let where = { createdBy: slackUser.id, status: { [Op.not]: 'deleted' } };
  let searchTerm = '';
  if (query) {
    searchTerm = query.raw;
    where = Object.assign(where, query.sequelize);
  }

  const rows = await db.Pulse.findAll({
    where,
    limit: perPage,
    offset: (perPage * page),
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: db.User,
        attributes: ['id'],
        include: [{ model: db.UserProfile, attributes: ['timezone', 'realName'] }],
      },
      {
        model: db.PulseChoice,
        attributes: ['id', 'text'],
      },
    ],
  });

  if (rows.length === 0) {
    let search = '...';
    if (query) {
      search = ', for the query: ';
      search += searchTerm;
    }

    return [{
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `We could not find any pulses${search}`,
      },
    }];
  }

  const blocks = await generatePulseBlocks(rows[0], page, query);
  blocks.push({ type: 'divider' });
  blocks.push({
    type: 'context',
    elements: [{ type: 'plain_text', text: `${rows[0].createdAt}`, emoji: true }],
  });

  if (query) {
    blocks.push(getSearchSection(searchTerm));
  }

  const totalEntries = await db.Pulse.count({ where });
  if (totalEntries > 1) {
    const paginationButton = {
      type: 'actions',
      elements: getPaginationButtons(totalEntries, perPage, page, modulePath.join(':'), searchTerm),
    };
    blocks.push(paginationButton);
  }

  return blocks;
}

function getSearchQueryFromParams(params) {
  let term = null;
  if (params && Object.prototype.hasOwnProperty.call(params, 'values')) {
    [term] = params.values;
  }

  if (term === null) {
    return null;
  }

  return {
    raw: term,
    sequelize: {
      [Op.or]: [
        { name: { [Op.substring]: term } },
        { question: { [Op.substring]: term } },
      ],
    },
  };
}

async function generatePrivateMessageBlocks(pulseId) {
  const pulse = await db.Pulse.findByPk(pulseId, {
    attributes: ['id', 'question', 'interval', 'time', 'name'],
    distinct: true,
    include: [
      {
        model: db.User,
        attributes: ['id'],
        include: [{ model: db.UserProfile, attributes: ['realName'] }],
      },
      {
        model: db.PulseChoice,
        attributes: ['id', 'text'],
      },
    ],
  });

  const { blocks } = JSON.parse(JSON.stringify(pulsePrivateMessageView));
  const indexInfo = findIndexByBlockId('pulse-info', blocks);
  blocks[indexInfo].elements[0].text = `_${pulse.interval} pulse ${pulse.time} (*${pulse.name}*), created by ${pulse.User.UserProfile.realName}_`;

  const indexRemove = findIndexByBlockId('remove', blocks);
  blocks[indexRemove].elements[0].value += pulse.id;

  const indexChcoices = findIndexByBlockId('choice', blocks);
  blocks[indexChcoices].label.text = pulse.question;
  blocks[indexChcoices].element.options = [];
  pulse.PulseChoices.forEach((choice) => {
    blocks[indexChcoices].element.options.push({
      text: {
        type: 'plain_text',
        text: choice.text,
        emoji: true,
      },
      value: `choiceId=${choice.id}&choiceText="${choice.text}"`,
    });
  });

  const indexSave = findIndexByBlockId('save', blocks);
  blocks[indexSave].elements[0].value = `agile:pulse:message save=1&unixTimestamp=${moment().unix()}`;

  return blocks;
}

async function fetchPulseValues(pulse, dateStart, dateEnd, slackUser) {
  const condition = {
    attributes: ['createdAt', 'comment'],
    where: {},
    include: [
      {
        model: db.PulseChoice,
        attributes: ['id', 'text'],
        where: { pulse_id: pulse.id },
        include: [{
          model: db.Pulse,
          attributes: ['name'],
        }],
      },
    ],
    order: [['createdAt', 'ASC']],
  };

  // If not owner of the pulse we filter by slackUser id
  if (pulse.User.id !== slackUser.id) {
    condition.where.createdBy = slackUser.id;
  }

  if (dateStart && dateEnd) {
    condition.where.createdAt = { [Op.between]: [dateStart, dateEnd] };
  }

  const outValues = [];
  const values = await db.PulseValue.findAll(condition);
  for (let i = 0; i < values.length; i += 1) {
    const value = values[i];
    outValues.push({
      text: value.PulseChoice.text,
      choice_id: value.PulseChoice.id,
      datetime: value.createdAt,
      comment: value.comment,
    });
  }

  return outValues;
}

async function fetchMemberPulses(slackUser) {
  const pulses = await db.Pulse.findAll({
    attributes: ['id', 'name'],
    where: {
      [Op.or]: [
        { userSlackIds: { [Op.substring]: slackUser.slackId } },
        { createdBy: slackUser.id },
      ],
    },
  });

  const options = [];
  pulses.forEach((pulse) => {
    options.push({
      text: {
        type: 'plain_text',
        text: pulse.name,
        emoji: true,
      },
      value: `agile:pulse:data pulseId=${pulse.id.toString()}`,
    });
  });

  return options;
}

async function fetchPulseForData(pulseId) {
  return await db.Pulse.findOne({
    distinct: true,
    attributes: ['id', 'name', 'userSlackIds'],
    where: { id: pulseId },
    order: [['PulseChoices', 'id', 'DESC']],
    include: [
      {
        model: db.User,
        attributes: ['id'],
        include: [{ model: db.UserProfile, attributes: ['realName', 'timezone'] }],
      },
      {
        model: db.PulseChoice,
        attributes: ['id'],
      },
    ],
  });
}

async function savePulse(slackUser, params) {
  // Ensure that all users' profile are in the system
  for (const slackUserId of params.users) {
    // eslint-disable-next-line no-unused-vars
    const [user, created] = await db.User.findOrCreate({
      where: { slackId: slackUserId },
      include: [db.Group, db.UserProfile],
    });
    await user.profileCheck(db);
  }

  const pulse = await db.Pulse.create({
    name: params.name,
    createdBy: slackUser.id,
    status: 'paused',
    time: params.time,
    interval: params.interval,
    dayOfWeek: params.weekly,
    dayOfMonth: params.monthly,
    userSlackIds: params.users.join(','),
    question: params.question,
  });

  for (let i = 0; i < params.choice.length; i += 1) {
    await db.PulseChoice.create({
      pulseId: pulse.id,
      text: params.choice[i],
    });
  }

  return pulse;
}

module.exports = {
  savePulse,
  fetchPulseForData,
  fetchMemberPulses,
  fetchPulses,
  fetchPulseValues,
  generatePrivateMessageBlocks,
  getSearchQueryFromParams,
};
