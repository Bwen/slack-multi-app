const path = require('path');
const fs = require('fs');
const got = require('got');
const logger = require('./logger');
const { dataList } = require('./renderer');
const modalErrorValidation = require('./slack-modals/errors/validation.json');
const { ValidationError } = require('./errors/validation');
const { getSlackApi } = require('./wrapper-slack-api');

const web = getSlackApi();
const TEXT_INTERNAL_ERROR = ':skull_and_crossbones: Internal Butt Error :poop:';

function findIndexByBlockId(blockId, blocks) {
  for (let i = 0; i < blocks.length; i += 1) {
    if (Object.prototype.hasOwnProperty.call(blocks[i], 'block_id') && blocks[i].block_id === blockId) {
      return i;
    }
  }

  return null;
}

function findIndexByActionId(actionId, elements) {
  for (let i = 0; i < elements.length; i += 1) {
    if (Object.prototype.hasOwnProperty.call(elements[i], 'action_id') && elements[i].action_id === actionId) {
      return i;
    }
  }

  return null;
}

function getSearchSection(term) {
  if (!term) {
    return null;
  }

  return {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `Searching for *${term}* :face_with_monocle:`,
    },
  };
}

function getPaginationButtons(total, perPage, page, modulePath, term) {
  const paginationButtons = [];
  const pageNumber = parseInt(page, 10);
  const offset = pageNumber * parseInt(perPage, 10);
  const searchTerm = term || '';
  if (pageNumber > 0) {
    paginationButtons.push({
      type: 'button',
      action_id: 'previous',
      text: {
        type: 'plain_text',
        text: 'Previous',
      },
      value: `${modulePath} page=${pageNumber - 1} ${searchTerm}`,
    });
  }

  if ((offset + perPage) < total && total !== 1) {
    paginationButtons.push({
      type: 'button',
      action_id: 'next',
      text: {
        type: 'plain_text',
        text: 'Next',
      },
      value: `${modulePath} page=${pageNumber + 1} ${searchTerm}`,
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
        if (!Object.prototype.hasOwnProperty.call(response, 'channel') || !response.channel) {
          response.channel = req.slack.channelId;
        }
        result = await web.chat.postMessage(response);
      } else if (response.type === 'web.chat.update') {
        delete response.type;
        if (!Object.prototype.hasOwnProperty.call(response, 'channel') || !response.channel) {
          response.channel = req.slack.channelId;
        }

        if (!Object.prototype.hasOwnProperty.call(response, 'ts') || !response.ts) {
          response.ts = req.slack.messageTS;
        }

        result = await web.chat.update(response);
      } else if (response.type === 'web.chat.delete') {
        delete response.type;
        response.ts = req.slack.messageTS;
        response.channel = req.slack.channelId;
        result = await web.chat.delete(response);
      } else if (response.type === 'web.conversations.open') {
        delete response.type;
        const convResult = await web.conversations.open({ users: response.channel });
        if (convResult.ok !== true) {
          logger.error(convResult);
          res.send();
          return;
        }

        response.channel = convResult.channel.id;
        result = await web.chat.postMessage(response);
        res.send();
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

  // TODO: remove result from user activity table, makes the table grow too fast and provide lil benefit
  req.currentActivity.response = JSON.stringify(result);
  await req.currentActivity.save();
}

function getModule(req, modulePath) {
  if (!fs.existsSync(modulePath)) {
    return null;
  }

  try {
    return require(modulePath.toString());
  } catch (e) {
    logger.error(e);
  }

  return null;
}

module.exports = {
  /**
   * Finds the block id in the array and return its index within it.
   *
   * @param blockId
   * @param blocks
   * @returns {number|null}
   */
  findIndexByBlockId: (blockId, blocks) => findIndexByBlockId(blockId, blocks),

  /**
   * Finds the action id in the array and return its index within it.
   *
   * @param actionId
   * @param elements
   * @returns {number|null}
   */
  findIndexByActionId: (actionId, elements) => findIndexByActionId(actionId, elements),

  /**
   *
   * @param term
   * @returns {{text: {text: string, type: string}, type: string}}
   */
  getSearchSection: (term) => getSearchSection(term),

  /**
   * Generates interaction buttons for pagination
   *
   * @param total
   * @param perPage
   * @param page
   * @param modulePath
   * @param params
   * @returns {[]}
   */
  getPaginationButtons: (total, perPage, page, modulePath, params) => getPaginationButtons(
    total,
    perPage,
    page,
    modulePath,
    params,
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

  processSlackResponse,

  processRawRequest: async (req, res, slackModulesPath) => {
    if (!req.slack.isRaw) {
      res.status(404).send();
      return;
    }

    const modulePath = path.resolve(slackModulesPath, ...req.slack.module.path, 'raw.js');
    const module = getModule(req, modulePath);
    if (!module) {
      res.status(404).send();
      return;
    }

    const result = await module(req, res);
    if (result) {
      return;
    }

    res.status(500).send('Oups! It seems there is an error.');
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
   * @param slackModulesPath
   * @returns {Promise<void>}
   */
  processSlackRequest: async (req, res, slackModulesPath) => {
    let filename = 'command.js';
    if (req.slack.isInteraction) {
      filename = 'interactions.js';
    } else if (req.slack.isModalSubmission) {
      filename = 'modal-submit.js';
    }

    try {
      const modulePath = path.resolve(slackModulesPath, ...req.slack.module.path, filename);
      const module = getModule(req, modulePath);
      if (!module) {
        logger.warn(`Module path "${modulePath}" does not exists`);
        res.send();
        return;
      }

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
