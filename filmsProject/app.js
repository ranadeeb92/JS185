const {Client} = require('pg');

let client = new Client({ database: 'films', user:'postgres', password:'password'});

async function logQuery(queryText) {
  await client.connect();
  try {
    let data = await client.query(queryText);
    console.log(data.rows[data.rows.length - 1].count);
    client.end();
  } catch(err) {
    console.log(err);
  }
}

logQuery("SELECT count(id) FROM films WHERE duration < 110 GROUP BY genre");
