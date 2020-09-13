/* eslint-env node, mocha */
const { assert } = require('chai');

const db = require(`${process.env.root}/sequelize`);
const list = require(`${process.env.root}/src/slack-modules/admin/users/list/command`);

describe('slack-modules admin:users:list', () => {
  before(async () => {
    await db.User.truncate();
  });

  it('list is limited to 20 entries but returns total found', async () => {
    const values = [];
    for (let i = 0; i < 25; i += 1) {
      values.push({ slackId: `TEST-SLACKUSERID-${i}` });
    }
    await db.User.bulkCreate(values);

    const slackReq = { module: { params: { values: [] } } };
    const result = await list({}, slackReq);
    assert.equal(result.type, 'renderer.dataList');
    assert.equal(result.data.length, 21); // 21 because of headers
    assert.equal(result.total, 25);
    assert.equal(result.limit, 20);
  });
});
