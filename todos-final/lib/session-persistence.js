const SeedData = require('./seed-data');
const deepCopy = require('./deep-copy');
const {sortTodoLists, sortTodos} = require("./sort");
const nextId  = require('./next-id');

module.exports = class SessionPersistence {
  constructor(session) {
    this._todoLists = session.todoLists || deepCopy(SeedData);
    session.todoLists = this._todoLists;
  }

    isUniqueConstraintViolation(_error) {
    return false;
  }

  _findTodoList(todoListId) {
    return this._todoLists.find(todoList => todoList.id == todoListId);
  }

  _findTodo(todoListId, todoId) {
    let todoList = this._findTodoList(todoListId);
    if(!todoList) return undefined;
    return todoList.todos.find(todo => todo.id == todoId);
  }

  // If the todo list has at least one todo and all of its todos are marked as done
  // then the todo list is done. Otherwisw, it is undone
  isDoneTodoList(todoList) {
    return todoList.todos.length > 0 && todoList.todos.every(todo => todo.done);
  }

  hasUndoneTodos(todoList) {
    return todoList.todos.some(todo => !todo.done);
  }

  // Return the list of todo lists sorted br completion status and title(case-insensitive)
  sortedTodoLists() {
    let todoLists = deepCopy(this._todoLists);
    let undone = todoLists.filter(todoList => !this.isDoneTodoList(todoList));
    let done = todoLists.filter(todoList => this.isDoneTodoList(todoList));
    return sortTodoLists(undone, done);
  }

  sortedTodos(todoList) {
    let todos = todoList.todos;
    let undone = todos.filter(todo => !todo.done);
    let done = todos.filter(todo => todo.done);
    return deepCopy(sortTodos(undone, done));
  }

  loadTodoList(todoListId) {
    let todoList = this._findTodoList(todoListId);
    return deepCopy(todoList);
  };

  // Find a todo with the indicated ID in the indicated todo list. Returns
  // `undefined` if not found. Note that both `todoListId` and `todoId` must be
  // numeric.
  loadTodo (todoListId, todoId) {
    let todo = this._findTodo(todoListId, todoId);
    return deepCopy(todo);
  };
  // Toggle a todo between the done and not done state.
  // Returns 'true' on success, `false` if the todo list doesn't exist.
  // The id arguments must both be numeric.
  toggleDoneTodo(todoListId, todoId) {
    let todo = this._findTodo(todoListId, todoId);
    if(!todo) return false;
    todo.done = !todo.done;
    return true;
  }

  // Delete the specified todo from the specified todo list.
  // Returns `true` on success, `false` if the todo or todo list doesn't exist
  // The id arguments must both be numeric

  deleteTodo(todoListId, todoId) {
    let todoList = this._findTodoList(todoListId);
    if(!todoList) return false;

    let todoIndex = todoList.todos.findIndex(todo => todo.id == todoId);
    if(todoIndex == -1) {
      return false;
    } else {
      todoList.todos.splice(todoIndex, 1);
      return true;
    }
  }

  deleteTodoList(todoListId) {
    let todoList = this._findTodoList(todoListId);
    if(!todoList) return false;

    let todoListIndex = this._todoLists.findIndex(todoList => todoList.id == todoListId);
    if(todoListIndex == -1) return false;

    this._todoLists.splice(todoListIndex, 1);
    return true;
  }

  completeAllTodos(todoListId) {
    let todoList = this._findTodoList(todoListId);
    if(!todoList) return false;
    todoList.todos.filter(todo => !todo.done)
                  .forEach(todo => todo.done = true);
    return true;
  }

  _createNewTodo(title) {
    let todo = {
      id: nextId(),
      title: title,
      done: false,
    }
    return todo;
  }

  createTodo(title, todoListId) {
    let todoList = this._findTodoList(todoListId);
    if(!todoList) return false;

    let todo = this._createNewTodo(title);
    todoList.todos.push(todo);
    return true;
  }

  editTodoList(newTitle, todoListId) {
    let todoList = this._findTodoList(todoListId);
    if(!todoList) return false;

    todoList.title = newTitle;
    return true;
  }

  createTodoList(todoListTitle) {
    this._todoLists.push({
      id: nextId(),
      title: todoListTitle,
      todos: []
    });
    return true;
  }

  existsTodoListTitle(title) {
    return this._todoLists.some(todoList => todoList.title == title);
  }


};