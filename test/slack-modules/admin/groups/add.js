/* eslint-env node, mocha */
const { assert } = require('chai');

const db = require(`${process.env.root}/sequelize`);
const { MissingArgumentError } = require(`${process.env.root}/src/errors/validation`);
const add = require(`${process.env.root}/src/slack-modules/admin/groups/add/command`);

describe('slack-modules admin:groups:add', () => {
  before(async () => {
    await db.Group.truncate();
  });

  it('throws a validation error if no params', async () => {
    const slackReq = { module: { params: {} } };
    try {
      await add({}, slackReq);
      assert.isTrue(false, 'Should of throw an MissingArgumentError');
    } catch (e) {
      assert.instanceOf(e, MissingArgumentError);
      assert.equal(e.message, 'Missing arguments for: `admin:groups:add`');
    }
  });

  it('creates group successfully', async () => {
    const slackReq = { module: { params: { values: ['test', 'Test Group Description'] } } };
    await add({}, slackReq);
    const groups = await db.Group.findAll({ where: { name: 'test' } });
    assert.equal(1, groups.length);
    assert.equal(groups[0].name, 'test');
    assert.equal(groups[0].description, 'Test Group Description');
  });
});
