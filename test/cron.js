/* eslint-env node, mocha */
const { assert } = require('chai');
const mock = require('mock-require');

// TODO: move to test/mocks folder and mock in _beforeAll.test.js
let taskScheduledCount = 0;
mock('node-cron', {
  schedule: () => {
    taskScheduledCount += 1;
  },
});

const path = require('path');

const setupCron = require(`${process.env.root}/src/cron-setup`);

describe('crons', async () => {
  it('invalid cron.js files are excluded', async () => {
    taskScheduledCount = 0;
    await setupCron(path.resolve(__dirname, 'cron-files', 'invalid'));
    assert.equal(taskScheduledCount, 1);
  });
});
