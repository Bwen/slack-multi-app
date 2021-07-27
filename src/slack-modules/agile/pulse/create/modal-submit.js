const responsePrivateMessage = require(`${process.env.root}/src/slack-responses/web.conversations.open.json`);
const { savePulse } = require('../helper');

module.exports = async (slackUser, slackReq) => {
  const pulse = await savePulse(slackUser, slackReq.module.params);
  const pulseName = slackReq.module.params.name;
  const responseSuccess = JSON.parse(JSON.stringify(responsePrivateMessage));
  responseSuccess.private_metadata = pulse.id; // Purely for testing purposes
  responseSuccess.channel = slackUser.slackId;
  responseSuccess.text = `The pulse "_${slackReq.module.params.name}_" was created successfully *at a paused state*.\n`
        + 'You can access it at any time by using the command:\n'
        + `\`/tt agile:pulse:browse "${pulseName}"\``;

  return responseSuccess;
};
