const ValidationError = require('./error');

class MissingArgumentError extends ValidationError {
  constructor(path, message) {
    super(`Missing arguments for: \`${path}\``);
    this.name = 'MissingArgumentError';
    this.detail = message;
  }
}

module.exports = MissingArgumentError;
