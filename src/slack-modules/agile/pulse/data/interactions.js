const moment = require('moment-timezone');

const viewData = require('./views/data.json');

const { findIndexByBlockId } = require(`${process.env.root}/src/utils`);
const { encrypt } = require(`${process.env.root}/src/crypto`);
const { generateChart } = require(`${process.env.root}/src/highcharts`);
const { fetchPulseValues, fetchMemberPulses, fetchPulseForData } = require('../helper');

const logger = require(`${process.env.root}/src/logger`);
const responsePostUrl = require(`${process.env.root}/src/slack-responses/response.url.json`);

function getHighchartsTotalData(pulse, slackUser, values) {
  const isOwner = pulse.User.id === slackUser.id;
  const data = {
    title: { text: pulse.name },
    subtitle: { text: ' ' },
    xAxis: { categories: [] },
    series: [],
  };

  if (isOwner) {
    data.subtitle.text = 'Sum of all participants\' values';
  } else {
    data.subtitle.text = `${slackUser.UserProfile.realName}'s values`;
  }

  const scoreToChoiceId = [];
  pulse.PulseChoices.forEach((choice) => {
    scoreToChoiceId.push(choice.id);
  });

  const totalValues = {};
  values.forEach((value) => {
    const dayMonth = moment.tz(value.datetime, pulse.User.UserProfile.timezone).format('DD-MM');
    if (!Object.prototype.hasOwnProperty.call(dayMonth, totalValues)) {
      totalValues[dayMonth] = [];
    }
    totalValues[dayMonth] += scoreToChoiceId.indexOf(value.choice_id);
  });

  Object.keys(totalValues).forEach((date) => {
    if (data.xAxis.categories.indexOf(date) === -1) {
      data.xAxis.categories.push(date);
    }
  });

  const valueData = Object.values(totalValues).map((score) => parseInt(score, 10));
  data.series.push({
    type: 'column',
    name: 'Total',
    data: valueData,
  });

  if (isOwner) {
    const totalParticipant = pulse.userSlackIds.split(',').length;
    const averageValues = valueData.map((score) => score / totalParticipant);
    data.series.push({
      type: 'spline',
      name: 'Average',
      data: averageValues,
      color: '#EE9F3E',
      marker: {
        lineWidth: 2,
        lineColor: '#EE9F3E',
        fillColor: 'white',
      },
    });
  }

  return data;
}

module.exports = async (slackUser, slackReq) => {
  // If its not the submit interaction we ignore it
  if (!slackReq.module.params.filters) {
    return {};
  }

  const { pulseId } = slackReq.module.params.filters;
  if (!pulseId || parseInt(pulseId, 10) === 0) {
    return {};
  }

  const logPrefix = slackReq.module.path.join(':');
  const pulse = await fetchPulseForData(pulseId);
  if (!pulse) {
    logger.warn(`${logPrefix} pulse info with invalid pulse id: ${pulseId}`);
    return {};
  }

  const { dateStart } = slackReq.module.params.filters;
  const { dateEnd } = slackReq.module.params.filters;
  const values = await fetchPulseValues(pulse, dateStart, dateEnd, slackUser);
  const dataView = JSON.parse(JSON.stringify(viewData));
  const indexPulseIds = findIndexByBlockId('filters', dataView.blocks);
  dataView.blocks[indexPulseIds].elements[2].options = await fetchMemberPulses(slackUser);

  if (process.env.HIGHCHARTS_SERVER) {
    const data = getHighchartsTotalData(pulse, slackUser, values);
    const hsImageUrl = await generateChart(slackReq.module.path, {
      infile: data,
      width: false,
      scale: false,
      constr: 'Chart',
      type: 'image/png',
      async: true,
    });

    if (hsImageUrl !== null) {
      dataView.blocks.push({
        type: 'image',
        block_id: 'chart',
        title: {
          type: 'plain_text',
          text: ' ',
          emoji: true,
        },
        image_url: hsImageUrl,
        alt_text: "Pulse's data chart",
      });
    } else {
      logger.error(`${logPrefix} could not generate highcharts image!`);
    }
  }

  const now = moment();
  const linkExpiry = moment.tz(now.add(5, 'minutes'), pulse.User.UserProfile.timezone).toDate().toString();
  const queryString = `time=${now.unix()}&pulseId=${pulse.id}&dateStart=${dateStart || ''}&dateEnd=${dateEnd || ''}&slackUserId=${slackUser.id}`;
  const encryptedQueryString = encrypt(queryString);
  dataView.blocks.push({
    type: 'context',
    block_id: 'download_link',
    elements: [
      { type: 'mrkdwn', text: `<https://${process.env.SLACK_APP_DOMAIN}/agile/pulse/data/?eqs=${encryptedQueryString}|Download CSV data>` },
      { type: 'mrkdwn', text: `_Link *expires in 5 minutes* at ${linkExpiry}_` },
    ],
  });

  const responseUrl = JSON.parse(JSON.stringify(responsePostUrl));
  responseUrl.json.replace_original = true;
  responseUrl.json.blocks = dataView.blocks;
  return responseUrl;
};
