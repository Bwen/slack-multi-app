const { Model } = require('sequelize');
const moment = require('moment-timezone');

function getNextPulseDates(pulseTime, timezone, nextPulseDay, increment) {
  const datetime = `${nextPulseDay.format('YYYY-MM-DD')} ${pulseTime}:00`;
  let nextPulseDateTime = moment.tz(datetime, timezone);

  const dates = [];
  while (dates.length < 3) {
    // Exclude weekend days
    if ([6, 7].indexOf(nextPulseDateTime.isoWeekday()) !== -1 && process.env.NODE_ENV !== 'test') {
      nextPulseDateTime = increment(nextPulseDateTime);
      continue;
    }

    dates.push(nextPulseDateTime.clone());
    nextPulseDateTime = increment(nextPulseDateTime);
  }

  return dates;
}

module.exports = (sequelize, DataTypes) => {
  class Pulse extends Model {
    static associate(models) {
      Pulse.belongsTo(models.User, { foreignKey: 'createdBy' });
      Pulse.hasMany(models.PulseChoice, { foreignKey: 'pulse_id' });
    }

    /**
     * Requires the following property to be present
     * Pulse.time
     * Pulse.interval
     * Pulse.dayOfWeek
     * Pulse.dayOfMonth
     * Pulse.User.UserProfile.timezone
     *
     * @returns {*[]}
     */
    getNext3PulseDates() {
      let nextPulseDay = moment();
      nextPulseDay.hours(this.time.split(':')[0]);
      nextPulseDay.minutes(this.time.split(':')[1]);
      nextPulseDay.seconds(0);
      if (this.interval === 'weekly') {
        nextPulseDay = nextPulseDay.day(this.dayOfWeek);
        // If the day of the week is in the past we move to next week
        if (nextPulseDay.diff(moment(), 'days') < 0) {
          nextPulseDay.add(7, 'days');
        }
        return getNextPulseDates(this.time, this.User.UserProfile.timezone, nextPulseDay, (nextPulseDateTime) => nextPulseDateTime.add(7, 'days'));
      } if (this.interval === 'monthly') {
        let increment;
        if (this.dayOfMonth === 0) {
          nextPulseDay = nextPulseDay.endOf('month');
          increment = (nextPulseDateTime) => {
            const incrementedDate = nextPulseDateTime.add(25, 'days').endOf('month');
            incrementedDate.hours(this.time.split(':')[0]);
            incrementedDate.minutes(this.time.split(':')[1]);
            incrementedDate.seconds(0);
            return incrementedDate;
          };
        } else {
          nextPulseDay = nextPulseDay.date(this.dayOfMonth);
          increment = (nextPulseDateTime) => nextPulseDateTime.add(25, 'days').date(this.dayOfMonth);
        }

        return getNextPulseDates(this.time, this.User.UserProfile.timezone, nextPulseDay, increment);
      } if (this.interval === 'daily') {
        if (nextPulseDay.diff(moment(), 'minutes') < 0) {
          nextPulseDay.add(1, 'days');
        }
        return getNextPulseDates(this.time, this.User.UserProfile.timezone, nextPulseDay, (nextPulseDateTime) => nextPulseDateTime.add(1, 'days'));
      }

      return [];
    }
  }

  Pulse.init({
    name: DataTypes.STRING,
    createdBy: DataTypes.INTEGER,
    status: DataTypes.ENUM(['running', 'paused', 'deleted']),
    interval: DataTypes.ENUM(['daily', 'weekly', 'monthly']),
    dayOfWeek: {
      type: DataTypes.INTEGER,
      field: 'day_of_week',
    },
    dayOfMonth: {
      type: DataTypes.INTEGER,
      field: 'day_of_month',
    },
    time: DataTypes.STRING,
    nextPulse: {
      type: DataTypes.INTEGER,
      field: 'next_pulse',
    },
    userSlackIds: {
      type: DataTypes.TEXT,
      field: 'user_slack_ids',
    },
    question: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Pulse',
    tableName: 'pulses',
  });

  return Pulse;
};
