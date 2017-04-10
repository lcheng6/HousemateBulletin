'use strict'

function WeatherData() {
	this.city = "Washington,District+of+Columbia"
}

//get my local weather data

//response = {city:
//	wind, 
//	humidity,
//	temp,
// 	description,
//	weather icon,
// }
WeatherData.prototype.getWeatherDataByCity = function() {
	// This is our API key
	var APIKey = "166a433c57516f51dfab1f7edaed8413";

	var queryURL = "http://api.openweathermap.org/data/2.5/weather?" +
       "q=Washington,District+of+Columbia&units=imperial&appid=" + APIKey;
    $.ajax( {
    	url:queryURL,
    	method: "GET"
    })
    .done(function(response) {
    	this.displayWeatherData(response);
    }.bind(this))
}

WeatherData.prototype.getWeatherDataByLatLon = function(lat, lon) {
	// This is our API key
	var APIKey = "166a433c57516f51dfab1f7edaed8413";

	var queryURL = "http://api.openweathermap.org/data/2.5/weather?" +
       "lat="+lat+"&lon="+lon+"&units=imperial&appid=" + APIKey;
    $.ajax( {
    	url:queryURL,
    	method: "GET"
    })
    .done(function(response) {
    	this.displayWeatherData(response);
    }.bind(this))
}
WeatherData.prototype.displayWeatherData = function(response) {
	
	$("#weather-list-group > .wind").text("wind: " + response.wind.speed+ "mph " + this.formWindDirectionString(response.wind.deg));
	$("#weather-list-group > .humidity").text("humidity: " + response.main.humidity + "%")
	$("#weather-list-group > .temp").text("temp: " + response.main.humidity + " F")	
	$("#weather-list-group > .description").text(response.weather[0].description)

	//TODO: weather icon. 
	
	var weatherIconUrl = "./assets/images/Sun.png";
	switch(response.weather[0].main) {
		case "Clouds":
			weatherIconUrl = "./assets/images/Cloud.png";
			break;
		case "Clear":
			weatherIconUrl = "./assets/images/Sun.png";
			break;
		case "Sunny":
			weatherIconUrl = "./assets/images/Sun.png";
			break;
		case "Rain":
			weatherIconUrl = "./assets/images/Rain.png";
			break;
		case "Snow":
			weatherIconUrl = "./assets/images/snow.png";
			break;
	}
	//$("#weather-list-group > .weatherIcon").text("");
	$("#weather-list-group > .weatherIcon > img").attr("src", weatherIconUrl)
}

WeatherData.prototype.formWindDirectionString = function (windDeg) {
	var sector = (windDeg + 45/2) % 360;
	sector = sector /45;
	var sector_index = Math.floor(sector);
	var ret =""
	var sectors = ["N", "NE", "E", "SE", "S", "SW", "W", "NW", "N"]

	return sectors[sector_index];
}