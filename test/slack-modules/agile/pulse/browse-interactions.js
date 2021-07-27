/* eslint-env node, mocha */
const { assert } = require('chai');
const { findIndexByBlockId } = require('../../../../src/utils');
const { createSlackUser } = require('../../../test-utils');
const { savePulse } = require('../../../../src/slack-modules/agile/pulse/helper');
const browseInteraction = require('../../../../src/slack-modules/agile/pulse/browse/interactions');

const db = require(`${process.env.root}/sequelize`);
const PULSE_BROWSE_PATH = ['agile', 'pulse', 'browse'];

describe('slack-modules agile:pulse:browse interactions', () => {
  beforeEach(async () => {
    await db.PulseChoice.truncate();
    await db.Pulse.truncate();
  });

  it('browses slackUser agile pulses modify members opens modal', async () => {
    const slackUser = await createSlackUser();
    const pulse = await savePulse(slackUser, {
      name: 'Pulse Test',
      users: ['U01880B2JB2'],
      time: '16:02',
      interval: 'daily',
      question: 'Pulse Question 2',
      choice: [
        'choice 11',
        'choice 22',
      ],
    });

    const response = await browseInteraction(slackUser, { module: { path: PULSE_BROWSE_PATH, params: { pulseId: pulse.id, page: 0, modifyMembers: true } } });
    assert.equal(response.type, 'web.views.open');
    assert.equal(response.view.type, 'modal');
    assert.equal(response.view.title.text, 'Modify Members');

    const indexMembers = findIndexByBlockId('members', response.view.blocks);
    assert.equal(response.view.blocks[indexMembers].element.initial_users.length, 1);
  });

  it('browses slackUser agile pulses send sample', async () => {
    const slackUser = await createSlackUser();
    const pulse = await savePulse(slackUser, {
      name: 'Pulse Test',
      users: ['U01880B2JB2'],
      time: '16:02',
      interval: 'monthly',
      monthly: 1,
      question: 'Pulse Question 2',
      choice: [
        'choice 11',
        'choice 22',
      ],
    });

    const response = await browseInteraction(slackUser, { module: { path: PULSE_BROWSE_PATH, params: { pulseId: pulse.id, page: 0, sample: true } } });
    assert.equal(response.type, 'web.conversations.open');
    const indexInfo = findIndexByBlockId('pulse-info', response.blocks);
    assert.include(response.blocks[indexInfo].elements[0].text, pulse.name);
  });

  it('browses slackUser agile pulses change status', async () => {
    const slackUser = await createSlackUser();
    const pulse = await savePulse(slackUser, {
      name: 'Pulse Test',
      users: ['U01880B2JB2'],
      time: '16:02',
      interval: 'daily',
      question: 'Pulse Question 2',
      choice: [
        'choice 11',
        'choice 22',
      ],
    });

    const newStatus = 'running';
    const response = await browseInteraction(slackUser, { module: { path: PULSE_BROWSE_PATH, params: { pulseId: pulse.id, page: 0, status: newStatus } } });
    assert.equal(response.json.replace_original, true);
    await pulse.reload();
    assert.equal(pulse.status, 'running');
  });
});
