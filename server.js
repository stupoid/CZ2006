// get the things we need
var express = require('express');
var app = express();
var request = require('request');
var path = require('path');
var accessKey = 'du7Rd60/7nzzSyGHU6TZr0MTPOb1yB6fXe0TUcsitPfXPTVU+WneHA5KsDHmdBRaYoxm2yPGzwzZfvNKoLbVtAtgbgVewkjf|mv73ZvjFcSo=';


// set the public folder to serve public assets
app.use(express.static(__dirname + '/public'));

// set up our one route to the index.html file
app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname + '/public/views/index.html'));
});

// API routes
app.get('/api/theme/:themeName', function(req, res) {
	var onemapRoute = "http://www.onemap.sg/API/services.svc/mashupData?token="+accessKey+"&themeName="+req.params.themeName+"&otptFlds=HYPERLINK,NAME";

	request(onemapRoute, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			body = body.replace(/(\r\n|\n|\r)/gm," ");
			body = JSON.parse(body);

			res.json(body);
		}
	});
});


// start the server on port 8080 (http://localhost:8080)
app.listen(8080);
console.log('Magic happens on port 8080.');
