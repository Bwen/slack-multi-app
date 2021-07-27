const errors = [];
const warnings = [];
const infos = [];
module.exports = {
  createLogger: () => ({
    error: (msg) => { errors.push(msg); },
    warn: (msg) => { warnings.push(msg); },
    info: (msg) => { infos.push(msg); },
    getLastError: () => errors.slice(-1)[0],
    getLastWarning: () => warnings.slice(-1)[0],
    getLastInfo: () => infos.slice(-1)[0],
    clearAll: () => {
      errors.length = 0;
      warnings.length = 0;
      infos.length = 0;
    },
  }),
  format: {
    printf: () => {},
    combine: () => {},
    timestamp: () => {},
    colorize: () => {},
    splat: () => {},
    uncolorize: () => {},
    json: () => {},
  },
  transports: {
    Console: function () {},
  },
};
