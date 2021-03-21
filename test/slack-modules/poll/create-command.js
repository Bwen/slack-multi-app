/* eslint-env node, mocha */
const { assert } = require('chai');
const { createSlackUser } = require('../../utils');
const db = require('../../../sequelize');
const pollCreate = require('../../../src/slack-modules/poll/create/command');

describe('slack-modules poll:create (modal)', () => {
  it('channelId & triggerId set in response & modal open payload', async () => {
    const slackReq = {
      module: { params: {} },
      channelId: 'C018ETVMD0T',
      triggerId: '1299414370183.1310581756160.71911dbd4f23e69eade292b0fc249ab8',
    };
    const response = await pollCreate({}, slackReq);
    assert.equal(response.type, 'web.views.open');
    assert.match(response.view.private_metadata, /C018ETVMD0T/);
  });
});

describe('slack-modules poll:create (quick-create)', () => {
  before(async () => {
    await db.PollChoice.truncate();
    await db.Poll.truncate();
  });

  it('exists in database & returns post message payload', async () => {
    const question = 'test poll question';
    const choice1 = 'choice 1';
    const choice2 = 'choice 2';
    const slackReq = {
      module: { params: { values: [question, choice1, choice2] } },
      channelId: 'C018ETVMD0T',
      triggerId: '1299414370183.1310581756160.71911dbd4f23e69eade292b0fc249ab8',
    };
    const slackUser = await createSlackUser();
    const response = await pollCreate(slackUser, slackReq);
    assert.equal(response.type, 'web.chat.postMessage');

    const block = response.blocks.find((b) => {
      if (b.accessory && b.accessory.value && b.accessory.value.match(/^poll:info /)) {
        return true;
      }
      return false;
    });

    const pollId = block.accessory.value.split('=')[1];
    const poll = await db.Poll.findByPk(pollId, {
      include: [{ model: db.PollChoice, attributes: ['id', 'text'] }],
    });

    assert.equal(poll.question, question);
    assert.equal(poll.PollChoices[0].text, choice1);
    assert.equal(poll.PollChoices[1].text, choice2);
    assert.equal(poll.endDate, null);
    assert.equal(poll.postAnonymous, 'no');
    assert.equal(poll.anonymousVotes, 'yes');
    assert.equal(poll.voteChange, 'no');
    assert.equal(poll.votePerUser, 1);
    assert.equal(poll.suggestion, 'no');
  });
});
