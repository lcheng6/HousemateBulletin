'use strict'

function HousemateBoard() {
  this.initFirebase();
}



HousemateBoard.HOUSEMATE_FEED_SELECTOR = "#housemate-feed";
HousemateBoard.DATE_TIME_FORMAT = 'm/d/Y h:i a';
HousemateBoard.LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif';

HousemateBoard.prototype.initFirebase = function() {
	// (DEVELOPER): Initialize Firebase.
    var config = {
    apiKey: "AIzaSyDibHtRsisWAscAOlnMHEED--nNYn-o_3A",
    authDomain: "housematebulletin.firebaseapp.com",
    databaseURL: "https://housematebulletin.firebaseio.com",
    storageBucket: "housematebulletin.appspot.com",
    messagingSenderId: "112460771425"
  };
  firebase.initializeApp(config);
  this.auth = firebase.auth();
  this.database = firebase.database();
  this.storage = firebase.storage();

  this.postsRef = this.database.ref('posts');
  this.todolistsRef = this.database.ref('todolists');
};

HousemateBoard.prototype.setupForImagePost = function() {
  $('#post_image_selector').change(window.houseBoard.previewImage.bind(this));
  $('#post_submit').click(window.houseBoard.saveImageMessage.bind(this))
}
//load image posts
HousemateBoard.prototype.loadImagePosts = function() {

  // Make sure we remove all previous listeners.
  this.postsRef.off();

  // Loads the last 12 messages and listen for new ones.
  var setPost = function(data) {
    var val = data.val();
    //console.log(val);
    this.displayPost(data.key, val.title, val.description, val.source, val.createdtime, val.imageUri);
  }.bind(this);

  this.postsRef.limitToLast(12).on('child_added', setPost);
  this.postsRef.limitToLast(12).on('child_changed', setPost);
};


//preview image in an <img> before we save it onto Firebase server
HousemateBoard.prototype.previewImage = function(event) {
  event.preventDefault();

  var tgt = event.target,
        files = tgt.files;

  //load this file into the display
  if (FileReader && files && files.length) {
    var fr = new FileReader();
    fr.onload = function() {
      $('#image-preview-box').attr('src', fr.result);
      //console.log(fr.type.match('image.*'));
      console.log(fr.type)
    }
    fr.readAsDataURL(files[0]);
    this.postImageFile = files[0];

  }
  else {
    debugger;
  }
}
//kicked off by the submit button, this function will read the parent form.
//get the value of title, description, and file value of the file input.  
//then post it to the feed.  

HousemateBoard.prototype.saveImageMessage = function(event) {

  event.preventDefault();
  var file = this.postImageFile;
  var textTitle = $('#post_title').val();
  var textDescription = $('#post_description').val();

  //TODO: need the source of the person
  var textSource = "";


	// Check if the file is an image.
	// if (!file.type.match('image.*')) {
 //    console.log('not an image')
	// 	return;
	// }

  //put the posts metadata into the posts table. 
	this.postsRef.push({
	  source: this.getIdentity(),
    title: textTitle,
    description: textDescription,
	  imageUri: HousemateBoard.LOADING_IMAGE_URL,
	  photoUrl: '/images/profile_placeholder.png',
    createdtime: firebase.database.ServerValue.TIMESTAMP
	}).then(function(data) {

	  // Upload the image to Cloud Storage.
	  var filePath = "posts" + '/' + data.key + '/' + file.name;
	  return this.storage.ref(filePath).put(file).then(function(snapshot) {

	    // Get the file's Storage URI and update the chat message placeholder.
	    var fullPath = snapshot.metadata.fullPath;
	    return data.update({imageUri: this.storage.ref(fullPath).toString()});
	  }.bind(this));
	}.bind(this)).catch(function(error) {
	  console.error('There was an error uploading a file to Cloud Storage:', error);
	});

};

