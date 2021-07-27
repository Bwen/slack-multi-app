/* eslint-env node, mocha */
const { assert } = require('chai');
const pulseCreate = require('../../../../src/slack-modules/agile/pulse/create/command');

describe('slack-modules agile:pulse:create (modal)', () => {
  it('channelId & triggerId set in response & modal open payload', async () => {
    const slackReq = {
      module: { params: {} },
      channelId: 'C018ETVMD0T',
      triggerId: '1299414370183.1310581756160.71911dbd4f23e69eade292b0fc249ab8',
    };
    const response = await pulseCreate({}, slackReq);
    assert.equal(response.type, 'web.views.open');
    assert.match(response.view.private_metadata, /C018ETVMD0T/);
  });
});
