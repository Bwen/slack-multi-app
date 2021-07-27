// eslint-disable-next-line no-unused-vars
module.exports = (slackUser, slackReq) => {
  const response = {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Hello World from `~path~`! :partying_face:',
        },
      },
    ],
  };

  return response;
};
