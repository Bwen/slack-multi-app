/* eslint-env node, mocha */
const { assert } = require('chai');
const { findIndexByBlockId, findIndexByActionId } = require('../../../../src/utils');
const { createSlackUser } = require('../../../test-utils');
const { savePulse } = require('../../../../src/slack-modules/agile/pulse/helper');
const dataInteraction = require('../../../../src/slack-modules/agile/pulse/data/interactions');
const { injectRandomValue, getChoiceIdsForPulse } = require('./helper');

const db = require(`${process.env.root}/sequelize`);

describe('slack-modules agile:pulse:data interactions', () => {
  beforeEach(async () => {
    process.env.HIGHCHARTS_SERVER = 'https://highcharts.tst1';
    process.env.SLACK_APP_DOMAIN = 'slack.tst1';

    await db.PulseChoice.truncate();
    await db.Pulse.truncate();
    await db.User.truncate();
    await db.PulseValue.truncate();
  });

  it('if no module params filters returns nothing', async () => {
    const slackUser = await createSlackUser();
    const response = await dataInteraction(slackUser, { module: { path: ['agile', 'pulse', 'data'], params: {} } });
    assert.isEmpty(response)
  });

  it('if no invalid filter pulse id returns nothing', async () => {
    const slackUser = await createSlackUser();
    let response = await dataInteraction(slackUser, {
      module: {
        path: ['agile', 'pulse', 'data'],
        params: {
          filters: {},
        },
      },
    });
    assert.isEmpty(response)

    response = await dataInteraction(slackUser, {
      module: {
        path: ['agile', 'pulse', 'data'],
        params: {
          filters: { pulseId: 999 },
        },
      },
    });
    assert.isEmpty(response)
  });

  it('if no HIGHCHARTS_SERVER dont return an image chart in the view', async () => {
    const slackUser = await createSlackUser();
    const pulse = await savePulse(slackUser, {
      name: 'Pulse number 1',
      users: ['U01880B2JB1'],
      time: '16:02',
      interval: 'daily',
      question: 'Pulse Question 2',
      choice: [
        'choice 11',
        'choice 22',
      ],
    });

    const oldHSValue = process.env.HIGHCHARTS_SERVER;
    delete process.env.HIGHCHARTS_SERVER;
    const response = await dataInteraction(slackUser, {
      module: {
        path: ['agile', 'pulse', 'data'],
        params: {
          filters: {
            dateStart: '',
            dateEnd: '',
            pulseId: pulse.id,
          },
        },
      },
    });
    process.env.HIGHCHARTS_SERVER = oldHSValue;

    assert.isNull(findIndexByBlockId('chart', response.json.blocks));
    assert.isNotNull(findIndexByBlockId('download_link', response.json.blocks));
  });

  it('if HIGHCHARTS_SERVER available return an image chart in the view', async () => {
    const slackUser = await createSlackUser();
    const pulse = await savePulse(slackUser, {
      name: 'Pulse number 1',
      users: ['U01880B2JB1'],
      time: '16:02',
      interval: 'daily',
      question: 'Pulse Question 2',
      choice: [
        'choice 11',
        'choice 22',
      ],
    });

    await injectRandomValue(slackUser, await getChoiceIdsForPulse(pulse));
    const response = await dataInteraction(slackUser, {
      module: {
        path: ['agile', 'pulse', 'data'],
        params: {
          filters: {
            dateStart: '',
            dateEnd: '',
            pulseId: pulse.id,
          },
        },
      },
    });

    assert.isNotNull(findIndexByBlockId('chart', response.json.blocks));
    assert.isNotNull(findIndexByBlockId('download_link', response.json.blocks));
  });
});
