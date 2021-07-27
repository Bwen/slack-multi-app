/* eslint-env node, mocha */
const { assert } = require('chai');
const { createSlackUser } = require('../../../test-utils');
const { injectRandomValue, getChoiceIdsForPulse } = require('./helper');
const { savePulse } = require('../../../../src/slack-modules/agile/pulse/helper');
const rawData = require('../../../../src/slack-modules/agile/pulse/data/raw');

const db = require(`${process.env.root}/sequelize`);

const mockRes = {
  reset() {
    this.headers = [];
    this.httpStatus = '';
    this.content = '';
  },
  content: '',
  httpStatus: 200,
  headers: [],
  setHeader(key, value) {
    this.headers.push(`${key}: ${value}`);
  },
  set(key, value) {
    this.headers.push(`${key}: ${value}`);
  },
  send(content) {
    this.content = content;
    return this;
  },
  end(content) {
    this.content = content;
    return this;
  },
  status(status) {
    this.httpStatus = status;
    return this;
  },
};

describe('slack-modules agile:pulse:data raw', () => {
  beforeEach(async () => {
    process.env.HIGHCHARTS_SERVER = 'https://highcharts.tst1';
    process.env.SLACK_APP_DOMAIN = 'slack.tst1';
    mockRes.reset();

    await db.PulseChoice.truncate();
    await db.Pulse.truncate();
    await db.User.truncate();
    await db.PulseValue.truncate();
  });

  it('if invalid pulse id returns 400 http code', async () => {
    const response = await rawData({ query: { pulseId: 'sdfds' } }, mockRes);
    assert.equal(response.httpStatus, 400);
    assert.equal(response.content, 'Missing Pulse Id');
  });

  it('if missing pulse id returns 400 http code', async () => {
    const response = await rawData({ query: {} }, mockRes);
    assert.equal(response.httpStatus, 400);
    assert.equal(response.content, 'Missing Pulse Id');
  });

  it('if pulse id does not exists returns 400 http code', async () => {
    const response = await rawData({ query: { pulseId: 999 } }, mockRes);
    assert.equal(response.httpStatus, 400);
    assert.isUndefined(response.content);
  });

  it('if slack user id does not exists returns 400 http code', async () => {
    const slackUser = await createSlackUser();
    const pulse = await savePulse(slackUser, {
      name: 'Pulse number',
      users: ['U01880B2JB1'],
      time: '16:02',
      interval: 'daily',
      question: 'Pulse Question',
      choice: [
        'choice 1',
        'choice 2',
        'choice 3',
        'choice 5',
        'choice 6',
      ],
    });

    const response = await rawData({ query: { pulseId: pulse.id, slackUserId: 999 } }, mockRes);
    assert.equal(response.httpStatus, 400);
    assert.isUndefined(response.content);
  });

  it('if owner of the pulse, all member\'s values are gathered', async () => {
    const slackUser = await createSlackUser();
    const slackMember1 = await createSlackUser({ slackId: 'U01880B2JB1' });
    const slackMember2 = await createSlackUser({ slackId: 'U01880B2JB2' });
    const slackMember3 = await createSlackUser({ slackId: 'U01880B2JB3' });
    const pulse = await savePulse(slackUser, {
      name: 'Pulse number',
      users: [
        slackMember1.slackId,
        slackMember2.slackId,
        slackMember3.slackId,
      ],
      time: '16:02',
      interval: 'daily',
      question: 'Pulse Question',
      choice: [
        'choice 1',
        'choice 2',
        'choice 3',
        'choice 5',
        'choice 6',
      ],
    });

    const choiceIds = await getChoiceIdsForPulse(pulse);
    await injectRandomValue(slackMember1, choiceIds, `slack member:${slackMember1.id}`);
    await injectRandomValue(slackMember2, choiceIds, `slack member:${slackMember2.id}`);
    await injectRandomValue(slackMember3, choiceIds, `slack member:${slackMember3.id}`);

    await rawData({ query: { pulseId: pulse.id, slackUserId: slackUser.id } }, mockRes);
    assert.isTrue(mockRes.content !== undefined, 'Function rawData should of put something in mockRes.content');

    const csvLines = mockRes.content.split('\n');
    assert.equal(csvLines.length, 4);

    const slackMemberIds = [];
    csvLines.splice(0, 1);
    csvLines.forEach((line) => {
      const values = line.split(',');
      const memberId = parseInt(values[3].split(':')[1], 10);
      slackMemberIds.push(memberId);
    });

    assert.include(slackMemberIds, slackMember1.id);
    assert.include(slackMemberIds, slackMember2.id);
    assert.include(slackMemberIds, slackMember3.id);
  });

  it('if NOT owner of the pulse, only current user\'s values are gathered', async () => {
    const slackUser = await createSlackUser();
    const slackMember1 = await createSlackUser({ slackId: 'U01880B2JB1' });
    const slackMember2 = await createSlackUser({ slackId: 'U01880B2JB2' });
    const slackMember3 = await createSlackUser({ slackId: 'U01880B2JB3' });
    const pulse = await savePulse(slackUser, {
      name: 'Pulse number',
      users: [
        slackMember1.slackId,
        slackMember2.slackId,
        slackMember3.slackId,
      ],
      time: '16:02',
      interval: 'daily',
      question: 'Pulse Question',
      choice: [
        'choice 1',
        'choice 2',
        'choice 3',
        'choice 5',
        'choice 6',
      ],
    });

    const choiceIds = await getChoiceIdsForPulse(pulse);
    await injectRandomValue(slackMember1, choiceIds, `slack member:${slackMember1.id}`);
    await injectRandomValue(slackMember2, choiceIds, `slack member:${slackMember2.id}`);
    await injectRandomValue(slackMember3, choiceIds, `slack member:${slackMember3.id}`);

    // Pass slack member 2 as a user so we only get his data
    await rawData({ query: { pulseId: pulse.id, slackUserId: slackMember2.id } }, mockRes);
    const csvLines = mockRes.content.split('\n');
    assert.equal(csvLines.length, 2);

    const slackMemberIds = [];
    csvLines.splice(0, 1);
    csvLines.forEach((line) => {
      const values = line.split(',');
      const memberId = parseInt(values[3].split(':')[1], 10);
      slackMemberIds.push(memberId);
    });

    assert.notInclude(slackMemberIds, slackMember1.id);
    assert.include(slackMemberIds, slackMember2.id);
    assert.notInclude(slackMemberIds, slackMember3.id);
  });
});
