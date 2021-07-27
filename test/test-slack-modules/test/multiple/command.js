// test module to test multiple responses in test/utils.js
module.exports = async function (slackUser, slackReq) {
  return [
    { type: 'web.views.open' },
    { type: 'web.views.update' },
  ];
};
