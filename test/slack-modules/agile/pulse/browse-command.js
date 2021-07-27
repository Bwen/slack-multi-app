/* eslint-env node, mocha */
const { assert } = require('chai');
// eslint-disable-next-line import/no-extraneous-dependencies
const moment = require('moment');
const { findIndexByBlockId } = require('../../../../src/utils');
const { createSlackUser } = require('../../../test-utils');
const { savePulse } = require('../../../../src/slack-modules/agile/pulse/helper');
const browseCommand = require('../../../../src/slack-modules/agile/pulse/browse/command');

const db = require(`${process.env.root}/sequelize`);
const PULSE_BROWSE_PATH = ['agile', 'pulse', 'browse'];

describe('slack-modules agile:pulse:browse command', () => {
  beforeEach(async () => {
    await db.PulseChoice.truncate();
    await db.Pulse.truncate();
  });

  it('browses slackUser agile pulses in reverse chronological order', async () => {
    const slackUser = await createSlackUser();
    await savePulse(slackUser, {
      name: 'Pulse number 2',
      users: ['U01880B2JB1'],
      time: '16:01',
      interval: 'weekly',
      weekly: 1,
      question: 'Pulse Question 2',
      choice: [
        'choice 1',
        'choice 2',
      ],
    });

    const pulse3 = await savePulse(slackUser, {
      name: 'Pulse number 3',
      users: ['U01880B2JB1'],
      time: '16:01',
      interval: 'monthly',
      monthly: 13,
      question: 'Pulse Question 3',
      choice: [
        'choice 1',
        'choice 2',
      ],
    });
    pulse3.changed('createdAt', true);
    pulse3.set('createdAt', moment().subtract(6, 'days').toDate(), { raw: true });
    await pulse3.save({ silent: true, fields: ['createdAt'], hooks: false });

    const pulse2 = await savePulse(slackUser, {
      name: 'Pulse number 1',
      users: ['U01880B2JB2'],
      time: '16:02',
      interval: 'monthly',
      monthly: 0,
      question: 'Pulse Question 1',
      choice: [
        'choice 11',
        'choice 22',
      ],
    });
    pulse2.changed('createdAt', true);
    pulse2.set('createdAt', moment().subtract(5, 'days').toDate(), { raw: true });
    await pulse2.save({ silent: true, fields: ['createdAt'], hooks: false });

    const response1 = await browseCommand(slackUser, { module: { path: PULSE_BROWSE_PATH, params: { page: 0 } } });
    const indexName1 = findIndexByBlockId('name', response1.blocks);
    assert.equal(response1.blocks[indexName1].text.text, 'Pulse number 2');

    const response2 = await browseCommand(slackUser, { module: { path: PULSE_BROWSE_PATH, params: { page: 1 } } });
    const indexName2 = findIndexByBlockId('name', response2.blocks);
    assert.equal(response2.blocks[indexName2].text.text, 'Pulse number 1');

    const response3 = await browseCommand(slackUser, { module: { path: PULSE_BROWSE_PATH, params: { page: 2 } } });
    const indexName3 = findIndexByBlockId('name', response3.blocks);
    assert.equal(response3.blocks[indexName3].text.text, 'Pulse number 3');
  });

  it('browses slackUser agile pulses with search term', async () => {
    const slackUser = await createSlackUser();

    await savePulse(slackUser, {
      name: 'potato team',
      users: ['U01880B2JB2'],
      time: '16:02',
      interval: 'daily',
      question: 'Pulse Question 2',
      choice: [
        'choice 11',
        'choice 22',
      ],
    });

    await savePulse(slackUser, {
      name: 'Pulse number 2',
      users: ['U01880B2JB1'],
      time: '16:01',
      interval: 'daily',
      question: 'Pulse Question 1',
      choice: [
        'choice 1',
        'choice 2',
      ],
    });

    await savePulse(slackUser, {
      name: 'Pulse number 1',
      users: ['U01880B2JB2'],
      time: '16:02',
      interval: 'daily',
      question: 'Pulse Question 2',
      choice: [
        'choice 11',
        'choice 22',
      ],
    });

    const response = await browseCommand(slackUser, { module: { path: PULSE_BROWSE_PATH, params: { page: 0, values: ['potato'] } } });
    const indexName = findIndexByBlockId('name', response.blocks);
    assert.equal(response.blocks[indexName].text.text, 'potato team');
  });
});
