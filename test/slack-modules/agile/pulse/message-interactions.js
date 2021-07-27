/* eslint-env node, mocha */
const { assert } = require('chai');
// eslint-disable-next-line import/no-extraneous-dependencies
const moment = require('moment');

const { findIndexByBlockId } = require(`${process.env.root}/src/utils`);
const { injectRandomValue, getChoiceIdsForPulse } = require('./helper');
const { createSlackUser } = require('../../../test-utils');
const { savePulse } = require('../../../../src/slack-modules/agile/pulse/helper');
const messageInteraction = require('../../../../src/slack-modules/agile/pulse/message/interactions');

const db = require(`${process.env.root}/sequelize`);
const PULSE_MESSAGE_PATH = ['agile', 'pulse', 'message'];

describe('slack-modules agile:pulse:message interactions', () => {
  beforeEach(async () => {
    await db.PulseValue.truncate();
    await db.PulseChoice.truncate();
    await db.Pulse.truncate();
  });

  it('requests to be removed from pulse', async () => {
    const slackUser = await createSlackUser();
    const slackMember1 = await createSlackUser({ slackId: 'U01880B2JB1' });
    const pulse = await savePulse(slackUser, {
      name: 'Pulse Test',
      users: [slackUser.slackId, slackMember1.slackId],
      time: '16:02',
      interval: 'daily',
      question: 'Pulse Question 2',
      choice: [
        'choice 11',
        'choice 22',
      ],
    });

    const response = await messageInteraction(slackMember1, { module: { path: PULSE_MESSAGE_PATH, params: { removeFrom: pulse.id } } });
    assert.equal(response.type, 'web.chat.delete');

    await pulse.reload();
    const members = pulse.userSlackIds.split(',');
    assert.equal(members.length, 1);
  });

  it('if no params save ignore request', async () => {
    const slackUser = await createSlackUser();
    const slackMember1 = await createSlackUser({ slackId: 'U01880B2JB1' });
    const pulse = await savePulse(slackUser, {
      name: 'Pulse Test',
      users: [slackUser.slackId, slackMember1.slackId],
      time: '16:02',
      interval: 'daily',
      question: 'Pulse Question 2',
      choice: [
        'choice 11',
        'choice 22',
      ],
    });

    const response = await messageInteraction(slackMember1, { module: { path: PULSE_MESSAGE_PATH, params: {} } });
    assert.isEmpty(response);
  });

  it('if no params choiceId ignore request', async () => {
    const slackUser = await createSlackUser();
    const slackMember1 = await createSlackUser({ slackId: 'U01880B2JB1' });
    const pulse = await savePulse(slackUser, {
      name: 'Pulse Test',
      users: [slackUser.slackId, slackMember1.slackId],
      time: '16:02',
      interval: 'daily',
      question: 'Pulse Question 2',
      choice: [
        'choice 11',
        'choice 22',
      ],
    });

    const response = await messageInteraction(slackMember1, { module: { path: PULSE_MESSAGE_PATH, params: { save: true } } });
    assert.isEmpty(response);
  });

  it('if already saved value for pulse/day update message accordingly', async () => {
    const slackUser = await createSlackUser();
    const slackMember1 = await createSlackUser({ slackId: 'U01880B2JB1' });
    const pulse = await savePulse(slackUser, {
      name: 'Pulse Test',
      users: [slackUser.slackId, slackMember1.slackId],
      time: '16:02',
      interval: 'daily',
      question: 'Pulse Question 2',
      choice: [
        'choice 11',
        'choice 22',
      ],
    });

    const choiceIds = await getChoiceIdsForPulse(pulse);
    await injectRandomValue(slackMember1, choiceIds, '', new Date());

    const response = await messageInteraction(slackMember1, {
      module: {
        path: PULSE_MESSAGE_PATH,
        params: {
          save: true,
          choiceId: choiceIds[1],
          unixTimestamp: Date.now() / 1000,
        },
      },
    });
    assert.equal(response.type, 'web.chat.update');

    const indexWarning = findIndexByBlockId('warning', response.blocks);
    assert.include(response.blocks[indexWarning].text.text, 'already saved');
  });

  it('if not a member of pulse update message accordingly', async () => {
    const slackUser = await createSlackUser();
    const slackMember1 = await createSlackUser({ slackId: 'U01880B2JB1' });
    const pulse = await savePulse(slackUser, {
      name: 'Pulse Test',
      users: [slackUser.slackId],
      time: '16:02',
      interval: 'daily',
      question: 'Pulse Question 2',
      choice: [
        'choice 11',
        'choice 22',
      ],
    });

    const choiceIds = await getChoiceIdsForPulse(pulse);
    await injectRandomValue(slackMember1, choiceIds, '', new Date());

    const response = await messageInteraction(slackMember1, {
      module: {
        path: PULSE_MESSAGE_PATH,
        params: {
          save: true,
          choiceId: choiceIds[1],
          unixTimestamp: Date.now() / 1000,
        },
      },
    });
    assert.equal(response.type, 'web.chat.update');

    const indexWarning = findIndexByBlockId('warning', response.blocks);
    assert.include(response.blocks[indexWarning].text.text, 'not a member of');
  });

  it('if saving for pulse/day successfully update message accordingly', async () => {
    const slackUser = await createSlackUser();
    const slackMember1 = await createSlackUser({ slackId: 'U01880B2JB1' });
    const pulse = await savePulse(slackUser, {
      name: 'Pulse Test',
      users: [slackUser.slackId, slackMember1.slackId],
      time: '16:02',
      interval: 'daily',
      question: 'Pulse Question 2',
      choice: [
        'choice 11',
        'choice 22',
      ],
    });

    const choiceIds = await getChoiceIdsForPulse(pulse);
    await injectRandomValue(slackMember1, choiceIds, '', moment().subtract(1, 'day').toDate());
    await injectRandomValue(slackMember1, choiceIds, '', moment().subtract(2, 'day').toDate());

    const response = await messageInteraction(slackMember1, {
      module: {
        path: PULSE_MESSAGE_PATH,
        params: {
          save: true,
          choiceId: choiceIds[1],
          unixTimestamp: Date.now() / 1000,
          comment: 'saved success',
        },
      },
    });
    assert.equal(response.type, 'web.chat.update');

    const indexWarning = findIndexByBlockId('comment', response.blocks);
    assert.include(response.blocks[indexWarning].elements[0].text, 'saved success');
  });
});