HousemateBoard.POST_TEMPLATE = 
  '<div class="card framed">' + 
    '<div class="card-header"></div>' + 
    '<img class="card-img-top img-fluid" alt="Image cap">' + 
    '<div class="card-footer">' + 
      '<small class="text-muted"></small>' + 
      '<br>' + 
      ' <small class="text-muted"></small>' + 
    '</div>' + 
    '<div class="card-block">' + 
      '<p class="card-text">Card Description</p>' + 
    '</div>' + 
  '</div>';


HousemateBoard.prototype.displayPost = function(key, title, description, source, createdtime, imageUri) {
  var newPost = $('#'+key);
  var img;


  if (newPost.length >= 1) {
    //the Post element already exists, just modify the content.
    
  }else {
    //create new post;
    
    newPost = $(HousemateBoard.POST_TEMPLATE);
    newPost.attr('id', key);
    newPost.attr('createdtime', createdtime.toString())

    //TODO: modify the position of the new post. 
    $(HousemateBoard.HOUSEMATE_FEED_SELECTOR).prepend(newPost);
  }


  newPost.children().eq(0).text(title);
  img = newPost.children().eq(1);
    //set time string
    
    var myDate = new Date(createdtime);
    newPost.children().eq(2).children().eq(0).text(myDate.format(HousemateBoard.DATE_TIME_FORMAT));
    newPost.children().eq(2).children().eq(2).text(source);
  newPost.children().eq(3).children().eq(0).text(description);

  this.setImageUrl(imageUri, img);

}


HousemateBoard.prototype.setImageUrl = function(imageUri, img) {
  if(imageUri.startsWith('gs://')) {
    img.attr('src', HousemateBoard.LOADING_IMAGE_URL);
    this.storage.refFromURL(imageUri).getMetadata().then(function(metadata) {
      img.attr('src', metadata.downloadURLs[0]);
    })

  }else {
    img.attr('src', imageUri)
  }
}

HousemateBoard.prototype.setIdentity = function(username) {
  localStorage.setItem('username', username)
}

HousemateBoard.prototype.getIdentity = function(username) {
  var username = localStorage.getItem('username')
  if (username) {
    return username;
  }else {
    console.log('Sign in First');
    return "";
  }
}

HousemateBoard.prototype.getIdentityFirstName = function(username) {
  var username = localStorage.getItem('username')
  if (username) {
    firstname = _.split(username, ' ');
    firstname = firstname[0]
    return firstname;
  }else {
    console.log('Sign in First');
    return "";
  }
}


HousemateBoard.TODO_TITLE_SELECTOR = "#todo-title"
HousemateBoard.CREATE_TODO_ENTRIES_SELECTOR = "#todo-entries"
HousemateBoard.ADD_NEW_ITEM_BTN_SELECTOR = '#add-new-item-btn'
HousemateBoard.CREATE_TODOITEM_FORM_SELECTR = '#todo-form'
HousemateBoard.CREATE_TODO_LIST_CONTENT_SELECTOR = '#todo-entries .input-group'
HousemateBoard.SUBMIT_TODO_LIST_BTN_SELECTOR ='#submit-todo-list-btn'
HousemateBoard.CREATE_TODOITEM_TEMPLATE = 
  '<div class="todoItemEntry form-group">' + 
    '<div class="input-group">' + 
      '<span class="input-group-addon">' + 
        '<input type="checkbox" aria-label="done">' + 
      '</span>' + 
      '<input type="text" class="form-control" aria-label="todo" placeholder="Todo">' + 
    '</div>' + 
  '</div>'; 

//this function add a new todoitem in the createtodo.html, basically adding an additional entry
//in a new todo list. 
HousemateBoard.prototype.addNewTodoItemBtnClick = function (event) {

  event.preventDefault();
  console.log('add new todo item clicked')

  var newTodoItem = $(HousemateBoard.CREATE_TODOITEM_TEMPLATE);

  $(HousemateBoard.CREATE_TODO_ENTRIES_SELECTOR).append(newTodoItem);

}

