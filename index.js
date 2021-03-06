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
  .then(complex)
  .then(updates)
  .catch(console.error)
  .then(() => {
    console.log('closing connection');
    return connection.close();
  })
  .catch(console.error)

function createTable() {
  console.log('=== create table ===');
  return r.tableList()
    .run(connection)
    .then(e => {
      if (e.indexOf('test') !== -1) {
        console.log('dropping old table');
        return r.tableDrop('test').run(connection)
      }
    })
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

function complex() {
  console.log('=== complex ===');

  return r.table('test')
    .insert({
      c: 1,
      arr: [2, 3, 4],
      nested: {
        a: 1,
        b: 2,
        c: 3,
        d: 5,
      }
    })
    .run(connection)
    .then(e => console.log(e.generated_keys[0]))
    .then(filterInArray)
    .then(filterNested)

  function filterInArray() {
    return r.table('test')
      .filter((item) => {
        return item('arr').contains(3)
      })
      .run(connection)
      .then(e => e.toArray())
      .then(console.log)
  }

  function filterNested() {
    return r.table('test')
      .filter({
        nested: {
          d: 5
        }
      })
      .run(connection)
      .then(e => e.toArray())
      .then(console.log)
  }
}

function updates() {
  console.log('=== udpates ===');
  return r.table('test')
    .insert({ id: 1, a: 100, b: { nested: 1 }, c: [1] })
    .run(connection)

    .then(() => {
      console.log('set a=101');
      return r.table('test')
        .get(1)
        .update({
          a: 101
        })
        .run(connection)
        .then(() => r.table('test').get(1).run(connection))
        .then(console.log);
    })

    .then(() => {
      console.log('increment a (to 102)');
      return r.table('test')
        .get(1)
        .update({
          a: r.row('a').add(1)
        })
        .run(connection)
        .then(() => r.table('test').get(1).run(connection))
        .then(console.log);
    })

    .then(() => {
      console.log('update b.nested = a');
      return r.table('test')
        .get(1)
        .update({
          b: {
            nested: r.row('a')
          }
        })
        .run(connection)
        .then(() => r.table('test').get(1).run(connection))
        .then(console.log);
    })

    .then(() => {
      console.log('add element to array c');
      return r.table('test')
        .get(1)
        .update({
          c: r.row('c').append(2)
        })
        .run(connection)
        .then(() => r.table('test').get(1).run(connection))
        .then(console.log);
    })

    .then(() => {
      console.log('update 1st element in array c to 200, change 2nd via append/delete');
      return r.table('test')
        .get(1)
        .update({
          c: r.row('c').append(3).changeAt(0, 200).deleteAt(1)
        })
        .run(connection)
        .then(() => r.table('test').get(1).run(connection))
        .then(console.log);
    })
}
