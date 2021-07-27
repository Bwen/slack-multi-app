const db = require(`${process.env.root}/sequelize`);

async function getChoiceIdsForPulse(pulse) {
  const choices = await db.PulseChoice.findAll({
    attributes: ['id'],
    where: { pulseId: pulse.id },
  });

  return choices.map((choice) => choice.id);
}

async function injectRandomValue(slackUser, choiceIds, comment = '', createdAt = null) {
  if (!createdAt) {
    createdAt = new Date();
  }

  const randIndex = Math.floor(Math.random() * choiceIds.length);
  await db.PulseValue.create({
    choiceId: choiceIds[randIndex],
    createdBy: slackUser.id,
    comment,
    createdAt,
  });
}

module.exports = {
  getChoiceIdsForPulse,
  injectRandomValue,
};
