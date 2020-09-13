/* eslint-env node, mocha */
const { assert } = require('chai');

const db = require(`${process.env.root}/sequelize`);
const { MissingArgumentError, InvalidArgumentError } = require(`${process.env.root}/src/errors/validation`);
const del = require(`${process.env.root}/src/slack-modules/admin/groups/del/command`);
const { createGroup } = require('../helper');

describe('slack-modules admin:groups:del', () => {
  before(async () => {
    await db.Group.truncate();
  });

  it('throws a validation error if no params', async () => {
    const slackReq = { module: { params: {} } };
    try {
      await del({}, slackReq);
      assert.isTrue(false, 'Should of throw an MissingArgumentError');
    } catch (e) {
      assert.instanceOf(e, MissingArgumentError);
      assert.equal(e.message, 'Missing arguments for: `admin:groups:del`');
    }
  });

  it('throws a validation error if group not found', async () => {
    const slackReq = { module: { params: { values: ['invalid'] } } };
    try {
      await del({}, slackReq);
      assert.isTrue(false, 'Should of throw an InvalidArgumentError');
    } catch (e) {
      assert.instanceOf(e, InvalidArgumentError);
      assert.equal(e.message, 'Invalid argument for: `admin:groups:del`');
      assert.equal(e.detail, 'Group not found `invalid`');
    }
  });

  it('deletes a single group', async () => {
    await createGroup({ name: 'test' });
    const slackReq = { module: { params: { values: ['test'] } } };
    await del({}, slackReq);
    const groups = await db.Group.findAll({ where: { name: 'test' } });
    assert.equal(0, groups.length);
  });

  it('deletes multiple groups', async () => {
    await createGroup({ name: 'test1' });
    await createGroup({ name: 'test2' });
    const slackReq = { module: { params: { values: ['test1', 'test2'] } } };
    await del({}, slackReq);
    const groups = await db.Group.findAll({ where: { description: 'Test Group Description' } });
    assert.equal(0, groups.length);
  });
});
