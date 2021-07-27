const { fetchPulses, getSearchQueryFromParams } = require('../helper');

module.exports = async (slackUser, slackReq) => {
  const query = getSearchQueryFromParams(slackReq.module.params);
  const page = slackReq.module.params.page ? slackReq.module.params.page : 0;
  const blocks = await fetchPulses(slackUser, 1, page, slackReq.module.path, query);
  return { blocks };
};
