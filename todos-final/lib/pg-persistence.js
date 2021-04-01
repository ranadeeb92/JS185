const { restart } = require('nodemon');
const {dbQuery} = require('./db-query');

module.exports = class PgPersistence {
  constructor(session) {
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
    const ALL_TODOLISTS = "SELECT * FROM todolists ORDER BY lower(title) ASC";
    const ALL_TODOS = "SELECT * FROM todos WHERE todoList_id = $1";

    let results = await dbQuery(ALL_TODOLISTS);
    let todoLists = results.rows;
    for(let index = 0; index < todoLists.length; index++) {
      let todoList = todoLists[index];
      let todos = await dbQuery(ALL_TODOS, todoList.id);
      todoList.todos = todos.rows;
    }

    return this._partitionTodoLists(todoLists);

  }

  async sortedTodos(todoList) {
    const FIND_TODOS = "SELECT * FROM todos WHERE todoList_id = $1 ORDER BY done ASC, lower(title) ASC";
    let results = await dbQuery(FIND_TODOS,todoList.id);
    
    return results.rows;
  }

  async loadTodoList(todoListId) {
    const FIND_TODOLIST = "SELECT * FROM todolists WHERE id = $1";
    const FIND_TODOS = "SELECT * FROM todos WHERE todoList_id = $1";

    let resulttodoList = dbQuery(FIND_TODOLIST, todoListId);
    let resulttodos = dbQuery(FIND_TODOS, todoListId);
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
    const FIND_TODO = "SELECT * FROM todos WHERE todoList_id = $1 AND id = $2";

    let result = await dbQuery(FIND_TODO, todoListId, todoId);
    return result.rows[0];
  }

  // // Toggle a todo between the done and not done state.
  // // Returns 'true' on success, `false` if the todo list doesn't exist.
  // // The id arguments must both be numeric.
  async toggleDoneTodo(todoListId, todoId) {
    const TOGGLE_DONE = "UPDATE todos SET done = Not done WHERE todoList_id = $1 AND id = $2";

    let results = await dbQuery(TOGGLE_DONE, todoListId, todoId);
    return results.rowCount > 0;
  }

  // // Delete the specified todo from the specified todo list.
  // // Returns `true` on success, `false` if the todo or todo list doesn't exist
  // // The id arguments must both be numeric

  async deleteTodo(todoListId, todoId) {
    const DELETE_TODO = "DELETE FROM todos WHERE todoList_id = $1 AND id = $2";

    let result = await dbQuery(DELETE_TODO, todoListId, todoId);
    return result.rowCount > 0;
  }

  async deleteTodoList(todoListId) {
    const DELETE_TODOLIST = "DELETE FROM todoLists WHERE id = $1";
    let result = await dbQuery(DELETE_TODOLIST, todoListId);
    return result.rowCount > 0;
  }

  async completeAllTodos(todoListId) {
    const COMPLETE_ALL = "UPDATE todos SET done = true WHERE todoList_id = $1 AND NOT done";
    let result = await dbQuery(COMPLETE_ALL, todoListId);
    return result.rowCount > 0;
  }

  async createTodo(title, todoListId) {
    const CREATE_TODO = "INSERT INTO todos (title, todoList_id) VALUES ($1, $2)";

    let result = await dbQuery(CREATE_TODO, title, todoListId);
    return result.rowCount > 0;
  }

  async editTodoList(newTitle, todoListId) {
    const EDIT_TODOLIST = "UPDATE todoLists SET title = $1 WHERE id = $2";
    let result = await dbQuery(EDIT_TODOLIST, newTitle, todoListId);
    return result.rowCount > 0;
  }

  async createTodoList(todoListTitle) {
    const CREATE_TODOLIST = "INSERT INTO todoLists (title) VALUES ($1)";
    try {
      let result = await dbQuery(CREATE_TODOLIST, todoListTitle);
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
    let FIND_TODOLISTS = "SELECT * FROM todoLists WHERE title = $1";
    let results = await dbQuery(FIND_TODOLISTS, title);
    return results.rowCount > 0;
  }


};