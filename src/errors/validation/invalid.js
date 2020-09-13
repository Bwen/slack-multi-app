const ValidationError = require('./error');

class InvalidArgumentError extends ValidationError {
  constructor(path, message) {
    super(`Invalid argument for: \`${path}\``);
    this.name = 'InvalidArgumentError';
    this.detail = message;
  }
}

module.exports = InvalidArgumentError;