HousemateBoard.prototype.submitTodoListBtnClick = function (event) {

  event.preventDefault();

  console.log('submit todo list clicked')

  //data model of a todo list: 
  //  createdtime
  //  title
  //  list [ {assignee: <text>, completed: <T/F>, description: <text>, priority: 2}]
  //  
  //Read the list from the createtodo.html 

  var title = $(HousemateBoard.TODO_TITLE_SELECTOR).val(); 
  var source = this.getIdentity();
  var list = [];
  var todolist = {}


  $(HousemateBoard.CREATE_TODO_LIST_CONTENT_SELECTOR).each(function(index) {
      var todoitem = {};
      todoitem.completed = $(this).children().eq(0).children().eq(0).prop('checked');
      todoitem.description = $(this).children().eq(1).val();
      todoitem.assignee = null;
      //console.log(todoitem);
      list.push(todoitem);
  })

  todolist.title = title;
  todolist.source = source;
  todolist.list = list;
  todolist.createdtime = firebase.database.ServerValue.TIMESTAMP
  console.log(todolist);

  //once I get the list, add it to the Firebase database. 
  this.todolistsRef.push(todolist).then(function(data) {
    //do nothing here
  }.bind(this)).catch(function(error) {
    console.error('There was an error uploading todolist');
  })


  //clear the todo form, and set the todo list to just a single todo item
  $(HousemateBoard.CREATE_TODOITEM_FORM_SELECTR).trigger('reset');
  $(HousemateBoard.CREATE_TODO_ENTRIES_SELECTOR).empty();

  var newTodoItem = $(HousemateBoard.CREATE_TODOITEM_TEMPLATE);

  $(HousemateBoard.CREATE_TODO_ENTRIES_SELECTOR).append(newTodoItem);


}

//This function is consumed by createtodo.html to help create todo lists
HousemateBoard.prototype.setupForCreateTodoPage = function() {
  $(HousemateBoard.ADD_NEW_ITEM_BTN_SELECTOR).click(window.houseBoard.addNewTodoItemBtnClick.bind(this))
  $(HousemateBoard.SUBMIT_TODO_LIST_BTN_SELECTOR).click(window.houseBoard.submitTodoListBtnClick.bind(this));
}


//This function is consumed by the feed page to prepare to load todolists. 

HousemateBoard.prototype.loadTodoLists = function() {
  this.todolistsRef.off();

  var setTodoList = function(data) {
    var val = data.val();
    this.displayTodoList(data.key, val.title, val.source, val.list, val.createdtime);
  }.bind(this);

  this.todolistsRef.limitToLast(12).on('child_added', setTodoList);
  this.todolistsRef.limitToLast(12).on('child_changed', setTodoList)
}

HousemateBoard.prototype.todoItemAssignToSelfBtnClick = function(event) {
  event.preventDefault();

  var eventTarget = event.target;
  var todoItemIndex = eventTarget.parent.attr('index').parseInt();
  console.target('Index: ' + index)
  debugger;
}

HousemateBoard.DISPLAY_TODOLIST_TEMPLATE =
  '<div class="card framed">'+
    '<div class="card-header"></div>' + 
    '<form class="display-todo-form" action="#">' + 
      '<div class="form-group todoItemHeader">' +            
        '<div class="todo-entries"></div>' + 
      '</div>' + 
    '</form>' + 
    '<div class="card-footer">' + 
      '<small class="text-muted"></small>' + 
      '<br>' + 
      '<small class="text-muted"></small>' +
    '</div>' + 
  '</div>';

HousemateBoard.DISPLAY_TODOITEM_TEMPLATE = 
  '<div class="todoItemEntry form-group">' + 
    '<div class="input-group" index="0">' +
      '<span class="input-group-addon">' + 
        '<input type="checkbox" aria-label="done">' + 
      '</span>' + 
      '<input disabled="disabled" type="text" class="form-control" aria-label="todo" value="">' + 
      '<button class="btn btn-primary">I\'ll do it</button>' + 
    '</div>' + 
  '</div>';

