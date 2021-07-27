const db = require(`${process.env.root}/sequelize`);

async function createSlackUser(options) {
  // eslint-disable-next-line no-unused-vars
  const [user, userCreated] = await db.User.findOrCreate({
    where: { slackId: options ? options.slackId : 'TESTSLACKUSERID1' },
    include: [db.Group, db.UserProfile],
  });

  // eslint-disable-next-line no-unused-vars
  const [profile, profileCreated] = await db.UserProfile.findOrCreate({
    where: { userId: user.id },
    defaults: {
      userId: user.id,
      avatarHash: 'test',
      statusText: 'test',
      statusEmoji: ':test:',
      statusExpiration: 0,
      realName: 'test',
      displayName: 'test',
      email: 'test@email.com',
      team: 'team-test',
      imageOriginal: 'original.png',
      image24: 'test24.png',
      image32: 'test32.png',
      image48: 'test48.png',
      image72: 'test72.png',
      image192: 'test192.png',
      image512: 'test512.png',
    },
  });
  user.UserProfile = profile;

  return user;
}

module.exports = {
  createSlackUser,
};
