var r = require('rethinkdb');

var connection;

r.connect()
  .then(c => {
    console.log('connected!');
    connection = c;
  })
  .then(createTable)
  .then(write)
  .then(read)
  .then(filters)
  .catch(console.error)
  .then(() => {
    console.log('closing connection');
    return connection.close();
  })
  .catch(console.error)

function createTable() {
  console.log('=== create table ===');
  return r.tableDrop('test').run(connection)
    .catch(/* ignore */)
    .then(() => {
      return r.tableCreate('test').run(connection)
        .then(console.log)
    })
}

function write() {
  console.log('=== write ===');
  return r.table('test').insert({ a: 1, b: 2 }).run(connection)
    .then(console.log)
    .then(() => r.table('test').insert([{ a: 10, b: 20 }, { a: 15, b: 30 }]).run(connection))
    .then(console.log)
}

function read() {
  console.log('=== read ===');
  return r.table('test').run(connection)
    .then(e => e.toArray())   // call toArray on cursor result to get all the data
    .then(console.log)
}

function filters() {
  console.log('=== filters ===');
  // basic filtering on exact values
  return r.table('test')
    .filter({ a: 10 })
    .run(connection)
    .then(e => e.toArray())
    .then(console.log)

  // filtering based on row command
    .then(() => {
      return r.table('test')
        .filter(r.row('b').eq(30))
        .run(connection)
    })
    .then(e => e.toArray())
    .then(console.log)
}
