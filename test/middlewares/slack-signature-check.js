const { assert } = require('chai');
// eslint-disable-next-line import/no-extraneous-dependencies
const moment = require('moment');
const crypto = require('crypto');

const mock = require('mock-require');
const mockWinstonCreate = require('../mocks/winston');

mock('winston', mockWinstonCreate);
const mockWinston = mockWinstonCreate.createLogger();

const slackSignatureCheck = require('../../src/middlewares/slack-signature-check')();

const { encrypt } = require(`${process.env.root}/src/crypto`);

let nextCalled = false;
describe('middleware slack-signature-check', () => {
  beforeEach(() => {
    nextCalled = false;
    mockWinston.clearAll();
  });

  const ERROR_GENERIC = 'Slack Signature Verification Failed';
  const next = () => { nextCalled = true; };
  const res = {
    content: '',
    httpStatus: 200,
    send(content) {
      this.content = content;
      return this;
    },
    status(status) {
      this.httpStatus = status;
      return this;
    },
  };

  describe('encrypted query string', () => {
    it('try catch all errors to 400 http code', async () => {
      const req = { query: { eqs: null } };
      slackSignatureCheck(req, res, next);
      assert.isFalse(nextCalled);
      assert.equal(res.httpStatus, 400);
      assert.equal(res.content, ERROR_GENERIC);
      assert.equal(mockWinston.getLastWarning(), 'Failed to decrypt the query string');
    });

    it('if eqs time is greater than 5 minutes, 400 http code', async () => {
      const qs = `time=${moment().subtract(10, 'minutes').unix()}`;
      const req = { query: { eqs: encrypt(qs) } };
      slackSignatureCheck(req, res, next);
      assert.isFalse(nextCalled);
      assert.equal(res.httpStatus, 400);
      assert.equal(res.content, ERROR_GENERIC);
      assert.equal(mockWinston.getLastWarning(), 'Encrypted QS request time expired');
    });

    it('if eqs time is not parseable, 400 http code', async () => {
      const qs = 'time=af^sd';
      const req = { query: { eqs: encrypt(qs) } };
      slackSignatureCheck(req, res, next);
      assert.isFalse(nextCalled);
      assert.equal(res.httpStatus, 400);
      assert.equal(res.content, ERROR_GENERIC);
      assert.equal(mockWinston.getLastWarning(), 'Invalid time parameter');
    });

    it('succeed at decrypting the query string', async () => {
      const qs = `time=${moment().unix()}&test=complete`;
      const req = { query: { eqs: encrypt(qs) } };
      slackSignatureCheck(req, res, next);
      assert.isTrue(nextCalled);
      assert.equal(req.query.test, 'complete');
    });
  });

  describe('x-slack-signature check', () => {
    it('missing signature in headers', async () => {
      const req = { query: {}, headers: {} };
      slackSignatureCheck(req, res, next);
      assert.isFalse(nextCalled);
      assert.equal(res.httpStatus, 400);
      assert.equal(res.content, ERROR_GENERIC);
      assert.equal(mockWinston.getLastWarning(), 'Slack Signature Verification was not provided');
    });

    it('request timestamp expired, 5 minutes', async () => {
      const req = {
        query: {},
        headers: {
          'x-slack-signature': 'v0=sdfsdfsdf',
          'x-slack-request-timestamp': moment().subtract(10, 'minutes').unix(),
        },
      };
      slackSignatureCheck(req, res, next);
      assert.isFalse(nextCalled);
      assert.equal(res.httpStatus, 400);
      assert.equal(res.content, ERROR_GENERIC);
      assert.equal(mockWinston.getLastWarning(), 'Slack Signature: timestamp is older then 5 minutes of localtime, reply attack?');
    });

    it('signature has invalid version', async () => {
      const req = {
        query: {},
        headers: {
          'x-slack-signature': 'v10=sdfsdfsdf',
          'x-slack-request-timestamp': moment().unix(),
        },
      };
      slackSignatureCheck(req, res, next);
      assert.isFalse(nextCalled);
      assert.equal(res.httpStatus, 400);
      assert.equal(res.content, ERROR_GENERIC);
      assert.equal(mockWinston.getLastWarning(), 'Slack Signature: invalid version');
    });

    it('signature mismatch', async () => {
      const req = {
        rawBody: 'sdfsdfsdf',
        query: {},
        headers: {
          'x-slack-signature': 'v0=6ba2de3a8595c8029ff867f0ab9d18f7e853ec18d40355a2a609358833a23fb5',
          'x-slack-request-timestamp': moment().unix(),
        },
      };
      slackSignatureCheck(req, res, next);
      assert.isFalse(nextCalled);
      assert.equal(res.httpStatus, 400);
      assert.equal(res.content, ERROR_GENERIC);
      assert.equal(mockWinston.getLastWarning(), 'Slack Signature: hash mismatch');
    });

    it('signature succeed', async () => {
      const content = 'This is my raw body content';
      const timestamp = moment().unix();
      const slackSigningSecret = process.env.SLACK_SIGNING_SECRET;
      const mySigHash = crypto
        .createHmac('sha256', slackSigningSecret)
        .update(`v0:${timestamp}:${content}`, 'utf8')
        .digest('hex');

      const req = {
        rawBody: content,
        query: {},
        headers: {
          'x-slack-signature': `v0=${mySigHash}`,
          'x-slack-request-timestamp': timestamp,
        },
      };

      slackSignatureCheck(req, res, next);
      assert.isTrue(nextCalled);
    });
  });
});
