## Slack Module System
The system makes it easy to add infinite depth of sub-module paths.

The directory structure for the `poll:create` for example is:
```
slack-modules
    |- poll
        |- browse
        |- create
            |- info.json
            |- command.js
            |- interactions.js
            |- modal-submit.js
            |- raw.js
        |- info
        |- vote
        |- task1-cron.js
        |- task2-cron.js
```

Depending on the Slack payload the system will determine what type 
of events it is and load the appropriate file:
- for a slash command (_`command.js`_)
- for an interaction (_`interactions.js`_)
- for a modal submission (_`modal-submit.js`_)
- for requests that do not come from slack but http directly (_`raw.js`_)
- for a periodic tasks (_`*-cron.js`_)

It also determines where to exactly to load the file in the directory structure. When
the server is started the directory `src/slack-modules` is crawled recursively, and made into a tree
array to be able to match the Slack payload path (_ex: `/myslash admin:users:list`_) against it.

Since it is crawled recursively it is easy to add infinite sub-modules directory depth to your modules.

When a module path is not found the [middleware slack-available-commands](../middlewares/README.md)
will stop the process and return a message to the user. It will also stop the process when
a path does not contain one of the three `js` files and will display the available commands
for that module's depth.

When a module path does not have an `info.json` it will never display it as available commands.
As you can see in the `poll:info` & `poll:vote`, the module path is reachable because they
contain one or more of the three `js` files, but will not display in the available commands.

All the three `js` file type recieve the same arguments and should export as follow:
```javascript
module.exports = async (slackUser, slackReq) => {
  // Some code
}
```

The `slackUser` is constructed by the [middleware current-user](../middlewares/README.md) and is a 
[Sequelize User Model](../../sequelize/README.md) for the current slack user making the request.

The `slackReq` is constructed by the [middleware slack-module-path](../middlewares/README.md) 
and has a json structure, here is an example of poll modal submit:
```json
{
  "module": {
    "path": [ "poll", "create" ],
    "params": {
      "question": "This is a test question",
      "options": [
        "post_anonymous",
        "anonymous_votes",
        "vote_change"
      ],
      "end_date": "2020-08-01",
      "vote_per_user": "2",
      "choice": [
        "Test choice 1",
        "Test choice 2",
        "Test choice 3"
      ]
    }
  },
  "view": null,
  "channelId": "C018ETVMD0T",
  "triggerId": "1344827026497.1310581756160.49f26e69d87cd92f6aa5002fbb290588",
  "responseUrl": null,
  "isCommand": false,
  "isInteraction": false,
  "isModalSubmission": true
}
```

The three `js` files in the module structure need to either return a `string` which will be sent as a
response to the current Slack Call. Or it may return a json, example of possible json structures can be
found in the directory `src/slack-responses/*`. You can load them and alter them with the 
right values for your module call. Remember to always deep copy the initial json,
the best way to accomplish this is the following:
```javascript
let response = JSON.parse(JSON.stringify(jsonResponse));
```
This will avoid artifacts/references from previous requests.

### Periodic tasks (_cron jobs_)
As you may have noticed the files `*-cron.js`, a file ending with `cron.js` will be picked up and scheduled if
it has the following structure:
```javascript
module.exports = {
          // ┌────────────── second (optional)
          // │ ┌──────────── minute
          // │ │ ┌────────── hour
          // │ │ │ ┌──────── day of month
          // │ │ │ │ ┌────── month
          // │ │ │ │ │ ┌──── day of week
          // │ │ │ │ │ │
          // │ │ │ │ │ │
          // * * * * * *
    schedule: '* * * * *', // Execute every minute
    task: () => {
        console.log('Run every minute');
    }
};
```

The property `task` can either be asynchronous or not. The libary used in the backend is [node-cron](https://www.npmjs.com/package/node-cron),
which is well documented.
