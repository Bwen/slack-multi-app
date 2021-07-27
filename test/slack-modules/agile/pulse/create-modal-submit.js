/* eslint-env node, mocha */
const { assert } = require('chai');
const { createSlackUser } = require('../../../test-utils');

const db = require(`${process.env.root}/sequelize`);
const pulseSubmit = require('../../../../src/slack-modules/agile/pulse/create/modal-submit');
const slackReq = require('../../../payloads/slack-requests/agile-pulse-create-modal-submit.json');

describe('slack-modules agile:pulse:create submit (modal)', () => {
  beforeEach(async () => {
    await db.PulseChoice.truncate();
    await db.Pulse.truncate();
  });

  it('created successfully', async () => {
    const slackUser = await createSlackUser();
    const response = await pulseSubmit(slackUser, slackReq);
    assert.equal(response.type, 'web.conversations.open');
    assert.include(response.text, 'agile:pulse:browse');
    assert.include(response.text, slackReq.module.params.name);

    const pulse = await db.Pulse.findByPk(response.private_metadata, {
      include: [{ model: db.PulseChoice, attributes: ['id', 'text'] }],
    });

    assert.equal(pulse.name, 'Testing Team');
    assert.equal(pulse.userSlackIds, slackReq.module.params.users.join(','));
    assert.equal(pulse.status, 'paused');
    assert.equal(pulse.interval, 'daily');
    assert.equal(pulse.time, '17:00');
    assert.equal(pulse.dayOfWeek, null);
    assert.equal(pulse.dayOfMonth, null);
    assert.equal(pulse.question, 'Testing is good, yes?');
    assert.equal(pulse.PulseChoices[0].text, 'Test 1');
    assert.equal(pulse.PulseChoices[1].text, 'Test 2');
    assert.equal(pulse.PulseChoices[2].text, 'Test 3');
  });
});
