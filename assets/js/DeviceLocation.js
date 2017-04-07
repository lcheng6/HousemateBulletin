'use strict'

function DeviceLocation() {
	
}


DeviceLocation.prototype.getLocation = function() {
    if (navigator.geolocation) {
        debugger;
        navigator.geolocation.getCurrentPosition(showPosition);
    } else {
       	console.log("Geolocation is not supported by this browser.");
    }
}

DeviceLocation.prototype.showPosition = function(position) {
    console.log("Latitude: " + position.coords.latitude  + "Longitude: " + position.coords.longitude);
}