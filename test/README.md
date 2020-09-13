## Tests
We are using [Mocha](https://mochajs.org/), [Chai](https://www.chaijs.com/) 
and [mock-require](https://github.com/boblauer/mock-require) for the tests. 
To keep the tests simple we are also using [SQLite](https://www.sqlite.org/index.html)
for integration tests. As mentioned in the [Migration Details](../sequelize/README.md),
[SQLite](https://www.sqlite.org/index.html) is the reason why all migrations need to be using
the `queryInterface` only, no raw SQL migrations. As they are ran before starting the tests.

When making integration tests make sure to truncate the tables that you will be using 
in a `before` statement for your tests.


