const viewData = require('./views/data.json');

const { findIndexByBlockId } = require(`${process.env.root}/src/utils`);
const { fetchMemberPulses } = require('../helper');

module.exports = async (slackUser) => {
  const dataView = JSON.parse(JSON.stringify(viewData));
  const indexPulseIds = findIndexByBlockId('filters', dataView.blocks);
  dataView.blocks[indexPulseIds].elements[2].options = await fetchMemberPulses(slackUser);
  return dataView;
};
