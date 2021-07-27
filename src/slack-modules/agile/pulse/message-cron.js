const moment = require('moment-timezone');

const db = require(`${process.env.root}/sequelize`);
const { Op } = require('sequelize');

const logger = require(`${process.env.root}/src/logger`);
const { generatePrivateMessageBlocks } = require('./helper');

const responsePrivateMessage = require(`${process.env.root}/src/slack-responses/web.conversations.open.json`);
const { processSlackResponse } = require(`${process.env.root}/src/utils`);

async function fetchPulsesToSend(now) {
  const start = now.clone().subtract(30, 'minutes').format('YYYY-MM-DD HH:mm:00');
  const end = now.clone().add(30, 'minutes').format('YYYY-MM-DD HH:mm:00');
  return await db.Pulse.findAll({
    attributes: ['id', 'userSlackIds', 'nextPulse', 'time', 'interval', 'dayOfWeek', 'dayOfMonth'],
    where: {
      [Op.or]: [
        { nextPulse: { [Op.between]: [start, end] } },
        { nextPulse: null },
      ],
      status: 'running',
    },
    include: [{
      model: db.User,
      attributes: ['id'],
      include: [{ model: db.UserProfile, attributes: ['realName', 'timezone'] }],
    }],
  });
}

module.exports = {
  schedule: '00 * * * *', // Execute every hour
  task: async (req, res) => {
    const now = moment.utc();
    const pulses = await fetchPulsesToSend(now);
    logger.info(`Hourly Pulses Check Found ${pulses.length}`);
    for (let i = 0; i < pulses.length; i += 1) {
      const pulse = pulses[i];
      const next3Dates = pulse.getNext3PulseDates();

      if (pulse.nextPulse === null) {
        pulse.nextPulse = next3Dates[0].utc().format('YYYY-MM-DD HH:mm:00');
        await pulse.save();
      }

      const nextPulse = moment.utc(pulse.nextPulse).tz(pulse.User.UserProfile.timezone);
      if (nextPulse.diff(now, 'minutes') > 1) {
        continue;
      }

      // Update nextPulse right away to avoid collision, need to be before `processSlackResponse`s seem to halt process
      pulse.nextPulse = next3Dates[1].utc().format('YYYY-MM-DD HH:mm:00');
      await pulse.save();

      logger.info(`Processing Pulse ID #${pulse.id}, next Pulse at: ${nextPulse.toString()}`);
      const slackIds = pulse.userSlackIds.split(',');
      const messageBlocks = await generatePrivateMessageBlocks(pulse.id);
      const responses = [];
      slackIds.forEach((slackId) => {
        const response = JSON.parse(JSON.stringify(responsePrivateMessage));
        response.channel = slackId;
        response.blocks = messageBlocks;
        responses.push(response);
      });

      const promises = responses.map(async (response) => {
        logger.info(`Pulse ID #${pulse.id}: Sending private message to user ${response.channel}`);
        await processSlackResponse(req, res, response);
      });
      await Promise.all(promises);
    }
  },
};
