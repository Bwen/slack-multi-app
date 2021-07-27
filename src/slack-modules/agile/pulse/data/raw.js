const jsonexport = require('jsonexport');
const { fetchPulseValues, fetchPulseForData } = require('../helper');

const db = require(`${process.env.root}/sequelize`);
const logger = require(`${process.env.root}/src/logger`);

module.exports = async (req, res) => {
  const { pulseId } = req.query;
  if (pulseId === undefined || !parseInt(pulseId, 10)) {
    return res.status(400).send('Missing Pulse Id');
  }

  const pulse = await fetchPulseForData(pulseId);
  if (!pulse) {
    logger.warn(`agile:pulse:data:raw link with invalid pulse id: ${pulseId}`);
    return res.status(400).send();
  }

  const slackUser = await db.User.findByPk(req.query.slackUserId);
  if (!slackUser) {
    logger.warn(`agile:pulse:data:raw link with invalid user id: ${req.query.slackUserId}`);
    return res.status(400).send();
  }

  const { dateStart } = req.query;
  const { dateEnd } = req.query;
  const values = await fetchPulseValues(pulse, dateStart, dateEnd, slackUser);

  jsonexport(values, (err, csv) => {
    if (err) {
      logger.error(err);
      return res.status(500).send(err);
    }

    res.setHeader('Content-disposition', 'attachment; filename=pulse-data.csv');
    res.set('Content-Type', 'text/csv');
    return res.status(200).end(csv);
  });

  return {};
};
