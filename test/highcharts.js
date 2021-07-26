/* eslint-env node, mocha */
const { assert } = require('chai');

const mock = require('mock-require');
const mockWinstonCreate = require('./mocks/winston');

mock('winston', mockWinstonCreate);
const mockWinston = mockWinstonCreate.createLogger();

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { generateChart } = require('../src/highcharts');

describe('highcharts', () => {
  beforeEach(() => {
    process.env.HIGHCHARTS_SERVER = 'https://highcharts.tst1';
    process.env.SLACK_APP_DOMAIN = 'slack.tst1';
    mockWinston.clearAll();
  });

  afterEach(() => {
    // Clean up  public/volume/test dir
    fs.rmSync(path.resolve(process.env.root, 'public', 'volume', 'test'), { recursive: true, force: true });
  });

  it('returns null of environment variable HIGHCHARTS_SERVER is not set', async () => {
    delete process.env.HIGHCHARTS_SERVER;
    const result = await generateChart(['test'], { test: 'test' });
    assert.isNull(result);
    assert.include(mockWinston.getLastError(), 'HIGHCHARTS_SERVER');
  });

  it('returns null of environment variable SLACK_APP_DOMAIN is not set', async () => {
    delete process.env.SLACK_APP_DOMAIN;
    const result = await generateChart(['test'], { test: 'test' });
    assert.isNull(result);
    assert.include(mockWinston.getLastError(), 'SLACK_APP_DOMAIN');
  });

  it('returns null if any error is thrown', async () => {
    // Error is thrown because we dont pass an array for modulePath
    const result = await generateChart(null, { test: 'test' });
    assert.isNull(result);
    assert.include(mockWinston.getLastError(), 'Cannot read property \'join\' of null');
  });

  it('succeeds, creates image and modulePath folders', async () => {
    const modulePath = ['test', 'success'];
    const data = { test: 'test' };
    const result = await generateChart(modulePath, data);
    assert.isNotNull(result);

    const dataHash = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
    const publicUrlPath = `volume/${modulePath.join('/')}`;
    const publicUrlFilename = `hs-${dataHash}.png`;
    const fileSystemPath = path.resolve(process.env.root, 'public', ...publicUrlPath.split('/'));
    const fullSystemPath = path.resolve(fileSystemPath, publicUrlFilename);

    assert.include(result, `https://${process.env.SLACK_APP_DOMAIN}/${publicUrlPath}/${publicUrlFilename}`);
    assert.isTrue(fs.existsSync(fullSystemPath));
  });
});
