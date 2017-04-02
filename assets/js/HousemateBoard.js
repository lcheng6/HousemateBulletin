'use strict'

function HousemateBoard() {
  this.initFirebase();
}


HousemateBoard.TODOLIST_TEMPLATE ="";
HousemateBoard.TODOITEM_TEMPLATE ="";
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

//load image posts
HousemateBoard.prototype.loadImagePost = function() {
  // (DEVELOPER): Load and listens for new messages.

  // Make sure we remove all previous listeners.
  this.postsRef.off();

  // Loads the last 12 messages and listen for new ones.
  var setPost = function(data) {
    var val = data.val();
    console.log(val);
    this.displayPost(data.key, val.title, val.description, val.source, val.createdtime, val.imageUri);
  }.bind(this);

  this.postsRef.limitToLast(12).on('child_added', setPost);
  this.postsRef.limitToLast(12).on('child_changed', setPost);
};

//load image
HousemateBoard.prototype.saveImageMessage = function(event) {
  event.preventDefault();
  var file = event.target.files[0];
  var textTitle = this.postTitle.value;
  var textDescription = this.postDescription.value;
  var textSource = this.postSource.value;


	// Check if the file is an image.
	if (!file.type.match('image.*')) {
    console.log('not an image')
		return;
	}


  //put the posts metadata into the posts table. 
	this.postsRef.push({
	  source: textSource,
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
    newPost.empty();
  }else {
    //create new post;
    
    newPost = $(HousemateBoard.POST_TEMPLATE);

    //TODO: modify the position of the new post. 
    $(HousemateBoard.HOUSEMATE_FEED_SELECTOR ).prepend(newPost);
  }

  newPost.attr('id', key);
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




