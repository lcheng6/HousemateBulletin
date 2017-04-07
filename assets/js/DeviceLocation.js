'use strict'

function DeviceLocation() {
	
}


DeviceLocation.prototype.getLocation = function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(this.showPosition);
    } else {
       	console.log("Geolocation is not supported by this browser.");
    }
}

DeviceLocation.prototype.showPosition = function(position) {

    //Google API Key: AIzaSyDXJGLoyFYv-tqqcTVSQ4jCFvnZt3No4Gs

    console.log("Latitude: " + position.coords.latitude  + "Longitude: " + position.coords.longitude);
    //var queryURL = "https://maps.googleapis.com/maps/api/js/GeocodeService.Search?5m2&1d38.9587206&2d-77.42384950000002&7sUS&9sen-US&key=AIzaSyALrSTy6NpqdhIOUs3IQMfvjh71td2suzY";
    var queryURL = "https://maps.googleapis.com/maps/api/geocode/json?latlng=38.9587206,-77.42384950&key=AIzaSyDXJGLoyFYv-tqqcTVSQ4jCFvnZt3No4Gs";
    $.ajax({
        url:queryURL,
        type: "GET",
        // dataType: 'jsonp',
        // cache:false
    }).done(function(response) {
        debugger;
        console.log(response.data);
    }.bind(this));
}
