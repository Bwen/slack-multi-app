/* eslint-env node, mocha */
const { assert } = require('chai');
const { findIndexByBlockId, findIndexByActionId } = require('../../../../src/utils');
const { createSlackUser } = require('../../../test-utils');
const { savePulse } = require('../../../../src/slack-modules/agile/pulse/helper');
const dataCommand = require('../../../../src/slack-modules/agile/pulse/data/command');

const db = require(`${process.env.root}/sequelize`);

describe('slack-modules agile:pulse:data command', () => {
  beforeEach(async () => {
    await db.PulseChoice.truncate();
    await db.Pulse.truncate();
    await db.User.truncate();
  });

  it('data pulses are listed in a static_select', async () => {
    const slackUser = await createSlackUser();
    await savePulse(slackUser, {
      name: 'Pulse number 1',
      users: [slackUser.slackId],
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
      users: [slackUser.slackId],
      time: '16:02',
      interval: 'daily',
      question: 'Pulse Question 2',
      choice: [
        'choice 11',
        'choice 22',
      ],
    });

    const response = await dataCommand(slackUser, { module: { path: ['agile', 'pulse', 'data'], params: {} } });
    const indexFilters = findIndexByBlockId('filters', response.blocks);
    const indexPulseIds = findIndexByActionId('pulseId', response.blocks[indexFilters].elements);
    const dropdown = response.blocks[indexFilters].elements[indexPulseIds];
    assert.equal(dropdown.options.length, 2);
  });

  it('data pulses not listed in static_select if not owner or member', async () => {
    const slackUser = await createSlackUser();
    const slackMember = await createSlackUser({ slackId: 'U01880B2JB1' });
    const pulse1 = await savePulse(slackUser, {
      name: 'Pulse number 1',
      users: [slackMember.slackId],
      time: '16:02',
      interval: 'daily',
      question: 'Pulse Question 2',
      choice: [
        'choice 11',
        'choice 22',
      ],
    });

    await savePulse({ id: slackMember.id }, {
      name: 'Pulse number 2',
      users: [slackMember.slackId],
      time: '16:02',
      interval: 'daily',
      question: 'Pulse Question 2',
      choice: [
        'choice 11',
        'choice 22',
      ],
    });

    const pulse3 = await savePulse({ id: slackMember.id }, {
      name: 'Pulse number 3',
      users: [slackUser.slackId],
      time: '16:02',
      interval: 'daily',
      question: 'Pulse Question 3',
      choice: [
        'choice 11',
        'choice 22',
      ],
    });

    const response = await dataCommand(slackUser, { module: { path: ['agile', 'pulse', 'data'], params: {} } });
    const indexFilters = findIndexByBlockId('filters', response.blocks);
    const indexPulseIds = findIndexByActionId('pulseId', response.blocks[indexFilters].elements);
    const dropdown = response.blocks[indexFilters].elements[indexPulseIds];
    assert.equal(dropdown.options.length, 2);
    assert.equal(dropdown.options[0].value, `agile:pulse:data pulseId=${pulse1.id}`);
    assert.equal(dropdown.options[1].value, `agile:pulse:data pulseId=${pulse3.id}`);
  });
});
