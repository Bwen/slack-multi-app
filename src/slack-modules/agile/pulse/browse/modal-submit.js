const db = require(`${process.env.root}/sequelize`);

async function updatePulse(slackUser, params) {
  // Ensure that all users' profile are in the system
  for (const slackUserId of params.members) {
    // eslint-disable-next-line no-unused-vars
    const [user, created] = await db.User.findOrCreate({
      where: { slackId: slackUserId },
      include: [db.Group, db.UserProfile],
    });
    await user.profileCheck(db);
  }

  const pulse = await db.Pulse.findByPk(params.pulseId);
  pulse.userSlackIds = params.members.join(',');
  await pulse.save();

  return pulse;
}

module.exports = async (slackUser, slackReq) => {
  if (slackReq.module.params.modifyMembers) {
    await updatePulse(slackUser, slackReq.module.params);
  }
};
