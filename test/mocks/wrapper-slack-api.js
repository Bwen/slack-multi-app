const mockedSlackCalls = [];
let profileCalled = false;
module.exports = {
  resetCalls: () => { mockedSlackCalls.length = 0; },
  getCalls: () => mockedSlackCalls,
  isProfileCalled: () => profileCalled,
  getSlackApi: () => ({
    views: {
      open: async (response) => new Promise((resolve) => {
        mockedSlackCalls.push('web.views.open');
        resolve();
      }),
      update: async (response) => new Promise((resolve) => {
        mockedSlackCalls.push('web.views.update');
        resolve();
      }),
    },
    chat: {
      postMessage: async (response) => new Promise((resolve) => {
        mockedSlackCalls.push('web.chat.postMessage');
        resolve();
      }),
      update: async (response) => new Promise((resolve) => {
        mockedSlackCalls.push('web.chat.update');
        resolve();
      }),
      delete: async (response) => new Promise((resolve) => {
        mockedSlackCalls.push('web.chat.delete');
        resolve();
      }),
      postEphemeral: async (response) => new Promise((resolve) => {
        mockedSlackCalls.push('web.chat.postEphemeral');
        resolve();
      }),
    },
    conversations: {
      open: async (response) => new Promise((resolve) => {
        mockedSlackCalls.push('web.conversations.open');
        resolve({ ok: true, channel: { id: 123 } });
      }),
    },
    users: {
      info: async () => new Promise((resolve) => {
        profileCalled = true;
        resolve({
          user: {
            tz: 'UTC',
            tz_offset: '+0',
            profile: {
              avatar_hash: 'test',
              status_text: 'test',
              status_emoji: ':test:',
              status_expiration: 0,
              real_name: 'test',
              display_name: 'test',
              email: 'test@email.com',
              team: 'team-test',
              image_original: 'original.png',
              image_24: 'test24.png',
              image_32: 'test32.png',
              image_48: 'test48.png',
              image_72: 'test72.png',
              image_192: 'test192.png',
              image_512: 'test512.png',
            },
          },
        });
      }),
    },
  }),
};
