const { fetchPoll } = require('../helper');

module.exports = async (slackUser) => ({ blocks: await fetchPoll(slackUser, 1, 0, 'poll:browse') });
