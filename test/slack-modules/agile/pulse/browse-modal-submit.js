/* eslint-env node, mocha */
const { assert } = require('chai');
const db = require('../../../../sequelize');
const { createSlackUser } = require('../../../test-utils');
const { savePulse } = require('../../../../src/slack-modules/agile/pulse/helper');
const submitCommand = require('../../../../src/slack-modules/agile/pulse/browse/modal-submit');

describe('slack-modules agile:pulse:browse modal-submit', () => {
  beforeEach(async () => {
    await db.PulseChoice.truncate();
    await db.Pulse.truncate();
  });

  it('modify members of an existing pulse', async () => {
    const slackUser = await createSlackUser();
    const pulse = await savePulse(slackUser, {
      name: 'Pulse name Test',
      users: ['U01880B2JB1', 'U01880B2JB2', 'U01880B2JB3', 'U01880B2JB4', 'U01880B2JB5', 'U01880B2JB6'],
      time: '16:01',
      interval: 'monthly',
      monthly: 13,
      question: 'Pulse Question Test',
      choice: [
        'choice 1',
        'choice 2',
      ],
    });

    const slackReq = {
      module: {
        path: ['agile', 'pulse', 'browse'],
        params: { members: ['U01880B2JB0'], modifyMembers: '1', pulseId: pulse.id },
      },
      view: null,
      channelId: null,
      messageTS: 0,
      triggerId: '2180055494598.1310581756160.595a716784684bc7749c4516c66973e1',
      responseUrl: null,
      isRaw: false,
      isCommand: false,
      isInteraction: false,
      isModalSubmission: true,
    };

    await submitCommand(slackUser, slackReq);
    await pulse.reload();

    const members = pulse.userSlackIds.split(',');
    assert.equal(members.length, 1);
    assert.equal(members[0], 'U01880B2JB0');
  });
});
