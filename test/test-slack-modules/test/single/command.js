// test module to test single responses in test/utils.js
module.exports = async function (slackUser, slackReq) {
  return { type: 'web.views.open' };
};
