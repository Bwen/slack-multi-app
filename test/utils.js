/* eslint-env node, mocha */
const { assert } = require('chai');
const path = require('path');
const mock = require('mock-require');

const mockGot = require('./mocks/got');

mock('got', mockGot);

const mockSlackApi = require('./mocks/wrapper-slack-api');

mock('../../src/wrapper-slack-api.js', mockSlackApi);

let mockResJsonSend = '';
let mockResSend = '';
const mockRes = {
  json: (content) => {
    mockResJsonSend = content;
  },
  send: (content) => {
    mockResSend = content;
  },
};

const utils = require('../src/utils');

const viewPollCreate = require(`${process.env.root}/src/slack-modules/poll/create/views/create.json`);

const slackModulesPath = path.resolve(__dirname, '../src', 'slack-modules');
describe('common utils', () => {
  beforeEach(() => {
    mockResSend = '';
    mockResJsonSend = '';
    mockSlackApi.resetCalls();
  });

  it('findIndexByBlockId finds the right block', () => {
    const { blocks } = viewPollCreate;
    const indexBlock = utils.findIndexByBlockId('vote_per_user', blocks);
    const votePerUserBlock = blocks[indexBlock];
    assert.isNotNull(indexBlock);
    assert.equal(votePerUserBlock.type, 'input');
    assert.equal(votePerUserBlock.element.type, 'static_select');
    assert.equal(votePerUserBlock.element.placeholder.text, 'How many votes per user');
  });

  it('findIndexByBlockId finds no block, returns null', () => {
    const indexBlock = utils.findIndexByBlockId('not_found_block', []);
    assert.isNull(indexBlock);
  });

  it('getSearchSection returns a slack block if term exists', () => {
    const term = 'My Search Term';
    const section = utils.getSearchSection(term);
    assert.isNotNull(section);
    assert.containsAllKeys(section, ['type', 'text']);
    assert.equal(section.type, 'section');
    assert.containsAllKeys(section.text, ['type', 'text']);
    assert.equal(section.text.type, 'mrkdwn');
    assert.include(section.text.text, term);
  });

  it('getSearchSection returns null if no terms', () => {
    const section = utils.getSearchSection();
    assert.isNull(section);
  });

  describe('processSlackResponse web.*', () => {
    const req = {
      slack: { channelId: 321, triggerId: 321, messageTS: 321 },
      currentUser: { slackId: 0 },
      currentActivity: { response: '', save: () => {} },
    };

    beforeEach(() => {
      mockResSend = '';
      mockResJsonSend = '';
      mockSlackApi.resetCalls();
    });

    it('web.views.open passes on the triggerId', async () => {
      const type = 'web.views.open';
      const response = { type };
      await utils.processSlackResponse(req, mockRes, response);

      commonSlackWebResponseAsserts(type, response);
      assert.equal(response.trigger_id, req.slack.triggerId);
    });

    it('web.views.update passes on the channelId', async () => {
      const type = 'web.views.update';
      const response = { type, channel: 0 };
      await utils.processSlackResponse(req, mockRes, response);

      commonSlackWebResponseAsserts(type, response);
    });

    it('web.chat.postMessage passes on the channelId', async () => {
      const type = 'web.chat.postMessage';
      const response = { type };
      await utils.processSlackResponse(req, mockRes, response);

      commonSlackWebResponseAsserts(type, response);
      assert.equal(response.channel, req.slack.channelId);
    });

    it('web.chat.postMessage does NOT passes on the channelId if already set', async () => {
      const type = 'web.chat.postMessage';
      const response = { type, channel: 123 };
      await utils.processSlackResponse(req, mockRes, response);

      commonSlackWebResponseAsserts(type, response);
      assert.equal(response.channel, 123);
    });

    it('web.chat.update passes on the channelId & messageTS', async () => {
      const type = 'web.chat.update';
      const response = { type };
      await utils.processSlackResponse(req, mockRes, response);

      commonSlackWebResponseAsserts(type, response);
      assert.equal(response.channel, req.slack.channelId);
      assert.equal(response.ts, req.slack.messageTS);
    });

    it('web.chat.update does NOT passes on the channelId & messageTS if already set', async () => {
      const type = 'web.chat.update';
      const response = { type, channel: 123, ts: 123 };
      await utils.processSlackResponse(req, mockRes, response);

      commonSlackWebResponseAsserts(type, response);
      assert.equal(response.channel, 123);
      assert.equal(response.ts, 123);
    });

    it('web.chat.delete passes on the channelId & messageTS', async () => {
      const type = 'web.chat.delete';
      const response = { type };
      await utils.processSlackResponse(req, mockRes, response);

      commonSlackWebResponseAsserts(type, response);
      assert.equal(response.channel, req.slack.channelId);
      assert.equal(response.ts, req.slack.messageTS);
    });

    it('web.conversations.open opens conversation & post message', async () => {
      const type = 'web.conversations.open';
      const response = { type, channel: 123 };
      await utils.processSlackResponse(req, mockRes, response);

      commonSlackWebResponseAsserts(type, response);
      assert.include(mockSlackApi.getCalls(), 'web.chat.postMessage');
    });
  });

  it('processSlackResponse response.url uses req.slack.responseUrl', async () => {
    const url = 'https://please.test';
    const type = 'response.url';
    const response = { type };
    const request = {
      slack: { responseUrl: url },
      currentActivity: { response: '', save: () => {} },
    };
    await utils.processSlackResponse(request, mockRes, response);

    assert.notProperty(response, 'type');
    assert.equal(mockGot.getPostUrl(), url);
  });

  it('processSlackResponse renderer.dataList', async () => {
    const type = 'renderer.dataList';
    const request = {
      slack: { isCommand: true },
      currentActivity: { response: '', save: () => {} },
    };
    const response = {
      type,
      data: [
        ['Name', 'Description', 'Users'],
        ['test', 'test description', 'bob,joe,bobby'],
      ],
      total: 1,
      limit: 20,
    };
    await utils.processSlackResponse(request, mockRes, response);

    assert.include(mockResSend, 'test');
    assert.include(mockResSend, 'test description');
    assert.include(mockResSend, 'bob,joe,bobby');
  });

  it('processSlackResponse default json response', async () => {
    const response = { raw: 'test', direct: 'answer' };
    const request = { currentActivity: { response: '', save: () => {} } };
    await utils.processSlackResponse(request, mockRes, response);
    assert.deepEqual(mockResJsonSend, response);
  });

  it('processSlackResponse try catch errors', async () => {
    const type = 'renderer.dataList';
    // missing property response.data triggers a throw
    const response = { type };
    const request = {
      slack: { channelId: 321, isCommand: true },
      currentUser: { slackId: 321 },
      currentActivity: { response: '', save: () => {} },
    };
    await utils.processSlackResponse(request, mockRes, response);
    assert.include(mockSlackApi.getCalls(), 'web.chat.postEphemeral');
  });

  describe('processRawRequest', () => {
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

    beforeEach(() => {
      mockResSend = '';
      mockResJsonSend = '';
      mockSlackApi.resetCalls();
    });

    it('if slack.isRaw is false returns 404 http code', async () => {
      const req = { slack: { isRaw: false } };
      await utils.processRawRequest(req, res, slackModulesPath);
      assert.equal(res.httpStatus, 404);
    });

    it('if module is not found returns 404 http code', async () => {
      const req = {
        slack: {
          isRaw: true,
          module: { path: ['poll', 'invalid'] },
        },
      };

      await utils.processRawRequest(req, res, slackModulesPath);
      assert.equal(res.httpStatus, 404);
    });

    it('module raw.js returns true', async () => {
      const req = {
        query: {},
        slack: {
          isRaw: true,
          module: { path: ['agile', 'pulse', 'data'] },
        },
      };

      await utils.processRawRequest(req, res, slackModulesPath);
      assert.notEqual(res.httpStatus, 500);
    });
  });

  describe('processSlackRequest', () => {
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

    beforeEach(() => {
      mockResSend = '';
      mockResJsonSend = '';
      mockSlackApi.resetCalls();
    });

    it('if module not found, empty response is sent', async () => {
      const req = {
        slack: {
          isRaw: false,
          module: { path: ['poll', 'invalid'] },
        },
      };

      await utils.processSlackRequest(req, res, slackModulesPath);
      assert.equal(res.content, undefined);
      assert.equal(res.httpStatus, 200);
    });

    it('if module returns nothing, empty response is sent', async () => {
      const req = {
        slack: {
          isRaw: false,
          isInteraction: true,
          module: { path: ['poll', 'create'], params: {} },
        },
        currentUser: { slackId: 'test' },
      };

      await utils.processSlackRequest(req, res, slackModulesPath);
      assert.equal(res.content, undefined);
      assert.equal(res.httpStatus, 200);
    });

    it('if module returns multiple responses', async () => {
      const req = {
        slack: {
          isRaw: false,
          isCommand: true,
          module: { path: ['test', 'multiple'], params: {} },
        },
        currentActivity: { response: '', save: () => {} },
      };

      await utils.processSlackRequest(req, res, path.resolve(__dirname, 'test-slack-modules'));
      assert.include(mockSlackApi.getCalls(), 'web.views.open');
      assert.include(mockSlackApi.getCalls(), 'web.views.update');
      assert.equal(mockSlackApi.getCalls().length, 2);
    });

    it('if module returns single response', async () => {
      const req = {
        slack: {
          isRaw: false,
          isCommand: true,
          module: { path: ['test', 'single'], params: {} },
        },
        currentActivity: { response: '', save: () => {} },
      };

      await utils.processSlackRequest(req, res, path.resolve(__dirname, 'test-slack-modules'));
      assert.include(mockSlackApi.getCalls(), 'web.views.open');
      assert.equal(mockSlackApi.getCalls().length, 1);
    });

    it('if generic Error is thrown', async () => {
      const req = {
        slack: {
          isRaw: false,
          isCommand: true,
          module: { path: ['test', 'throw'], params: { throw: 'error' } },
        },
        currentActivity: { response: '', save: () => {} },
        currentUser: { slackId: 321 },
      };

      await utils.processSlackRequest(req, res, path.resolve(__dirname, 'test-slack-modules'));
      assert.include(mockSlackApi.getCalls(), 'web.chat.postEphemeral');
      assert.equal(mockSlackApi.getCalls().length, 1);
    });

    it('if ValidationError is thrown', async () => {
      const req = {
        slack: {
          isRaw: false,
          isCommand: true,
          module: { path: ['test', 'throw'], params: { throw: 'validation' } },
        },
        currentActivity: { response: '', save: () => {} },
      };

      await utils.processSlackRequest(req, res, path.resolve(__dirname, 'test-slack-modules'));
      assert.include(mockSlackApi.getCalls(), 'web.views.open');
      assert.equal(mockSlackApi.getCalls().length, 1);
    });
  });
});

function commonSlackWebResponseAsserts(type, response) {
  assert.notProperty(response, 'type');
  assert.include(mockSlackApi.getCalls(), type);
}
