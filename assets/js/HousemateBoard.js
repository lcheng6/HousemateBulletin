'use strict'

function HousemateBoard() {
  this.initFirebase();
}


//Some declarations to help with posts and todolist inserts
HousemateBoard.HOUSEMATE_FEED_SELECTOR = "#housemate-feed";
HousemateBoard.DATE_TIME_FORMAT = 'm/d/Y h:i a';
HousemateBoard.LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif';


//Got to initialize the database.  put this code here to avoid putting it into every html page
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

//Set to post image in the page upload_pic.html
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


//preview image in an <img> inside upload_pic.html before we save it onto Firebase server
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

//This html template helps with inserting a "framed card" to post a picture based post into 
//feed.html
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


//display the post in feed.html. 
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

//a call back function used inside feed.html.  This callback after a picture is properly loaded 
//into the firebase data store. and will translate the gs:// uri into a https:// uri.  
//and update the https uri into the feed.html page
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

//used by login.html to set the identity.  
HousemateBoard.prototype.setIdentity = function(username) {
  localStorage.setItem('username', username)
}

//this function reads out the identity.  Used by all pages other than login.html
HousemateBoard.prototype.getIdentity = function() {
  var username = localStorage.getItem('username')
  if (username) {
    return username;
  }else {
    console.log('Sign in First');
    return "";
  }
}


//this function is used just getting the first name of identity, currently not used
HousemateBoard.prototype.getFirstName = function(username) {
  if (username) {
    firstname = _.split(username, ' ');
    firstname = firstname[0]
    return firstname;
  }else {
    console.log('Sign in First');
    return "";
  }
}


//used by createtodo.html and feed.html to display and create todo items
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

//submit todo list button callback, used in createtodos.html
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

//used by feed.page to debug todoitem assign to self button
HousemateBoard.prototype.todoItemAssignToSelfBtnClick = function(event) {
  event.preventDefault();

  var eventTarget = event.target;
  var todoItemIndex = eventTarget.parent.attr('index').parseInt();
  console.target('Index: ' + index)
  debugger;
}

//used by feed.html to properly todolist
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

//used by feed.html to properly an individual todo item inside a todo list
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

//used to display the chip of name of assignee
HousemateBoard.DISPLAY_TODOITEM_ASSIGNEE_TEMPLATE = 
  '<div class="chip" style="position: absolute top">' + 
    '<span></span>' + 
  '</div>';

//used by feed.html to display todolist. 
HousemateBoard.prototype.displayTodoList = function(key, title, source, todoItemsArray, createdtime) {
  var newTodoList = $('#'+ key);

  if (newTodoList.length >=1) {
    //the todo list element already exists, just modiffy the content.
  }else {
    //create the html for Todo List
    newTodoList = $(HousemateBoard.DISPLAY_TODOLIST_TEMPLATE);
    newTodoList.attr('id', key);
    newTodoList.attr('createdtime', createdtime.toString());

    //TODO: modify the postion of the new Todo List according to created time

    $(HousemateBoard.HOUSEMATE_FEED_SELECTOR).prepend(newTodoList);

    newTodoList.children().eq(0).text(title);

    var todoItemIndex = 0;
    todoItemsArray.forEach(function(todoItem) {
      var newTodoItemHtml = $(HousemateBoard.DISPLAY_TODOITEM_TEMPLATE);
      newTodoItemHtml.children().eq(0).children().eq(1).val(todoItem.description)
      newTodoItemHtml.children().eq(0).attr('index', todoItemIndex)
      newTodoList.find('.todo-entries').append(newTodoItemHtml);
      todoItemIndex++;
      // debugger;
      // newTodoItemHtml.find(':checkbox').eq(0).click(this.todoItemCompletedCheckBoxClick.bind(this))
      // newTodoItemHtml.find('button').eq(0).click(this.todoItemAssignToMeBtnClick.bind(this))

    })
    newTodoList.find(':checkbox').click(this.todoItemCompletedCheckBoxClick.bind(this))
    newTodoList.find('button').click(this.todoItemAssignToMeBtnClick.bind(this))

    var myDate = new Date(createdtime);
    newTodoList.children().eq(2).children().eq(0).text(myDate.format(HousemateBoard.DATE_TIME_FORMAT));
    newTodoList.children().eq(2).children().eq(2).text(source);
    //Todo add click handler for checkbox and "I'll do it " button
  }

  //pointing to the todo entries within the todo framed card


  newTodoList.find(".todoItemEntry").each(function(i) { 
    var todoItemEntry = newTodoList.find(".todoItemEntry").eq(i);

    var todoItem = todoItemsArray[i];

    //the following section update the ".chip"
    if(todoItem.assignee) {
      if (todoItemEntry.find(".chip").length == 0) {
        //there is no chip. put a new chip in
        todoItemEntry.find(".input-group").eq(0).append(HousemateBoard.DISPLAY_TODOITEM_ASSIGNEE_TEMPLATE)
      }
      //set chip value to assignee
      todoItemEntry.find(".chip").eq(0).text(todoItem.assignee);
    }
    //the next one will update the check box
    //debugger;
    if(todoItemEntry.find(":checkbox").length>=1) {
      todoItemEntry.find(":checkbox").eq(0).prop('checked', todoItem.completed)
    }

  });
  
}

//event handler for check box within the feed.html's todo list
//once clicked, it should go an update the database
HousemateBoard.prototype.todoItemCompletedCheckBoxClick = function(event) {
  //event.preventDefault();
  var eventTarget = $(event.target);

  var todoItemEntryAncestor = eventTarget.parent().parent().parent();
  var inputGroupAncestor = eventTarget.parent().parent();
  var cardFramedAncestor = todoItemEntryAncestor.parent().parent().parent().parent();

  var completed = eventTarget.prop('checked');
  var index = inputGroupAncestor.attr('index');
  var todoItemId = cardFramedAncestor.attr('id')


  console.log("checkbox handler")
  debugger;
  this.updateFireBaseTodoItemCompletedByIndex(completed, index, todoItemId)
  
}

HousemateBoard.prototype.updateFireBaseTodoItemCompletedByIndex = function(completed, index, key) {

  var updatelist
  firebase.database().ref('/todolists/' + key).once('value')
    .then(function(snapshot) {
      updatelist = snapshot.val().list
      updatelist[index].completed = completed
      
      return snapshot.ref.update({"list":updatelist})
    })
    
}

//event handler for "I'll do it" button ithin the feed.html's todo list
//once clicked, it should go an update the database
HousemateBoard.prototype.todoItemAssignToMeBtnClick = function(event) {
  event.preventDefault();
  var eventTarget = $(event.target);

  var todoItemEntryAncestor = eventTarget.parent().parent().parent();
  var inputGroupAncestor = eventTarget.parent();
  var cardFramedAncestor = todoItemEntryAncestor.parent().parent().parent();

  var todoItemId = cardFramedAncestor.attr('id')
  var assignee = this.getIdentity();
  var index = inputGroupAncestor.attr('index');
  //debugger;
  console.log("Assign to me handler")
  this.updateFireBaseTodoItemAssigneeByIndex(assignee, index, todoItemId)
}


HousemateBoard.prototype.updateFireBaseTodoItemAssigneeByIndex = function(assignee, index, key) {

  var newlist, data
  firebase.database().ref('/todolists/' + key).once('value')
    .then(function(snapshot) {
      newlist = snapshot.val().list
      newlist[index].assignee = assignee
      
      return snapshot.ref.update({"list":newlist})
    })
    
}


