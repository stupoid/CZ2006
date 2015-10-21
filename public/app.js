angular.module('tpApp', ['mgcrea.ngStrap'])
.controller('mainController', function($http) {
  console.log('Angular loaded');

  vm = this;
  vm.header = { title: "Select a Category!", subtitle: "Pick one from the navbar"}
  vm.pageLoading = false;
  vm.routeLocations = [];
  vm.routeAlert = "";
  vm.tooltip = { "title": "Set End Location as this too!" };

  var maxLocations = 3;

  vm.getLocations = function(themeName) {
    vm.pageLoading = true;
    vm.header = { title: "Loading" };
    console.log("sending request for theme: " + themeName);
    // connect to server to get locations
    $http.get('/api/theme/'+themeName)
    .then(function(res) {
      vm.pageLoading = false;
      vm.locations = res.data.SrchResults
      vm.header.title = themeName;
      vm.header.subtitle = vm.locations[0].FeatCount + " found";
      vm.locations.shift();
    });
  };

  vm.addStartLocation = function(location) {
    vm.startLocation = location;
  };

  vm.removeStartLocation = function() {
    delete vm.startLocation;
  }

  vm.addLocation = function(location) {
    if (vm.routeLocations.length >= maxLocations) {
      vm.routeAlert = "Too many locations!";
      return;
    }
    vm.routeLocations.push(location);
  };

  vm.addEndLocation = function(location) {
    vm.endLocation = location;
  };

  vm.removeEndLocation = function() {
    delete vm.endLocation;
  };

  vm.removeRouteLocation = function(index) {
    if (vm.routeLocations.length <= maxLocations) vm.routeAlert = "";
    vm.routeLocations.splice(index, 1);
  };

  vm.planRoute = function() {
    var locations = vm.routeLocations.slice();
    locations.unshift(vm.startLocation);
    locations.push(vm.endLocation);
    console.log(locations);
    vm.pageLoading = true;
    vm.header.title = "Loading";
    vm.header.subtitle = "fetching results";

    $http.post('/api/directions', locations)
    .then(function(res) {
      vm.pageLoading = false;
      shortestRoute = res.data;
      var coords = "";
      var len = shortestRoute.coordOrder.length;
      for(i=0; i<len-1; i++) {
        coords += shortestRoute.coordOrder[i] + '|';
      }
      coords += shortestRoute.coordOrder[len-1];

      console.log(res.data);
      console.log(coords);
    });

    //console.log(CnvEN2LL(30047.6749, 30339.5771));

    /*
    $http.get('/api/directons/'+locationA.XY+'/'+locationB.XY)
    .then(function(res) {
      console.log(res.data);
    });
    */

  };

})

.filter('capitalize', function() {
    return function(input) {
      return (!!input) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
    }
})

.filter('alphabetize', function() {
    return function(input) {
      return (!!input) ? String.fromCharCode(64 + input) : '';
    }
});
