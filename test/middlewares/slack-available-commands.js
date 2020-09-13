/* eslint-env node, mocha */
let nextCalled = false;
const mockNext = () => { nextCalled = true; };

let sendCalled = false;
const mockSend = () => { sendCalled = true; };

const { assert } = require('chai');
const slackAvailableCommands = require('../../src/middlewares/slack-available-commands');

describe('slack-module (isCommand)', () => {
  it('stops and display help if no module path', async () => {
    const req = { slack: { isCommand: true, module: { path: '' } } };
    const res = { send: mockSend };
    sendCalled = false;
    nextCalled = false;
    await slackAvailableCommands(req, res, mockNext);
    assert.isTrue(sendCalled, 'Send should be called in the slack-module middleware');
    assert.isFalse(nextCalled);
  });

  it('stops and display help for poll module path', async () => {
    const req = { slack: { isCommand: true, module: { path: ['poll'] } } };
    const res = { send: mockSend };
    sendCalled = false;
    nextCalled = false;
    await slackAvailableCommands(req, res, mockNext);
    assert.isTrue(sendCalled, 'Send should be called in the slack-module middleware');
    assert.isFalse(nextCalled);
  });

  it('stops and displays available commands when module not found', async () => {
    const req = { slack: { isCommand: true, module: { path: ['invalid'] } } };
    const res = { send: mockSend };
    sendCalled = false;
    nextCalled = false;
    await slackAvailableCommands(req, res, mockNext);
    assert.isTrue(sendCalled);
    assert.isFalse(nextCalled);
  });

  it('stops and displays available commands when sub module not found', async () => {
    const req = { slack: { isCommand: true, module: { path: ['poll', 'invalid'] } } };
    const res = { send: mockSend };
    sendCalled = false;
    nextCalled = false;
    await slackAvailableCommands(req, res, mockNext);
    assert.isTrue(sendCalled);
    assert.isFalse(nextCalled);
  });

  it('calls next if only one command is found', async () => {
    const req = { slack: { isCommand: true, module: { path: ['poll', 'create'] } } };
    const res = { send: mockSend };
    sendCalled = false;
    nextCalled = false;
    await slackAvailableCommands(req, res, mockNext);
    assert.isFalse(sendCalled);
    assert.isTrue(nextCalled);
  });
});

describe('slack-module (invalid)', () => {
  it('stops and does nothing if req.slack not defined', async () => {
    const req = {};
    const res = { send: mockSend };
    sendCalled = false;
    nextCalled = false;
    await slackAvailableCommands(req, res, mockNext);
    assert.isFalse(sendCalled);
    assert.isTrue(nextCalled);
  });
});
