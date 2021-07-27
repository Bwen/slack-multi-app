/* eslint-env node, mocha */
const { assert } = require('chai');

const mock = require('mock-require');
const mockWinstonCreate = require('../../../mocks/winston');

mock('winston', mockWinstonCreate);
const mockWinston = mockWinstonCreate.createLogger();

const mockSlackApi = require('../../../mocks/wrapper-slack-api');

mock('../../src/wrapper-slack-api.js', mockSlackApi);

// eslint-disable-next-line import/no-extraneous-dependencies
const moment = require('moment');

const { findIndexByBlockId } = require(`${process.env.root}/src/utils`);
const { injectRandomValue, getChoiceIdsForPulse } = require('./helper');
const { createSlackUser } = require('../../../test-utils');
const { savePulse } = require('../../../../src/slack-modules/agile/pulse/helper');
const messageCron = require('../../../../src/slack-modules/agile/pulse/message-cron');

const db = require(`${process.env.root}/sequelize`);
const PULSE_MESSAGE_PATH = ['agile', 'pulse', 'message'];

describe('slack-modules agile:pulse:message-cron', () => {
  beforeEach(async () => {
    await db.PulseChoice.truncate();
    await db.Pulse.truncate();
    mockWinston.clearAll();
    mockSlackApi.resetCalls();
  });

  it('pulses are checked every hour', () => {
    assert.equal(messageCron.schedule, '00 * * * *');
  });

  it('if pulse not at status running, it is skipped', async () => {
    const slackUser = await createSlackUser();
    const slackMember1 = await createSlackUser({ slackId: 'U01880B2JB1' });
    const pulse = await savePulse(slackUser, {
      name: 'Pulse Test',
      users: [slackUser.slackId, slackMember1.slackId],
      time: moment().format('HH:mm'),
      interval: 'daily',
      question: 'Pulse Question 2',
      choice: [
        'choice 11',
        'choice 22',
      ],
    });

    await messageCron.task({}, {});
    await pulse.reload();
    assert.isNull(pulse.nextPulse);
    assert.notInclude(mockWinston.getLastInfo(), 'Processing Pulse ID');
    assert.notInclude(mockSlackApi.getCalls(), 'web.conversations.open');
  });

  it('if pulse is not scheduled, next pulse date is updated and saved', async () => {
    const slackUser = await createSlackUser();
    const slackMember1 = await createSlackUser({ slackId: 'U01880B2JB1' });
    const pulse = await savePulse(slackUser, {
      name: 'Pulse Test',
      users: [slackUser.slackId, slackMember1.slackId],
      time: moment().add(5, 'minutes').format('HH:mm'),
      interval: 'daily',
      question: 'Pulse Question 2',
      choice: [
        'choice 11',
        'choice 22',
      ],
    });

    // Change status to running so the cron takes it
    pulse.status = 'running';
    await pulse.save();

    await messageCron.task({}, {});
    await pulse.reload();
    assert.isNotNull(pulse.nextPulse);
    assert.notInclude(mockSlackApi.getCalls(), 'web.conversations.open');
  });

  it('if all messages are sent sucessfully', async () => {
    const slackUser = await createSlackUser();
    const slackMember1 = await createSlackUser({ slackId: 'U01880B2JB1' });
    const pulse1 = await savePulse(slackUser, {
      name: 'Pulse Test 1',
      users: [slackUser.slackId, slackMember1.slackId],
      time: moment().format('HH:mm'),
      interval: 'daily',
      question: 'Pulse Question 1',
      choice: [
        'choice 1',
        'choice 2',
      ],
    });
    pulse1.status = 'running';
    await pulse1.save();

    const pulse2 = await savePulse(slackUser, {
      name: 'Pulse Test 2',
      users: [slackUser.slackId, slackMember1.slackId],
      time: moment().format('HH:mm'),
      interval: 'daily',
      question: 'Pulse Question 2',
      choice: [
        'choice 11',
        'choice 22',
      ],
    });
    pulse2.status = 'running';
    await pulse2.save();

    await messageCron.task({
      slack: { channelId: 'test' },
      currentUser: slackUser,
      currentActivity: {
        save: async () => new Promise((resolve) => resolve()),
        response: null,
      },
    }, { send: () => {} });
    await pulse1.reload();
    await pulse2.reload();

    const convCount = mockSlackApi.getCalls().filter((call) => call === 'web.conversations.open').length;
    assert.equal(convCount, 4);

    const chatMessageCount = mockSlackApi.getCalls().filter((call) => call === 'web.chat.postMessage').length;
    assert.equal(chatMessageCount, 4);

    assert.isNotNull(pulse1.nextPulse);
    assert.isNotNull(pulse2.nextPulse);
  });
});
