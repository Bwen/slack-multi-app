/* eslint-env node, mocha */
const mock = require('mock-require');

let moduleInfoData = [];
mock('../../src/renderer/index.js', {
  availableModules: (res, slackRequest, moduleInfo) => {
    moduleInfoData = moduleInfo;
  },
});

const { assert } = require('chai');
const slackAvailableCommands = require('../../src/middlewares/slack-available-commands');

const mockNext = () => {};
const mockSend = () => {};

describe('validate moduleInfoData', () => {
  it('does not contain duplicates', async () => {
    const req = { slack: { isCommand: true, module: { path: ['poll'] } } };
    const res = { send: mockSend };
    moduleInfoData = [];
    await slackAvailableCommands(req, res, mockNext);
    const dups = {};
    for (let i = 0; i < moduleInfoData.length; i += 1) {
      const info = moduleInfoData[i];
      if (!Object.prototype.hasOwnProperty.call(dups, info[0])) {
        dups[info[0]] = 0;
      }

      dups[info[0]] += 1;
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const [key, value] of Object.entries(dups)) {
      assert.equal(value, 1, `Module name "${key}" appears more than once`);
    }
  });
});
