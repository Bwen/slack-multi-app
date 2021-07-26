require('dotenv').config();
const crypto = require('crypto');

const algorithm = 'aes-256-ctr';
const secretKey = process.env.SLACK_SIGNING_SECRET;
const iv = crypto.randomBytes(16);

const encrypt = (text) => {
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

  return `${iv.toString('hex')}.${encrypted.toString('hex')}`;
};

const decrypt = (hash) => {
  const [ivp, content] = hash.split('.');
  const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(ivp, 'hex'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(content, 'hex')), decipher.final()]);

  return decrypted.toString();
};

module.exports = {
  encrypt,
  decrypt,
};
