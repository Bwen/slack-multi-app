const logger = require('../logger');
const { splitWhitespace } = require('../utils');

/**
 * Parses a slack entity:
 * example:
 * <@U01880B2JB0|philippe.guilbault>
 * [U01880B2JB0, philippe.guilbault]
 *
 * @param entity
 * @returns {*}
 */
function parseSlackEntity(entity) {
  return entity.replace(/[<@>]+/g, '').split('|');
}

/**
 * Returns the value of the Modal Submission according to their types
 *
 * @param item
 * @returns {string|null|[]|*}
 */
function getModalValue(item) {
  const propName = Object.keys(item)[0];
  if (Object.prototype.hasOwnProperty.call(item[propName], 'selected_date')) {
    return item[propName].selected_date;
  }

  if (Object.prototype.hasOwnProperty.call(item[propName], 'selected_option')) {
    return item[propName].selected_option.value;
  }

  if (Object.prototype.hasOwnProperty.call(item[propName], 'selected_options')) {
    const values = [];
    const options = item[propName].selected_options;
    for (let i = 0; i < options.length; i += 1) {
      values.push(options[i].value);
    }

    return values;
  }

  if (Object.prototype.hasOwnProperty.call(item[propName], 'value')) {
    return item[propName].value;
  }

  return null;
}

/**
 * If the field name (block_id) ends with an underscore and a number
 * it will be split into an array of values
 *
 * @param params
 * @returns {{}}
 */
function convertValueArray(params) {
  const newParams = {};
  // eslint-disable-next-line no-restricted-syntax
  for (const [key, value] of Object.entries(params)) {
    if (!key.match(/_[0-9]+$/)) {
      newParams[key] = value;
      // eslint-disable-next-line no-continue
      continue;
    }

    const parts = key.split('_');
    if (!Object.prototype.hasOwnProperty.call(newParams, parts[0])) {
      newParams[parts[0]] = [];
    }

    newParams[parts[0]].push(value);
  }

  return newParams;
}

function getPathParams(parts) {
  let params = {};
  for (let i = 0; i < parts.length; i += 1) {
    const value = parts[i];
    if (value.match(/[a-z0-9._-]+=/i)) {
      const searchParams = new URLSearchParams(parts.shift());
      params = Object.assign(
        params,
        Object.fromEntries(searchParams),
      );
    } else {
      if (!Object.prototype.hasOwnProperty.call(params, 'values')) {
        params.values = [];
      }

      params.values.push(value.replace(/^"/, '').replace(/"$/, ''));
    }
  }

  if (params.values && params.values.length) {
    params.values = params.values.map((value) => {
      if (value.match(/<@.*?|.*?>/i)) {
        return parseSlackEntity(value)[0];
      }

      return value;
    });
  }

  return params;
}

function getCoreProperties(payload) {
  const coreProperties = {};

  if (Object.prototype.hasOwnProperty.call(payload, 'trigger_id')) {
    coreProperties.triggerId = payload.trigger_id;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'response_url')) {
    coreProperties.responseUrl = payload.response_url;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'channel_id')) {
    coreProperties.channelId = payload.channel_id;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'channel')) {
    if (Object.prototype.hasOwnProperty.call(payload.channel, 'id')) {
      coreProperties.channelId = payload.channel.id;
    } else {
      coreProperties.channelId = payload.channel;
    }
  }

  return coreProperties;
}

const logPrefix = 'middleware-slack-module-path: ';
module.exports = (req, res, next) => {
  if (!req.slack) {
    req.slack = {};
  }

  let modulePath = '';
  req.slack.module = { path: [], params: {} };
  req.slack.view = null;
  req.slack.channelId = null;
  req.slack.triggerId = null;
  req.slack.responseUrl = null;
  req.slack.isCommand = false;
  req.slack.isInteraction = false;
  req.slack.isModalSubmission = false;
  if (req.body) {
    if (req.body.payload !== undefined) {
      try {
        const payload = JSON.parse(req.body.payload);
        req.slack = Object.assign(req.slack, getCoreProperties(payload));

        if (payload.actions && payload.actions.length) {
          modulePath = payload.actions[0].value;
          req.slack.isInteraction = true;
          req.slack.view = payload.view;
        } else if (payload.view && payload.view.private_metadata) {
          modulePath = payload.view.private_metadata;
          req.slack.isModalSubmission = true;
        }
      } catch (error) {
        logger.error(error);
      }
    } else if (req.body.text !== undefined) {
      modulePath = req.body.text;
      req.slack.isCommand = true;
      req.slack = Object.assign(req.slack, getCoreProperties(req.body));
    }
  }

  const parts = splitWhitespace(modulePath);
  if (parts.length) {
    req.slack.module.path = parts.shift().split(':');

    const pathParams = getPathParams(parts);
    req.slack = Object.assign(req.slack, getCoreProperties(pathParams, true));
    delete pathParams.channel;
    delete pathParams.channelId;
    delete pathParams.triggerId;
    delete pathParams.responseUrl;

    if (req.slack.isInteraction || req.slack.isCommand) {
      req.slack.module.params = convertValueArray(pathParams);
    } else if (req.slack.isModalSubmission) {
      const payload = JSON.parse(req.body.payload);
      const { values } = payload.view.state;
      // eslint-disable-next-line no-restricted-syntax
      for (const [key, value] of Object.entries(values)) {
        req.slack.module.params[key] = getModalValue(value);
      }

      req.slack.module.params = Object.assign(req.slack.module.params, pathParams);
      req.slack.module.params = convertValueArray(req.slack.module.params);
    }
  }

  logger.info(`${logPrefix}Loaded slack path: ${JSON.stringify(req.slack.module)}`);
  next();
};
