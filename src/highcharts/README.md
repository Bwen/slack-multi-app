
## Highcharts helper
Only `generateChart` function is exposed, it will talk to a highcharts server, download the image, save it
and return a url to it.

It is dependent on two environment variables:
- `HIGHCHARTS_SERVER` is the URL of the server, ex: `http://highcharts.local:8020`
- `SLACK_APP_DOMAIN` is the Slack app domain, ex: `slack.ngrok.io`

The `generateChart` function takes two argument, the `modulePath` and the `data`. The module path can usually
be found in the `slackReq.module.path` of your module function. The data is basically what is being sent
to the Highcharts server, you can see examples here https://www.highcharts.com/demo/line-basic by viewing options.

The image chart generated from the Highcharts server will be saved in `public/volume` plus the concatenation of
the module path. It is recommended that the `public/volume` is some kind of persistent storage if your Slack
app is hosted in the cloud. It names the image chart with `hd-` plus the `md5` of the data for the filename.
If the data/md5 image already exists it will not call the Highcharts server.


You can spawn a Highcharts export server locally easily with existing Docker images, there are plenty of them out there,
but I use my own https://github.com/Bwen/highcharts-export-server
