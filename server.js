// get the things we need
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require('request');
var path = require('path');

var accessKey = 'du7Rd60/7nzzSyGHU6TZr0MTPOb1yB6fXe0TUcsitPfXPTVU+WneHA5KsDHmdBRaYoxm2yPGzwzZfvNKoLbVtAtgbgVewkjf|mv73ZvjFcSo=';

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

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

app.post('/api/directions', function(req, res) {
	// plan route assuming index 0 = start and len = end
	// always have to start with start point and end with send point
	var locations = req.body;
	var len = locations.length;
	var directions = {
		locationStrings : [],
		locationOrder: [],
		routeInfo: []
	};

	// function to check if all the directions have been received
	collateRoutes = function(routeInfo) {
		directions.routeInfo.push(routeInfo);
		console.log("Total routeInfo: " + directions.routeInfo.length)
		if (directions.routeInfo.length == directions.locationStrings.length) {
			// find shortest time
			var shortest = 0;
			for (i=0; i<directions.routeInfo.length; i++) {
				if (directions.routeInfo[shortest].totalTime > directions.routeInfo[i].totalTime)
					shortest = i;
			}
			var shortestRoute = {
				locationOrderString : [],
				coordOrder: [],
				routeDuration : directions.routeInfo[shortest].totalTime,
				routeLength : directions.routeInfo[shortest].totalLength
			}
			for (i=0; i<directions.locationOrder[shortest].length; i++) {
				shortestRoute.locationOrderString.push(locations[directions.locationOrder[shortest][i]].NAME);
				shortestRoute.coordOrder.push(locations[directions.locationOrder[shortest][i]].XY);
			}
			res.json(shortestRoute);
		}
	};

	for (i=1; i<len-1; i++) {
		for (j=1; j<len-1; j++) {
			if (i!=j) {
				if (len>4) {
					for (k=1; k<len-1; k++) {
						if (k!=j && k!=i){
							var locationString = locations[0].XY+";"+locations[i].XY+";"+locations[j].XY+";"+locations[k].XY+";"+locations[len-1].XY;
							directions.locationStrings.push(locationString);
							directions.locationOrder.push([0, i, j, k, len-1]);
						}
					}
				} else {
					var locationString = locations[0].XY+";"+locations[i].XY+";"+locations[j].XY+";"+locations[len-1].XY;
					directions.locationStrings.push(locationString);
					directions.locationOrder.push([0, i, j, len-1]);
				}
			}
		}
	}

	for (i=0; i<directions.locationStrings.length; i++) {
		var onemapRoute = "http://www.onemap.sg/API/services.svc/route/solve?token="+accessKey+"&routeStops="+directions.locationStrings[i]+"&routemode=DRIVE&avoidERP=0&routeOption=shortest";
		request(onemapRoute, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				body = JSON.parse(body);
				routeInfo = {
					totalTime: body.directions[0].summary.totalTime,
					totalLength: body.directions[0].summary.totalLength
				}
				collateRoutes(routeInfo);
			}
		});

	}

	//locationString += locations[len-1].XY;
/*
	var onemapRoute = "http://www.onemap.sg/API/services.svc/route/solve?token="+accessKey+"&routeStops="+locationString+"&routemode=DRIVE&avoidERP=0&routeOption=shortest";
	console.log(onemapRoute);
	request(onemapRoute, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			body = JSON.parse(body);

			console.log(body);
			res.json(body);
		}
	});
*/
	/*
	// loop for start to every other direction besides end
	for (i=1; i<len-1; i++) {
		var onemapRoute = "http://www.onemap.sg/API/services.svc/route/solve?token="+accessKey+"&routeStops="+locations[0].XY+";"+locations[i].XY+"&routemode=DRIVE&avoidERP=0&routeOption=shortest";
		console.log('sent request');
		request(onemapRoute, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				body = JSON.parse(body);
				var direction = {
					routeName: body.directions[0].routeName,
					totalTime: body.directions[0].summary.totalTime,
					totalLength: body.directions[0].summary.totalLength,
				}

				collateDirections(direction);
			}
		});
	}

	for (i=1; i<len; i++) {
		for (j=1; j<len; j++){
			if (i==j) return;
			var onemapRoute = "http://www.onemap.sg/API/services.svc/route/solve?token="+accessKey+"&routeStops="+locations[i].XY+";"+locations[j].XY+"&routemode=DRIVE&avoidERP=0&routeOption=shortest";
			console.log('sent request');
			request(onemapRoute, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					body = JSON.parse(body);
					var direction = {
						routeName: body.directions[0].routeName,
						totalTime: body.directions[0].summary.totalTime,
						totalLength: body.directions[0].summary.totalLength,
					}

					collateDirections(direction);
				}
			});
		}
	};
	*/


	/*
	for (i=0; i<len; i++) {
		for (j=0; j<i; j++){
			console.log(i, j);
		}
	};
	*/
	/*
	var locations = req.body;
	var routeStops = '';

	for (i=0; i<locations.length; i++) {
			locations[i].N = Number(locations[i].XY.split(',')[0]);
			locations[i].E = Number(locations[i].XY.split(',')[1]);
			delete locations[i].ICON_NAME;
			delete locations[i].XY;
			var resultLatLon = cv.computeLatLon(locations[i].N, locations[i].E);

			locations[i].lat = resultLatLon.lat;
			locations[i].lon = resultLatLon.lon;
			locations[i].latlon = resultLatLon.lat + ", " + resultLatLon.lon;
	}

	res.json(locations);

	*/
	/*
	for (i=0; i<locations.length-1; i++) {
			routeStops += locations[i].XY + ";"
	}
	routeStops += locations[i].XY

	var onemapRoute = "http://www.onemap.sg/API/services.svc/route/solve?token="+accessKey+"&routeStops="+routeStops+"&routemode=DRIVE&avoidERP=0&routeOption=shortest";

	console.log(onemapRoute);
	res.json({ success: true });

	var locationA = req.params.locationA;
	var locationB = req.params.locationB;
	//var onemapRoute = "http://www.onemap.sg/publictransportation/service1.svc/routesolns?token="+accessKey+"&sl="+locationA+"&el="+locationB+"&startstop=&endstop=&walkdist=300&mode=bus/mrt&routeopt=fastest&retgeo=true&maxsolns=1&callback=";
	var onemapRoute = "http://www.onemap.sg/API/services.svc/route/solve?token="+accessKey+"&routeStops="+locationA+";"+locationB+"&routemode=DRIVE&avoidERP=0&routeOption=shortest";
	console.log(onemapRoute);
	request(onemapRoute, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			body = JSON.parse(body);

			res.json(body.directions[0].summary);
		}
	});
	*/
});

// start the server on port 8080 (http://localhost:8080)
app.listen(8080);
console.log('Magic happens on port 8080.');
