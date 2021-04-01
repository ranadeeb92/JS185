const {Client} = require('pg');

const logQuery = (statement, parameters) => {
  let timeStamp = new Date();
  let foramttedTimeStamp = timeStamp.toString().substring(4, 24);
  console.log(foramttedTimeStamp, statement, parameters);
}

module.exports = {
  async dbQuery(statement, ...parameters) {
    let client = new Client({database: 'todo-lists', 
                              user: 'postgres', 
                              password: 'password'});
    await client.connect();
    logQuery(statement, parameters);
    let results = await client.query(statement, parameters);
    await client.end();

    return results;

  }
}