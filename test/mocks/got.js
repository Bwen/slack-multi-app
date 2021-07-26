let urlPosted = null;
module.exports = {
  getPostUrl: () => urlPosted,
  post: async (url) => new Promise((resolve) => {
    urlPosted = url;
    resolve({ body: 'test body' });
  }),
  stream: () => ({
    on: () => {},
    pipe: () => {},
  }),
};
