const querystring = require('querystring');
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
function getValueFrom(item) {
  if (Object.prototype.hasOwnProperty.call(item, 'selected_date')) {
    return item.selected_date;
  }

  if (Object.prototype.hasOwnProperty.call(item, 'selected_time')) {
    return item.selected_time;
  }

  if (Object.prototype.hasOwnProperty.call(item, 'selected_option')
      && item.selected_option
      && Object.prototype.hasOwnProperty.call(item.selected_option, 'value')) {
    return item.selected_option.value;
  }

  if (Object.prototype.hasOwnProperty.call(item, 'selected_options')) {
    const values = [];
    const options = item.selected_options;
    for (let i = 0; i < options.length; i += 1) {
      values.push(options[i].value);
    }

    return values;
  }

  if (Object.prototype.hasOwnProperty.call(item, 'selected_users')) {
    return item.selected_users;
  }

  if (Object.prototype.hasOwnProperty.call(item, 'value')) {
    return item.value;
  }

  return null;
}

/**
 * If the field name (block_id) ends with an underscore and a number
 * it will be split into an array of values.
 *
 * Also all module paths from inputs will be stripped
 *
 * @param params
 * @returns {{}}
 */
function convertValueArray(params) {
  const newParams = {};
  for (const [key, value] of Object.entries(params)) {
    if (!key.match(/_[0-9]+$/)) {
      newParams[key] = value;

      // Strip module path from value if any
      if (newParams[key] && typeof newParams[key] === 'string') {
        newParams[key] = value.replace(/^([a-zA-Z0-9]+:.*? )/i, '');
      }

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

function getPathParams(modulePathString) {
  const parts = splitWhitespace(modulePathString);

  // Remove the module path, which is always first
  parts.shift();

  let params = {};
  for (let i = 0; i < parts.length; i += 1) {
    const value = parts[i].replace(/^"/, '').replace(/"$/, '');

    if (value.match(/[a-z0-9._-]+=/i)) {
      params = Object.assign(params, querystring.parse(value));
    } else {
      if (!Object.prototype.hasOwnProperty.call(params, 'values')) {
        params.values = [];
      }

      params.values.push(value);
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

function normalizeValues(key, value) {
  const params = [];

  // eslint-disable-next-line no-param-reassign
  key = key.replace(/^([a-zA-Z0-9]+:.*? )/i, '');

  // If we have a query string as a value we parse it
  if (typeof value === 'string' && value.match(/[&=]/)) {
    // Strip module path from value if any
    let normalizedValue = value.replace(/^([a-zA-Z0-9]+:.*? )/i, '');
    normalizedValue = value.replace(/"/g, '');

    const qs = querystring.parse(normalizedValue);
    // eslint-disable-next-line prefer-const
    for (let [k, v] of Object.entries(qs)) {
      k = k.replace(/^([a-zA-Z0-9]+:.*? )/i, '');
      params[k] = v;
    }
  } else {
    params[key] = value;
  }

  return params;
}

function convertStateToParams(state) {
  const { values } = state;
  const params = {};

  for (const [key, value] of Object.entries(values)) {
    const keys = Object.keys(value);
    if (keys.length > 1) {
      params[key] = {};
      for (const [k, v] of Object.entries(value)) {
        const normalizedValues = normalizeValues(k, getValueFrom(v));

        Object.assign(params[key], normalizedValues);
      }
      continue;
    }

    Object.assign(params, normalizeValues(key, getValueFrom(value[keys[0]])));
  }

  return params;
}

function getCallbackProperties(payload) {
  const coreProperties = {};

  if (Object.prototype.hasOwnProperty.call(payload, 'trigger_id')) {
    coreProperties.triggerId = payload.trigger_id;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'response_url')) {
    coreProperties.responseUrl = payload.response_url;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'responseUrl')) {
    coreProperties.responseUrl = payload.responseUrl;
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

  if (Object.prototype.hasOwnProperty.call(payload, 'messageTS')) {
    coreProperties.messageTS = payload.messageTS;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'container') && Object.prototype.hasOwnProperty.call(payload.container, 'message_ts')) {
    coreProperties.messageTS = payload.container.message_ts;
  }

  return coreProperties;
}

function getDefaultSlack() {
  return {
    module: { path: [], params: {} },
    view: null,
    channelId: null,
    messageTS: 0,
    triggerId: null,
    responseUrl: null,
    isRaw: false,
    isCommand: false,
    isInteraction: false,
    isModalSubmission: false,
  };
}

function getSlackPayload(req) {
  if (req.body && req.body.payload !== undefined) {
    return JSON.parse(req.body.payload);
  }

  return {};
}

function getCoreProperties(req, slackPayload, pathParams) {
  let coreProperties = {};
  if (slackPayload.actions && slackPayload.actions.length) {
    coreProperties.isInteraction = true;
  } else if (slackPayload.view && slackPayload.view.private_metadata) {
    coreProperties.isModalSubmission = true;
  } else if (req.body.text !== undefined) {
    coreProperties.isCommand = true;
  } else if (req.url.match(/\//g).length > 1) {
    coreProperties.isRaw = true;
  }

  coreProperties = Object.assign(coreProperties, getCallbackProperties(slackPayload));
  coreProperties = Object.assign(coreProperties, getCallbackProperties(req.body));
  coreProperties = Object.assign(coreProperties, getCallbackProperties(pathParams));

  if (slackPayload.actions && slackPayload.actions.length && slackPayload.view) {
    coreProperties.view = slackPayload.view;
  }

  return coreProperties;
}

function getModulePathString(req, slackPayload) {
  if (req.url && req.url.match(/\//g).length > 1) {
    const url = new URL(req.url, 'https://temp.tmp');
    return url.pathname.split('/').filter((v) => v != null && v !== '').join(':');
  }

  if (req.body.text !== undefined) {
    return req.body.text;
  }

  if (slackPayload.actions && slackPayload.actions.length) {
    if (Object.prototype.hasOwnProperty.call(slackPayload.actions[0], 'selected_option')) {
      return slackPayload.actions[0].selected_option.value;
    }

    return slackPayload.actions[0].value;
  }

  if (slackPayload.view && slackPayload.view.private_metadata) {
    return slackPayload.view.private_metadata;
  }

  return '';
}

function getModulePathParts(req, modulePathString) {
  const parts = splitWhitespace(modulePathString);
  if (!parts.length) {
    return [];
  }

  return parts.shift().split(':');
}

function getSlackModuleParams(req, slackPayload, pathParams) {
  let params = {};
  if (req.query) {
    params = req.query;
  }

  if (slackPayload.view) {
    params = Object.assign(params, convertStateToParams(slackPayload.view.state));
  } else if (slackPayload.state) {
    params = Object.assign(params, convertStateToParams(slackPayload.state));
  }

  // Check if we have params in private_metadata we add them
  if (slackPayload.view && slackPayload.view.private_metadata) {
    params = Object.assign(params, getPathParams(slackPayload.view.private_metadata));
  }

  params = Object.assign(params, pathParams);

  // Remove core properties
  delete params.channel;
  delete params.channelId;
  delete params.messageTS;
  delete params.triggerId;
  delete params.responseUrl;

  return convertValueArray(params);
}

const logPrefix = 'middleware-slack-module-path: ';
module.exports = (req, res, next) => {
  try {
    req.slack = getDefaultSlack();
    const slackPayload = getSlackPayload(req);
    const modulePathString = getModulePathString(req, slackPayload);
    const pathParams = getPathParams(modulePathString);

    req.slack = Object.assign(req.slack, getCoreProperties(req, slackPayload, pathParams));
    req.slack.module.path = getModulePathParts(req, modulePathString);
    req.slack.module.params = getSlackModuleParams(req, slackPayload, pathParams);
  } catch (error) {
    logger.error(error);
  }

  logger.info(`${logPrefix}Loaded slack path: ${JSON.stringify(req.slack.module)}`);
  next();
};
