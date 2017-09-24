var r = require('rethinkdb');

var connection;

r.connect()
  .then(c => {
    console.log('connected!');
    connection = c;
  })
  .then(() => {
    console.log('closing connection');
    return connection.close();
  })
  .catch(console.error)
