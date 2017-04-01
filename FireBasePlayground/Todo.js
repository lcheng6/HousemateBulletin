'use strict'

function TodoList() {

  this.todoForm = $('#todo-form');
  this.submitBtn = $('#submitTodo');
  this.todoList = $('#TodoLists');

  this.submitBtn.click(function(event) {
    event.preventDefault();
    console.log('submit clicked')
    this.saveTodoList(event);

  }.bind(this))

  this.initFirebase();
}

TodoList.prototype.initFirebase = function() {
	// (DEVELOPER): Initialize Firebase.
  this.database = firebase.database();
  this.storage = firebase.storage();

  this.todolistsRef = this.database.ref('todolists');

};

TodoList.prototype.readTodoListForm = function() {
  var list = [];
  var formData = {};
  formData.title = $('#todo-form .todoItemHeader').children().eq(1).val();
  formData.source = $('#todo-form .todoItemHeader').children().eq(3).val();
  $('#todo-form .todoItemEntry').each(function() {

    console.log($(this).children().eq(1).is(":checked") + ", " + 
      $(this).children().eq(2).val() + ", " +
      $(this).children().eq(3).val());
    list.push({completed: $(this).children().eq(1).is(":checked"), 
      description: $(this).children().eq(2).val(),
      assignee: $(this).children().eq(3).val(), 
      priority: 2
    })
  })
  formData.list = list;
  console.log(formData);

  return formData;
}

// Saves a new todolist on the Firebase DB.
TodoList.prototype.saveTodoList = function(e) {
  e.preventDefault();
  this.todoForm[0].reset();

  var formData = this.readTodoListForm();

  this.todolistsRef.push({
    title: formData.title,
    source: formData.source,
    list: formData.list,
    createdtime: firebase.database.ServerValue.TIMESTAMP
  }).then(function() {
    // Clear message text field and SEND button state.
    console.log("Pushed successfully");
  }.bind(this)).catch(function(error) {
    console.error('Error writing new message to Firebase Database', error);
  });

};

TodoList.prototype.loadMessages = function() {
   this.todolistsRef.off();

   //loads sthe last 12 todolists and listent for new ones

   var setTodoList = function (data) {
    var val = data.val();
      console.log(val);
      this.displayTodoList(data.key, val.title, val.source, val.list)
   }.bind(this);

   this.todolistsRef.limitToLast(12).on('child_added', setTodoList);
   this.todolistsRef.limitToLast(12).on('child_changed', setTodoList);

}

TodoList.TODOLIST_TEMPLATE = 
  '<div class="todo-container">' + 
    '<div class="title"></div>' + 
    '<div class="source"></div>' + 
    '<div class="list"></div>' + 
    '<p>List Marker</p>' + 
  '</div>';

TodoList.TODOITEM_TEMPLATE = 
  '<div class="todo-item">' + 
    '<input class="completed" type="checkbox">    ' + 
    '<span class="description"></span>' + 
    '<span class="assignee"></span>' + 
  '</div>';

TodoList.prototype.displayTodoList =  function(key, title, source, itemList) {
  console.log('inside displayTodoList')

  var todoList = $('#' + key);

  if (todoList.length >=1) {
    //this element already exists
    
    todoList.find('.title').text(title);
    todoList.find('.source').text(source);
    todoList.find('.list').empty();

    itemList.forEach(function(item) {
      var itemHtml = $(TodoList.TODOITEM_TEMPLATE);
      itemHtml.find('.completed').prop('checked', item.completed);

      itemHtml.find('.description').text(item.description);
      if (item.completed) {
        itemHtml.find('.description').addClass('item-completed')
      }else {
        itemHtml.find('.description').addClass('item-incomplete')
      }
      itemHtml.find('.assignee').text(item.assignee);
      todoList.find('.list').append(itemHtml);
    });
  }else {

    var todoListHtml = $(TodoList.TODOLIST_TEMPLATE);
    todoListHtml.attr('id', key)
    todoListHtml.find('.title').text(title);
    todoListHtml.find('.source').text(source);

    itemList.forEach(function(item) {
      var itemHtml = $(TodoList.TODOITEM_TEMPLATE);
      itemHtml.find('.completed').prop('checked', item.completed);

      itemHtml.find('.description').text(item.description);
      if (item.completed) {
        itemHtml.find('.description').addClass('item-completed')
      }else {
        itemHtml.find('.description').addClass('item-incomplete')
      }
      itemHtml.find('.assignee').text(item.assignee);
      todoListHtml.find('.list').append(itemHtml);
    });
    
    $('#TodoLists').prepend(todoListHtml); 
  }

}

window.onload = function() {
	window.todoList = new TodoList();

  window.todoList.loadMessages();
}
