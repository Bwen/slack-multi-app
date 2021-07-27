/* eslint-env node, mocha */
const { assert } = require('chai');
const { createSlackUser } = require('../../../test-utils');

const activity = require(`${process.env.root}/src/slack-modules/admin/users/activity/command`);
const db = require(`${process.env.root}/sequelize`);

describe('slack-modules admin:users:activity', () => {
  beforeEach(async () => {
    await db.UserActivity.truncate();
  });

  it('list is limited to 20 entries but returns total found', async () => {
    const user = await createSlackUser();
    const values = [];
    for (let i = 0; i < 25; i += 1) {
      values.push({
        createdBy: user.id,
        channelId: 'CHANNELID1',
        triggerId: 'TRIGGERID1',
        responseUrl: 'https://response.com/url/slack',
        isCommand: true,
        isInteraction: false,
        isModalSubmission: false,
        path: 'admin:users:activity',
        params: `test=${i}`,
        response: null,
      });
    }
    await db.UserActivity.bulkCreate(values);

    const slackReq = { module: { params: { values: [] } } };
    const result = await activity({}, slackReq);
    assert.equal(result.type, 'renderer.dataList');
    assert.equal(result.data.length, 21); // 21 because of headers
    assert.equal(result.total, 25);
    assert.equal(result.limit, 20);
  });
});
