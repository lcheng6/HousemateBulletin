'use strict'

function HousemateBoard() {

  this.postTitle = document.getElementById('post_title');
  this.postDescription = document.getElementById('post_description');
  this.postSource = document.getElementById('post_source');

	this.mediaCapture = document.getElementById('mediaCapture');
	this.submitImageButton = document.getElementById('submitImage');
	this.messageList = document.getElementById('messages');

	this.submitImageButton.addEventListener('click', function(e) {
    	e.preventDefault();
    	this.mediaCapture.click();
  	}.bind(this));
  	this.mediaCapture.addEventListener('change', this.saveImageMessage.bind(this));

  	this.initFirebase();
}

HousemateBoard.prototype.initFirebase = function() {
	// (DEVELOPER): Initialize Firebase.
  this.auth = firebase.auth();
  this.database = firebase.database();
  this.storage = firebase.storage();

  this.postsRef = this.database.ref('posts');

};

// Loads chat messages history and listens for upcoming ones.
HousemateBoard.prototype.loadMessages = function() {
  // (DEVELOPER): Load and listens for new messages.

  // Make sure we remove all previous listeners.
  this.postsRef.off();

  // Loads the last 12 messages and listen for new ones.
  var setPost = function(data) {
    var val = data.val();
    console.log(val);
    this.displayPost(data.key, val.title, val.description, val.source, val.imageUri);
  }.bind(this);
  this.postsRef.limitToLast(12).on('child_added', setPost);
  this.postsRef.limitToLast(12).on('child_changed', setPost);
};

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
	  photoUrl: '/images/profile_placeholder.png'
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

//Template for display of post: 
HousemateBoard.POST_TEMPLATE = 
  '<div class="post-container">' + 
    '<div class="title"></div>' + 
    '<div class="pic"></div>' + 
    '<div class="source"></div>' + 
    '<div class="description"></div>' +
  '</div>';

HousemateBoard.prototype.displayPost = function(key, title, description, source, imageUri) {
  var newPost = $('#'+key);
  var img;


  if (newPost.length >= 1) {
    //the Post element already exists, just modify the content.
    newPost.children().eq(0).text(title);
    //this is the image.
    img = newPost.children().eq(1).children().eq(0);
    newPost.children().eq(2).text(source);
    newPost.children().eq(3).text(description);
  }else {
    //create new post;
    img = $('<img>')
    newPost = $(HousemateBoard.POST_TEMPLATE);
    newPost.attr('id', key);
    newPost.children().eq(0).text(title);
    newPost.children().eq(1).append(img);
    newPost.children().eq(2).text(source);
    newPost.children().eq(3).text(description);
    $('#messages').prepend(newPost);
  }

  this.setImageUrl(imageUri, img);


}
// // Template for messages.
// HousemateBoard.MESSAGE_TEMPLATE =
//     '<div class="message-container">' +
//       '<div class="spacing"><div class="pic"></div></div>' +
//       '<div class="message"></div>' +
//       '<div class="name"></div>' +
//     '</div>';

// Displays a Message in the UI.
// HousemateBoard.prototype.displayMessage = function(key, name, text, picUrl, imageUri) {
//   var div = document.getElementById(key);
//   // If an element for that message does not exists yet we create it.
//   if (!div) {
//     var container = document.createElement('div');
//     container.innerHTML = HousemateBoard.MESSAGE_TEMPLATE;
//     div = container.firstChild;
//     div.setAttribute('id', key);
//     this.messageList.appendChild(div);
//   }
//   if (picUrl) {
//     div.querySelector('.pic').style.backgroundImage = 'url(' + picUrl + ')';
//   }
//   div.querySelector('.name').textContent = name;
//   var messageElement = div.querySelector('.message');
//   if (text) { // If the message is text.
//     messageElement.textContent = text;
//     // Replace all line breaks by <br>.
//     messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');
//   }
//   if (imageUri) { // If the message is an image.
//     var image = document.createElement('img');
//     image.addEventListener('load', function() {
//       this.messageList.scrollTop = this.messageList.scrollHeight;
//     }.bind(this));
//     this.setImageUrl(imageUri, image);
//     //messageElement.innerHTML = '';
//     messageElement.appendChild(image);
//   }
//   // Show the card fading-in.
//   setTimeout(function() {div.classList.add('visible')}, 1);
//   this.messageList.scrollTop = this.messageList.scrollHeight;
//   this.messageInput.focus();
// };


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