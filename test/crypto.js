/* eslint-env node, mocha */
const { assert } = require('chai');
const { encrypt, decrypt } = require('../src/crypto');

describe('crypto', () => {
  it('verify that decrypt works correctly', () => {
    const hash = 'd1dc9bd5a51f60370407d8639ef43fa3.e4be1d1aa6b8d99f6619855d70b5ba21881ff35dfdd933227d8c7155c51bd48f0868d61ef074d6f8a319de0dff981cec489fad168843307c3585d9bd8787e1021e824260a469e110380200f481f878101afd03';
    assert.equal(decrypt(hash), 'time=1622111115&pulseId=4&currentUserSlackId=U01880B2JB0&start=1&end=2&export=chart');
  });

  it('verify that encrypt works correctly', () => {
    const text = 'time=1622111115&pulseId=4&currentUserSlackId=U01880B2JB0&start=1&end=2&export=chart';
    const hash = encrypt(text);
    assert.equal(decrypt(hash), text);
  });
});
