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

 

  // _findTodoList(todoListId) {
  //   return this._todoLists.find(todoList => todoList.id == todoListId);
  // }

  // _findTodo(todoListId, todoId) {
  //   let todoList = this._findTodoList(todoListId);
  //   if(!todoList) return undefined;
  //   return todoList.todos.find(todo => todo.id == todoId);
  // }

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
  loadTodo (todoListId, todoId) {
    // let todo = this._findTodo(todoListId, todoId);
    // return deepCopy(todo);
  };

  // // Toggle a todo between the done and not done state.
  // // Returns 'true' on success, `false` if the todo list doesn't exist.
  // // The id arguments must both be numeric.
  toggleDoneTodo(todoListId, todoId) {
    // let todo = this._findTodo(todoListId, todoId);
    // if(!todo) return false;
    // todo.done = !todo.done;
    // return true;
  }

  // // Delete the specified todo from the specified todo list.
  // // Returns `true` on success, `false` if the todo or todo list doesn't exist
  // // The id arguments must both be numeric

  deleteTodo(todoListId, todoId) {
    // let todoList = this._findTodoList(todoListId);
    // if(!todoList) return false;

    // let todoIndex = todoList.todos.findIndex(todo => todo.id == todoId);
    // if(todoIndex == -1) {
    //   return false;
    // } else {
    //   todoList.todos.splice(todoIndex, 1);
    //   return true;
    // }
  }

  deleteTodoList(todoListId) {
    // let todoList = this._findTodoList(todoListId);
    // if(!todoList) return false;

    // let todoListIndex = this._todoLists.findIndex(todoList => todoList.id == todoListId);
    // if(todoListIndex == -1) return false;

    // this._todoLists.splice(todoListIndex, 1);
    // return true;
  }

  completeAllTodos(todoListId) {
    // let todoList = this._findTodoList(todoListId);
    // if(!todoList) return false;
    // todoList.todos.filter(todo => !todo.done)
    //               .forEach(todo => todo.done = true);
    // return true;
  }

  _createNewTodo(title) {
    // let todo = {
    //   id: nextId(),
    //   title: title,
    //   done: false,
    // }
    // return todo;
  }

  createTodo(title, todoListId) {
    // let todoList = this._findTodoList(todoListId);
    // if(!todoList) return false;

    // let todo = this._createNewTodo(title);
    // todoList.todos.push(todo);
    // return true;
  }

  editeTodoList(newTitle, todoListId) {
    // let todoList = this._findTodoList(todoListId);
    // if(!todoList) return false;

    // todoList.title = newTitle;
    // return true;
  }

  createTodoList(todoListTitle) {
    // this._todoLists.push({
    //   id: nextId(),
    //   title: todoListTitle,
    //   todos: []
    // });
    // return true;
  }

  existsTodoListTitle(title) {
    //return this._todoLists.some(todoList => todoList.title == title);
  }


};