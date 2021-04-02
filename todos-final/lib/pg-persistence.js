const {dbQuery} = require('./db-query');
const bcrypt = require('bcrypt');

module.exports = class PgPersistence {
  constructor(session) {
    this.username = session.username;
  }

  // Returns a new list of todo lists partitioned by completion status.
  _partitionTodoLists(todoLists) {
    let done = [];
    let undone = [];

    todoLists.forEach(todolist => {
      if(this.isDoneTodoList(todolist)) {
        done.push(todolist);
      } else {
        undone.push(todolist);
      }
    });

    return undone.concat(done);
  }
  // // If the todo list has at least one todo and all of its todos are marked as done
  // // then the todo list is done. Otherwisw, it is undone
  isDoneTodoList(todoList) {
    return todoList.todos.length > 0 && todoList.todos.every(todo => todo.done);
  }

  hasUndoneTodos(todoList) {
    return todoList.todos.some(todo => !todo.done);
  }

  // // Return the list of todo lists sorted br completion status and title(case-insensitive)
  async sortedTodoLists() {
    const ALL_TODOLISTS = "SELECT * FROM todolists" +
                          "  WHERE username = $1" +
                          "  ORDER BY lower(title) ASC";
    const ALL_TODOS =     "SELECT * FROM todos" +
                          "  WHERE username = $1";
  
    let resultTodoLists = dbQuery(ALL_TODOLISTS, this.username);
    let resultTodos = dbQuery(ALL_TODOS, this.username);
    let resultBoth = await Promise.all([resultTodoLists, resultTodos]);
  
    let allTodoLists = resultBoth[0].rows;
    let allTodos = resultBoth[1].rows;
    if (!allTodoLists || !allTodos) return undefined;
  
    allTodoLists.forEach(todoList => {
      todoList.todos = allTodos.filter(todo => {
        return todoList.id === todo.todolist_id;
      });
    });
  
    return this._partitionTodoLists(allTodoLists);
  }

  async sortedTodos(todoList) {
    const FIND_TODOS = "SELECT * FROM todos WHERE todoList_id = $1 AND username = $2 ORDER BY done ASC, lower(title) ASC";
    let results = await dbQuery(FIND_TODOS,todoList.id, this.username);
    
    return results.rows;
  }

  async loadTodoList(todoListId) {
    const FIND_TODOLIST = "SELECT * FROM todolists WHERE id = $1 AND username = $2";
    const FIND_TODOS = "SELECT * FROM todos WHERE todoList_id = $1 AND username = $2";

    let resulttodoList = dbQuery(FIND_TODOLIST, todoListId, this.username);
    let resulttodos = dbQuery(FIND_TODOS, todoListId, this.username);
    let results = await Promise.all([resulttodoList, resulttodos]);

    let todoList = results[0].rows[0]; // a specific todo list
    if(!todoList) return undefined;

    todoList.todos = results[1].rows; // all todos for a specific todolist
    return todoList;
  };

  // // Find a todo with the indicated ID in the indicated todo list. Returns
  // // `undefined` if not found. Note that both `todoListId` and `todoId` must be
  // // numeric.
  async loadTodo(todoListId, todoId) {
    const FIND_TODO = "SELECT * FROM todos WHERE todoList_id = $1 AND id = $2 AND username = $3";

    let result = await dbQuery(FIND_TODO, todoListId, todoId, this.username);
    return result.rows[0];
  }

  // // Toggle a todo between the done and not done state.
  // // Returns 'true' on success, `false` if the todo list doesn't exist.
  // // The id arguments must both be numeric.
  async toggleDoneTodo(todoListId, todoId) {
    const TOGGLE_DONE = "UPDATE todos SET done = Not done WHERE todoList_id = $1 AND id = $2 AND username = $3";

    let results = await dbQuery(TOGGLE_DONE, todoListId, todoId, this.username);
    return results.rowCount > 0;
  }

  // // Delete the specified todo from the specified todo list.
  // // Returns `true` on success, `false` if the todo or todo list doesn't exist
  // // The id arguments must both be numeric

  async deleteTodo(todoListId, todoId) {
    const DELETE_TODO = "DELETE FROM todos WHERE todoList_id = $1 AND id = $2 AND username = $3";

    let result = await dbQuery(DELETE_TODO, todoListId, todoId, username);
    return result.rowCount > 0;
  }

  async deleteTodoList(todoListId) {
    const DELETE_TODOLIST = "DELETE FROM todolists WHERE id = $1 AND username = $2";
    let result = await dbQuery(DELETE_TODOLIST, todoListId, this.username);
    return result.rowCount > 0;
  }

  async completeAllTodos(todoListId) {
    const COMPLETE_ALL = "UPDATE todos SET done = true WHERE todoList_id = $1 AND NOT done AND username = $2";
    let result = await dbQuery(COMPLETE_ALL, todoListId, this.username);
    return result.rowCount > 0;
  }

  async createTodo(title, todoListId) {
    const CREATE_TODO = "INSERT INTO todos (title, todoList_id, username) VALUES ($1, $2, $3)";

    let result = await dbQuery(CREATE_TODO, title, todoListId, this.username);
    return result.rowCount > 0;
  }

  async editTodoList(newTitle, todoListId) {
    const EDIT_TODOLIST = "UPDATE todolists SET title = $1 WHERE id = $2 AND username = $3";
    let result = await dbQuery(EDIT_TODOLIST, newTitle, todoListId,this.username);
    return result.rowCount > 0;
  }

  async createTodoList(todoListTitle) {
    const CREATE_TODOLIST = "INSERT INTO todolists (title, username) VALUES ($1, $2)";
    try {
      let result = await dbQuery(CREATE_TODOLIST, todoListTitle, this.username);
      return result.rowCount > 0;
    } catch (error) {
      if (this.isUniqueConstraintViolation(error)) return false;
      throw error;
    }

  }

  isUniqueConstraintViolation(error) {
    return /duplicate key value violates unique constraint/.test(String(error));
  }

  async existsTodoListTitle(title) {
    let FIND_TODOLISTS = "SELECT * FROM todolists WHERE title = $1 AND username = $2";
    let results = await dbQuery(FIND_TODOLISTS, title, this.username);
    return results.rowCount > 0;
  }

  async authenticate(username, password) {
    const FIND_USER = "SELECT password FROM users WHERE username = $1";

    let result = await dbQuery(FIND_USER, username);
    if(result.rowCount == 0 ) return false;

    return bcrypt.compare(password, result.rows[0].password);
  }


};