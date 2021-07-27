const { ValidationError } = require(`${process.env.root}/src/errors/validation`);

// test module to test multiple responses in test/utils.js
module.exports = async function (slackUser, slackReq) {
  if (slackReq.module.params.throw === 'error') {
    throw new Error('Generic Test Error');
  } else if (slackReq.module.params.throw === 'validation') {
    throw new ValidationError('Test ValidationError');
  }
};
