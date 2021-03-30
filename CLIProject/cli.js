const { ExpenseData } = require('./expenseData');
const { logAndExist } = require('./helpers');
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

class CLI {
  constructor() {
    this.expenseDate = new ExpenseData();
  }

  static HELP() {
    return `An expense recording system

  Commands:
  
  add AMOUNT MEMO [DATE] - record a new expense
  clear - delete all expenses
  list - list all expenses
  delete NUMBER - remove expense with id NUMBER
  search QUERY - list expenses with a matching memo field`;
    
  }

  displayHelp() {
    logAndExist(CLI.HELP());
  }

  

  static confirmUSerInput() {
    readline.question('This will remove all expenses. Are you sure? (enter y to confirm) ', answer => {
      if(answer.toLowerCase() == 'y') {
        console.log(answer);
        CLI.USER_INPUT_VaLIDATION = true;
      } else{
        CLI.USER_INPUT_VaLIDATION = false;
      }
      // readline.close();
    });
  }

  run(args) {
    let command =  args[2];
    switch(command) {
      case 'list':
        this.expenseDate.listExpenses();
        break;
      case 'add':
        let amount = args[3];
        let memo = args[4];
        if(amount && memo) {
          this.expenseDate.addExpense(amount, memo);
        } else {
          logAndExist('You must provide an amount and memo.');
        }
        break;
      case 'search':
        let query = args[3];
        if(query) {
          this.expenseDate.searchForExpense(query);
        } else {
          logAndExist('You must provide a memo to search for');
        }
        break;
      case 'delete':
        let expenseId = args[3];
        if(expenseId) {
          this.expenseDate.deleteExpense(expenseId);
        } else {
          logAndExist('You must provide an expense id');
        }
        break;
      case 'clear':
        readline.question('This will remove all expenses. Are you sure? (enter y to confirm) ', answer => {
          if(answer.toLowerCase() == 'y') {
            this.expenseDate.deleteAllExpenses();
          }
          readline.close();
        });
        break;
      default:
        this.displayHelp();
    }
  }
}

module.exports = {
  CLI
}