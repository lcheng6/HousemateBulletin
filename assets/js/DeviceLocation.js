'use strict'

function DeviceLocation() {
	this.asyncCB = null;
}


DeviceLocation.prototype.getLocation = function(asyncCB) {
	this.asyncCB = asyncCB;
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(this.showPosition.bind(this));
    } else {
       	console.log("Geolocation is not supported by this browser.");
    }
}

DeviceLocation.prototype.showPosition = function(position) {

    //Google API Key: AIzaSyDXJGLoyFYv-tqqcTVSQ4jCFvnZt3No4Gs
    this.lat = position.coords.latitutde;
    this.lon = position.coords.longitude;
    console.log("Latitude: " + position.coords.latitude  + " Longitude: " + position.coords.longitude);
    //var queryURL = "https://maps.googleapis.com/maps/api/js/GeocodeService.Search?5m2&1d38.9587206&2d-77.42384950000002&7sUS&9sen-US&key=AIzaSyALrSTy6NpqdhIOUs3IQMfvjh71td2suzY";
    var queryURL = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + position.coords.latitude + "," +
		position.coords.longitude + "&key=AIzaSyDXJGLoyFYv-tqqcTVSQ4jCFvnZt3No4Gs";
    $.ajax({
        url:queryURL,
        type: "GET"

    }).done(function(response) {
        console.log(response.results[0]);
        var city_name = this.getCityName(response.results[0]);
        this.displayCityName(city_name);
        if (this.asyncCB) {
        	//signal it to go to the next function in series
        	this.asyncCB();
        }
    }.bind(this));
}

DeviceLocation.prototype.getCityName = function(response) {
	var address_components = _.compact(response.address_components);
	return address_components[2].long_name+ ", " + address_components[5].short_name
}

DeviceLocation.prototype.displayCityName = function(city_name) {
	$("#weather-list-group > .city").text("city: " + city_name)
}

DeviceLocation.prototype.getLat = function() {
	return this.lat;
}

DeviceLocation.prototype.getLon = function() {
	return this.lon;
}
