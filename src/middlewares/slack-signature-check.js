const crypto = require('crypto');
// eslint-disable-next-line import/no-extraneous-dependencies
const moment = require('moment');
const qs = require('qs');
const logger = require('../logger');
const { decrypt } = require('../crypto');

module.exports = () => (req, res, next) => {
  const textGenericError = 'Slack Signature Verification Failed';

  // If we have a Encrypted Query String we try to decrypt it
  if (Object.prototype.hasOwnProperty.call(req.query, 'eqs')) {
    try {
      const result = decrypt(req.query.eqs);
      const realQS = qs.parse(result);

      // If it was decrypted successfully we should have a time property
      if (Object.prototype.hasOwnProperty.call(realQS, 'time')) {
        if (!parseInt(realQS.time, 10)) {
          logger.warn('Invalid time parameter');
          return res.status(400).send(textGenericError);
        }

        const requestTime = moment.unix(realQS.time);

        // If the request time is greater than 5 minutes we stop here
        if (moment().diff(requestTime, 'minutes') > 5) {
          logger.warn('Encrypted QS request time expired');
          return res.status(400).send(textGenericError);
        }

        req.query = realQS;
        return next();
      }
    } catch (err) {
      logger.warn('Failed to decrypt the query string');
      return res.status(400).send(textGenericError);
    }
  }

  const slackSignature = req.headers['x-slack-signature'];
  if (!slackSignature) {
    logger.warn('Slack Signature Verification was not provided');
    return res.status(400).send(textGenericError);
  }

  const signTimestamp = req.headers['x-slack-request-timestamp'];
  if (moment().diff(moment.unix(signTimestamp), 'minutes') > 5) {
    logger.warn('Slack Signature: timestamp is older then 5 minutes of localtime, reply attack?');
    return res.status(400).send(textGenericError);
  }

  const slackSigningSecret = process.env.SLACK_SIGNING_SECRET;
  const [sigVer, sigHash] = slackSignature.split('=');
  if (sigVer !== 'v0') {
    logger.warn('Slack Signature: invalid version');
    return res.status(400).send(textGenericError);
  }

  const mySigHash = crypto
    .createHmac('sha256', slackSigningSecret)
    .update(`${sigVer}:${signTimestamp}:${req.rawBody}`, 'utf8')
    .digest('hex');

  if (crypto.timingSafeEqual(Buffer.from(mySigHash, 'utf8'), Buffer.from(sigHash, 'utf8'))) {
    return next();
  }

  logger.warn('Slack Signature: hash mismatch');
  return res.status(400).send(textGenericError);
};
