/* eslint-env node, mocha */
const mock = require('mock-require');
const mockWinston = require('./mocks/winston');
const mockGot = require('./mocks/got');
const mockSlackApi = require('./mocks/wrapper-slack-api');

process.env.SLACK_SIGNING_SECRET = '83e80bdb9b1bdaf6f0eec4f7f51cbcc2';

mock('winston', mockWinston);
mock('got', mockGot);
mock('../../src/wrapper-slack-api.js', mockSlackApi);

describe('before all tests', () => {
  it('fake test', () => {
  });
});
