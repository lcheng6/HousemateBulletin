'use strict'

function HousemateBoard() {
  this.houseboardFeed = $('#houseboard-feed');

  this.initFirebase();
}



HousemateBoard.TODOLIST_TEMPLATE ="";
HousemateBoard.TODOITEM_TEMPLATE ="";

HousemateBoard.prototype.initFirebase = function() {
	// (DEVELOPER): Initialize Firebase.
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
		return;
	}
	// Check if the user is signed-in

	// (DEVELOPER): Upload image to Firebase storage and add message.
	// We add a message with a loading icon that will get updated with the shared image.

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
      '<br><small class="text-muted">Techshop - Mobile, AL</small>' + 
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
    $('#messages').prepend(newPost);
  }

  newPost.attr('id', key);
  newPost.children().eq(0).text(title);
  img = newPost.children().eq(1);
    //set time string
    newPost.children().eq(2).children().eq(0).text(createdtime);
    newPost.children().eq(2).children().eq(1).text(source);
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
// // Sets the URL of the given img element with the URL of the image stored in Cloud Storage.
// HousemateBoard.prototype.setImageUrl = function(imageUri, imgElement) {
//   imgElement.src = imageUri;

//   // (DEVELOPER): If image is on Cloud Storage, fetch image URL and set img element's src.

//   if (imageUri.startsWith('gs://')) {
//     imgElement.src = FriendlyChat.LOADING_IMAGE_URL; // Display a loading image first.
//     this.storage.refFromURL(imageUri).getMetadata().then(function(metadata) {
//       imgElement.src = metadata.downloadURLs[0];
//     });
//   } else {
//     imgElement.src = imageUri;
//   }
// };

HousemateBoard.LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif';

window.onload = function() {
	window.houseBoard = new HousemateBoard();
	window.houseBoard.loadMessages();
}