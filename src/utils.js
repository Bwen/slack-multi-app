const path = require('path');
const fs = require('fs');
const got = require('got');
const logger = require('./logger');
const { dataList } = require('./renderer');
const modalErrorValidation = require('./slack-modals/errors/validation.json');
const { ValidationError } = require('./errors/validation');
const { getSlackApi } = require('./wrapper-slack-api');

const web = getSlackApi();
const slackModulesPath = path.resolve(__dirname, 'slack-modules');
const TEXT_INTERNAL_ERROR = ':skull_and_crossbones: Internal Butt Error :poop:';

function getPaginationButtons(total, perPage, page, modulePath) {
  const paginationButtons = [];
  const pageNumber = parseInt(page, 10);
  const offset = pageNumber * parseInt(perPage, 10);
  if (pageNumber > 0) {
    paginationButtons.push({
      type: 'button',
      action_id: 'previous',
      text: {
        type: 'plain_text',
        text: 'Previous',
      },
      value: `${modulePath} page=${pageNumber - 1}`,
    });
  }

  if ((offset + perPage) < total) {
    paginationButtons.push({
      type: 'button',
      action_id: 'next',
      text: {
        type: 'plain_text',
        text: 'Next',
      },
      value: `${modulePath} page=${pageNumber + 1}`,
    });
  }

  return paginationButtons;
}

async function processSlackResponse(req, res, response) {
  let result = null;
  try {
    if (response.type && response.type.match(/^web\./)) {
      if (response.type === 'web.views.open') {
        delete response.type;
        response.trigger_id = req.slack.triggerId;
        result = await web.views.open(response);
      } else if (response.type === 'web.views.update') {
        delete response.type;
        result = await web.views.update(response);
      } else if (response.type === 'web.chat.postMessage') {
        delete response.type;
        response.channel = req.slack.channelId;
        result = await web.chat.postMessage(response);
      } else if (response.type === 'web.chat.update') {
        delete response.type;
        response.channel = req.slack.channelId;
        response.ts = req.slack.messageTS;
        result = await web.chat.update(response);
      }
    } else if (response.type && response.type === 'response.url') {
      delete response.type;
      result = await got.post(req.slack.responseUrl, response).body;
    } else if (response.type && response.type.match(/^renderer\./)) {
      if (response.type === 'renderer.dataList') {
        const list = dataList(res, req.slack, response.data);
        let extra = '';
        if (response.limit < response.total) {
          extra = `\n\`${response.limit} of ${response.total} entries\`, try filtering the result down.`;
        }
        res.send(`${list}${extra}`);
      }
    } else {
      res.json(response);
      result = null;
    }
  } catch (e) {
    logger.error(e);

    const { stack } = e;
    await web.chat.postEphemeral({
      channel: req.slack.channelId,
      user: req.currentUser.slackId,
      icon_emoji: ':skull:',
      text: `${TEXT_INTERNAL_ERROR}\n\`\`\`${stack}\`\`\``,
    });
    result = stack;
  }

  req.currentActivity.response = JSON.stringify(result);
  await req.currentActivity.save();
}

module.exports = {
  /**
   * Generates interaction buttons for pagination
   *
   * @param total
   * @param perPage
   * @param page
   * @param modulePath
   * @returns {[]}
   */
  getPaginationButtons: (total, perPage, page, modulePath) => getPaginationButtons(
    total,
    perPage,
    page,
    modulePath,
  ),

  /**
   * Splits a string on whitespace avoiding to split the whitespace
   * that are wrapped within double quotes.
   *
   * @returns Array
   * @param text
   */
  splitWhitespace: (text) => {
    if (!text) {
      return [];
    }

    return text.match(/(".*?"|[^"\s]+)+(?=\s*|\s*$)/g);
  },

  /**
   * Process a express js request and calls the proper Slack Module,
   * Needs to go through the following middleware:
   * - current-user
   * - slack-module-path
   * - slack-available-commands
   *
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  processSlackRequest: async (req, res) => {
    let filename = 'command.js';
    if (req.slack.isInteraction) {
      filename = 'interactions.js';
    } else if (req.slack.isModalSubmission) {
      filename = 'modal-submit.js';
    }

    const modulePath = path.resolve(slackModulesPath, ...req.slack.module.path, filename);
    if (!fs.existsSync(modulePath)) {
      logger.warn(`Module path "${modulePath}" does not exists`);
      res.send();
      return;
    }

    try {
      const module = require(modulePath.toString());
      const result = await module(req.currentUser, req.slack);
      if (result === undefined) {
        res.send();
        return;
      }

      const responses = JSON.parse(JSON.stringify(result));
      if (Array.isArray(responses)) {
        const promises = responses.map(async (response) => {
          await processSlackResponse(req, res, response);
        });
        await Promise.all(promises);
      } else {
        await processSlackResponse(req, res, responses);
      }
    } catch (e) {
      if (e instanceof ValidationError) {
        const modalError = JSON.parse(JSON.stringify(modalErrorValidation));
        const infoPath = path.resolve(slackModulesPath, ...req.slack.module.path, 'info.json');
        let usage = `Missing ${infoPath.toString()} file`;
        if (fs.existsSync(infoPath)) {
          usage = require(infoPath).usage;
        }

        const msg = e.message; // Removes ascii color codes from text
        logger.warn(e);

        modalError.blocks[0].text.text = `:warning: ${msg}`;
        modalError.blocks[1].elements[0].text = e.detail;
        modalError.blocks[2].text.text = `*Available Usage:*\n\`\`\`${usage}\`\`\``;
        if (e.detail === undefined) {
          const messageBlock = modalError.blocks.shift();
          modalError.blocks.shift();
          modalError.blocks.unshift(messageBlock);
        }

        await web.views.open({
          trigger_id: req.slack.triggerId,
          view: modalError,
        });
      } else {
        logger.error(e);
        await web.chat.postEphemeral({
          channel: req.slack.channelId,
          user: req.currentUser.slackId,
          icon_emoji: ':skull:',
          text: `${TEXT_INTERNAL_ERROR}\n\`\`\`${e.stack}\`\`\``,
        });
      }
    }

    res.send();
  },
};
