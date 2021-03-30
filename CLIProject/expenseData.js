const { Client } = require("pg");
const { logAndExist } = require('./helpers');

class ExpenseData {
  constructor() {
    this.client = new Client({database : 'expensesDB', 
                              user: 'postgres',
                              password:'password'});

  }

  async connect() {
    await this.client.connect().catch(err => logAndExist(err));
  }

  async discoonect() {
    await this.client.end().catch(err => logAndExist(err));
  }

  async setupDBSchema() {
    await this.setup_schema().catch(err => logAndExist(err));
  }

  async setup_schema() {
    try {
      const CREATE_TABLE_QUERY = `CREATE TABLE expenses (
        id serial PRIMARY KEY,
        amount numeric(6,2) NOT NULL,
        memo text NOT NULL,
        created_on date NOT NULL
      )`;
      let data = await this.client.query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name ='expenses'");
      if(data.rows[0].count == 0) {
        await this.client.query(CREATE_TABLE_QUERY);
      } 
    } catch(err) {
      logAndExist(err);
    }
  }

  static displeyData(data) {
    let count = data.rowCount;
    if(count > 0) {
      let msg = count > 1 ? `There are ${count} expenses` : `There is ${count} expense`;
      console.log(msg);
      let foramtedDate = '';
      let total = 0;
      data.rows.forEach(row => {
        foramtedDate = Object.keys(row).map(key => {
          if(key == 'created_on') {
            return row[key].toDateString().padStart(12);
          } else if(key == 'amount'){
            total += Number(row[key]);
            return `${row[key]}`.padStart(12);
          } else {
            return `${row[key]}`.padStart(12);
          }
        }).join(' | ');
        console.log(foramtedDate);
      });
      if(count > 1) {
        console.log("-".repeat(foramtedDate.length));
        logAndExist(`Total${String(total).padStart(22)}`);
      }else {
        logAndExist('');
      }
    } else {
      logAndExist('There are no expenses');
    }
  }

  async listExpenses() {
    this.connect();
    this.setupDBSchema();
    try {
      let data = await this.client.query('SELECT * FROM expenses ORDER BY created_on ASC');
      ExpenseData.displeyData(data);
    }catch(err) {
      logAndExist(err);
    }
    this.discoonect();
  }

  async addExpense(amount, memo) {
    this.connect();
    this.setupDBSchema();
    try { 
      let queryText = 'INSERT INTO expenses (amount, memo) VALUES ($1, $2)';
      let queryValues = [amount, memo]
      await this.client.query(queryText, queryValues); 
      logAndExist('One expense added!');
    } catch(err) {
      logAndExist(err.stack);
    }
    this.discoonect();
  }

  async searchForExpense(query) {
    this.connect();
    this.setupDBSchema();
    try {
      let queryText = 'SELECT * FROM expenses WHERE memo ILIKE $1';
      let queryValue = [`%${query}%`];
      let data = await this.client.query(queryText, queryValue);
      ExpenseData.displeyData(data);  
    } catch(err) {
      logAndExist(err);
    }
    this.discoonect();
  }

  async selectExpenseById(expenseId) {
    try {
      let queryText = 'SELECT * FROM expenses WHERE id = $1';
      let queryValue = [expenseId];
      let data = await this.client.query(queryText, queryValue);
      return data;
    } catch (err) {
      logAndExist(err);
    }
  }
  
  async deleteExpense(expenseId) {
    this.connect();
    this.setupDBSchema();
    try {
      let data = await this.selectExpenseById(expenseId);
      if(data.rowCount == 1) {
        let queryText = 'DELETE FROM expenses WHERE id = $1';
        let queryValue = [expenseId];
        await this.client.query(queryText, queryValue);
        ExpenseData.displeyData(data);
      } else {
        logAndExist(`There is no expense with the id ${expenseId}`);
      }
    } catch (err) {
      logAndExist(err);
    }
    this.discoonect();
  }

  async deleteAllExpenses() {
    this.connect();
    this.setupDBSchema();
    try {
        await this.client.query('DELETE FROM expenses');
        logAndExist('All expenses have been deleted.');
    } catch (err) {
      logAndExist(err);
    }
    this.discoonect();
  }


}

module.exports = {
  ExpenseData
}