HousemateBoard.DISPLAY_TODOITEM_ASSIGNEE_TEMPLATE = 
  '<div class="chip" style="position: absolute top">' + 
    '<span></span>' + 
  '</div>';

HousemateBoard.prototype.displayTodoList = function(key, title, source, todoItemsArray, createdtime) {
  var newTodoList = $('#'+ key);

  if (newTodoList.length >=1) {
    //the todo list element already exists, just modiffy the content.
  }else {
    //create the html for Todo List
    newTodoList = $(HousemateBoard.DISPLAY_TODOLIST_TEMPLATE);
    newTodoList.attr('id', key);
    newTodoList.attr('createdtime', createdtime.toString());

    //TODO: modify the postion of the new Todo List

    $(HousemateBoard.HOUSEMATE_FEED_SELECTOR).prepend(newTodoList);

    newTodoList.children().eq(0).text(title);

    todoItemsArray.forEach(function(todoItem) {
      var newItemItemHtml = $(HousemateBoard.DISPLAY_TODOITEM_TEMPLATE);
      newItemItemHtml.children().eq(0).children().eq(1).val(todoItem.description)
      newTodoList.find('.todo-entries').append(newItemItemHtml);
    })
    var myDate = new Date(createdtime);
    newTodoList.children().eq(2).children().eq(0).text(myDate.format(HousemateBoard.DATE_TIME_FORMAT));
    newTodoList.children().eq(2).children().eq(2).text(source);
  }

  // debugger;
  //pointing to the todo entries within the todo framed card
  // newTodoList.children().eq(1).children().eq(0).children(0).eq(0).children(".todoItemEntry").each(function(i) { 
  //   console.log("todoItemEntry: " + i)
  // });
  //pointing to the todo entries within the todo framed card and put the assignee information in

  newTodoList.find(".todoItemEntry").each(function(i) { 
    var todoItemEntry = newTodoList.find(".todoItemEntry").eq(i);

    var todoItem = todoItemsArray[i]
    if(todoItem.assignee) {
      if (todoItemEntry.find(".chip").length == 0) {
        //there is no chip. put a new chip in

        todoItemEntry.find(".input-group").eq(0).append(HousemateBoard.DISPLAY_TODOITEM_ASSIGNEE_TEMPLATE)
      }
      todoItemEntry.find(".chip").eq(0).text(todoItem.assignee);
    }
  });
  

}
HousemateBoard.prototype.todoItemCompletedCheckBoxClick = function(event) {
  event.preventDefault();
  var eventTarget = $(event.target);
  var todoItemEntryAncestor = eventTarget.parent().parent().parent();
  this.readTodoItemEntryFromHtml(todoItemEntryAncestor);
}

//get input of a jQuery object, read the object for completed status, todo item name, 
//assignee
HousemateBoard.prototype.readTodoItemEntryFromHtml = function(todoItemEntryHtml) {
  var result = {};
  result.completed = todoItemEntryHtml.children().eq(0).children().eq(0).children().eq(0).prop('checked');
  result.description =  todoItemEntryHtml.children().eq(0).children().eq(1).val();
  if (todoItemEntryHtml.children().eq(0).children().eq(2).has("span").length) {
    result.assignee = todoItemEntryHtml.children().eq(0).children().eq(2).children().eq(0).text();
  }
  return result;
  //result.assignee
}

// HousemateBoard.prototype.loadTodoLists = function() {
//   // $('div.todoItemEntry > div.input-group > span > input[type="checkbox"]').click(this.todoItemCompletedCheckBoxClick.bind(this))

//   // $('div.todoItemEntry > div.input-group > button').click(this.todoItemAssignToSelfBtnClick.bind(this))


// }




