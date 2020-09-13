## Sequelize
There are two ways to sync the models to the database, one of them is `Sequelize.sync(true)`
which **should not** be used in this project. Although that method will create the proper
foreign keys and link tables, it will drop tables making a proper CI/CD difficult.

If you want to create a new Sequelize model you can use the following command:

Ref:
- [Sequelize model](https://sequelize.org/master/manual/migrations.html#creating-the-first-model--and-migration-)
- [Sequelize migration](https://sequelize.org/master/manual/migrations.html#migration-skeleton)
```bash
sequelize model:generate \ 
    --name UserActivity \ 
    --attributes createdBy:string,channelId:string,triggerId:string,responseUrl:string,isCommand:string,isInteraction:string,isModalSubmission:string,path:string,params:string
```
It will create the model and the migration file for you. They will need to be adjusted to add
the proper foreign keys, indexes, etc... In both the model and migration. When creating a
migration or a seed **only use the Sequelize queryInterface**, no raw SQL. The integration tests
are using SQLite as a database to make things easier for CI/CD.

Migrations and Seeds are always ran from the command line before starting the server and
running tests, they are put in the `package.json`'s scripts:
```json
{
  "scripts": {
    "dev": "sequelize db:migrate --env development && sequelize db:seed:all --env development && nodemon node src/",
    "test": "sequelize db:migrate --env test && sequelize db:seed:all --env test && nyc --reporter=html --reporter=text mocha",
    "start": "sequelize db:migrate --env production && sequelize --env production db:seed:all && NODE_ENV=production node src/"
  }
}
```

 