/* eslint-env node, mocha */
const { assert } = require('chai');
const slackModulePath = require('../../src/middlewares/slack-module-path');
const commandPollCreate = require('../payloads/express/poll-create-command.json');
const actionPollVote = require('../payloads/express/poll-vote-interaction.json');
const submissionPollCreate = require('../payloads/express/poll-create-modal-submit.json');

let nextCalled = false;
const mockNext = () => { nextCalled = true; };

describe('slack-module-path (invalid)', () => {
  it('sets default req.slack.module.path empty body', () => {
    const req = {};
    nextCalled = false;
    slackModulePath(req, { body: {} }, mockNext);
    assert.sameOrderedMembers([], req.slack.module.path);
    assert.deepEqual({}, req.slack.module.params);
    assert.isNull(req.slack.channelId);
    assert.isNull(req.slack.responseUrl);
    assert.isNull(req.slack.triggerId);
    assert.isFalse(req.slack.isModalSubmission);
    assert.isFalse(req.slack.isCommand);
    assert.isFalse(req.slack.isInteraction);
    assert.isTrue(nextCalled);
  });

  it('sets default req.slack.module.path no body', () => {
    const req = {};
    nextCalled = false;
    slackModulePath(req, {}, mockNext);
    assert.sameOrderedMembers([], req.slack.module.path);
    assert.deepEqual({}, req.slack.module.params);
    assert.isNull(req.slack.channelId);
    assert.isNull(req.slack.responseUrl);
    assert.isNull(req.slack.triggerId);
    assert.isFalse(req.slack.isModalSubmission);
    assert.isFalse(req.slack.isCommand);
    assert.isFalse(req.slack.isInteraction);
    assert.isTrue(nextCalled);
  });

  it('sets default req.slack.module.path bad json payload', () => {
    const req = { body: { payload: '{in{valid}' } };
    nextCalled = false;
    slackModulePath(req, {}, mockNext);
    assert.sameOrderedMembers([], req.slack.module.path);
    assert.deepEqual({}, req.slack.module.params);
    assert.isNull(req.slack.channelId);
    assert.isNull(req.slack.responseUrl);
    assert.isNull(req.slack.triggerId);
    assert.isFalse(req.slack.isModalSubmission);
    assert.isFalse(req.slack.isCommand);
    assert.isFalse(req.slack.isInteraction);
    assert.isTrue(nextCalled);
  });
});

describe('slack-module-path (isCommand)', () => {
  it('parses extra array params to slack.module.params.values', () => {
    const req = { body: { text: 'poll:create "Some Poll Question" "Choice test 1" "Choice test 2" "Choice test 3"' } };
    nextCalled = false;
    slackModulePath(req, {}, mockNext);
    assert.sameOrderedMembers(['poll', 'create'], req.slack.module.path);
    assert.deepEqual({
      values: [
        'Some Poll Question',
        'Choice test 1',
        'Choice test 2',
        'Choice test 3',
      ],
    }, req.slack.module.params);
    assert.isNull(req.slack.channelId);
    assert.isNull(req.slack.responseUrl);
    assert.isNull(req.slack.triggerId);
    assert.isTrue(req.slack.isCommand);
    assert.isFalse(req.slack.isInteraction);
    assert.isFalse(req.slack.isModalSubmission);
    assert.isTrue(nextCalled);
  });

  it('sets proper req.slack.module.path payloads: poll:create', () => {
    const req = { body: commandPollCreate };
    nextCalled = false;
    slackModulePath(req, {}, mockNext);
    assert.sameOrderedMembers(['poll', 'create'], req.slack.module.path);
    assert.deepEqual({}, req.slack.module.params);
    assert.equal(req.slack.channelId, 'C018ETVMD0T');
    assert.equal(req.slack.responseUrl, 'https://hooks.slack.com/commands/T0194H3N84Q/1307426683910/gs8cONBuwHm4ABB2EIkazqKI');
    assert.equal(req.slack.triggerId, '1299414370183.1310581756160.71911dbd4f23e69eade292b0fc249ab8');
    assert.isTrue(req.slack.isCommand);
    assert.isFalse(req.slack.isInteraction);
    assert.isFalse(req.slack.isModalSubmission);
    assert.isTrue(nextCalled);
  });

  it('sets default req.slack.module.path empty string as path', () => {
    const req = { body: { text: '' } };
    nextCalled = false;
    slackModulePath(req, {}, mockNext);
    assert.sameOrderedMembers([], req.slack.module.path);
    assert.deepEqual({}, req.slack.module.params);
    assert.isNull(req.slack.channelId);
    assert.isNull(req.slack.responseUrl);
    assert.isNull(req.slack.triggerId);
    assert.isTrue(req.slack.isCommand);
    assert.isFalse(req.slack.isModalSubmission);
    assert.isFalse(req.slack.isInteraction);
    assert.isTrue(nextCalled);
  });
});

describe('slack-module-path (isModalSubmission)', () => {
  it('sets proper req.slack.module.path for payloads: poll:create', () => {
    const req = { body: { payload: JSON.stringify(submissionPollCreate) } };
    nextCalled = false;
    slackModulePath(req, {}, mockNext);
    assert.sameOrderedMembers(['poll', 'create'], req.slack.module.path);
    assert.deepEqual({
      choice: [
        'Test choice 1',
        'Test choice 2',
        'Test Choice 3',
      ],
      end_date: '2020-08-01',
      options: [
        'post_anonymous',
        'anonymous_votes',
        'vote_change',
      ],
      question: 'This is a test question',
      vote_per_user: '2',
    }, req.slack.module.params);
    assert.isNull(req.slack.responseUrl);
    assert.equal(req.slack.channelId, 'C018ETVMD0T');
    assert.equal(req.slack.triggerId, '1341966596673.1310581756160.a84c5176ac244bd54a57969b95182a87');
    assert.isTrue(req.slack.isModalSubmission);
    assert.isFalse(req.slack.isCommand);
    assert.isFalse(req.slack.isInteraction);
    assert.isTrue(nextCalled);
  });
});

describe('slack-module-path (isInteraction)', () => {
  it('sets proper req.slack.module.path for payloads: poll:vote', () => {
    const req = { body: { payload: JSON.stringify(actionPollVote) } };
    nextCalled = false;
    slackModulePath(req, {}, mockNext);
    assert.sameOrderedMembers(['poll', 'vote'], req.slack.module.path);
    assert.deepEqual({ pollId: '98', choiceId: '198' }, req.slack.module.params);
    assert.equal(req.slack.responseUrl, 'https://hooks.slack.com/actions/T0194H3N84Q/1326803576961/2kFGaNin2q1aByqSNlJB0qBY');
    assert.equal(req.slack.triggerId, '1314383696035.1310581756160.e42907c29e77c61fca10978b6e7ca270');
    assert.isTrue(req.slack.isInteraction);
    assert.isFalse(req.slack.isCommand);
    assert.isFalse(req.slack.isModalSubmission);
    assert.isTrue(nextCalled);
  });
});
