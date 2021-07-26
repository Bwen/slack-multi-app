const crypto = require('crypto');
const path = require('path');
const { createWriteStream, existsSync, mkdirSync } = require('fs');
const got = require('got');
const logger = require('../logger');

const logPrefix = 'highcharts:';
function downloadImageTo(url, filenamePath) {
  const downloadStream = got.stream(url);
  const fileWriterStream = createWriteStream(filenamePath);

  downloadStream.on('error', (error) => logger.error(`${logPrefix} Download failed: ${error.message}`));
  fileWriterStream.on('error', (error) => logger.error(`${logPrefix} Could not write file to system: ${error.message}`));
  downloadStream.pipe(fileWriterStream);
}

async function generateChart(modulePath, data) {
  if (!process.env.HIGHCHARTS_SERVER) {
    logger.error(`${logPrefix} HIGHCHARTS_SERVER environment variable not set!`);
    return null;
  }

  if (!process.env.SLACK_APP_DOMAIN) {
    logger.error(`${logPrefix} SLACK_APP_DOMAIN environment variable not set!`);
    return null;
  }

  try {
    const dataHash = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
    const publicUrlPath = `volume/${modulePath.join('/')}`;
    let fileSystemPath = path.resolve(process.env.root, 'public', ...publicUrlPath.split('/'));
    if (!existsSync(fileSystemPath)) {
      mkdirSync(fileSystemPath, { recursive: true });
    }

    const publicUrlFilename = `hs-${dataHash}.png`;
    fileSystemPath = path.resolve(fileSystemPath, publicUrlFilename);
    if (existsSync(fileSystemPath)) {
      return `https://${process.env.SLACK_APP_DOMAIN}/${publicUrlPath}/${publicUrlFilename}`;
    }

    const result = await got.post(process.env.HIGHCHARTS_SERVER, { json: data });
    const urlHighchartsServerImage = `${process.env.HIGHCHARTS_SERVER}/${result.body}`;
    downloadImageTo(urlHighchartsServerImage, fileSystemPath);

    return `https://${process.env.SLACK_APP_DOMAIN}/${publicUrlPath}/${publicUrlFilename}`;
  } catch (err) {
    logger.error(`${logPrefix} ${err.message}`);
  }

  return null;
}

module.exports = {
  generateChart,
};
