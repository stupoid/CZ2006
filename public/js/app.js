angular.module('tpApp', ['mgcrea.ngStrap'])
.controller('mainController', function($http) {
  console.log('Angular loaded');

  vm = this;
  vm.header = { title: "Select a Category!", subtitle: "Pick one from the navbar"}
  vm.pageLoading = false;
  vm.routeLocations = [];
  vm.routeAlert = "";

  vm.getLocations = function(themeName) {
    vm.pageLoading = true;
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

  vm.addLocation = function(location) {
    if (vm.routeLocations.length >= 5) {
      vm.routeAlert = "Too many locations!";
      return;
    }
    var index = vm.locations.indexOf(location);
    // add location to routeLocations
    vm.routeLocations.push(vm.locations[index]);

    // remove location by index from locations
    vm.locations.splice(index, 1)
  };

  vm.removeRouteLocation = function(index) {
    if (vm.routeLocations.length <= 5) vm.routeAlert = "";
    // add location back to locations
    vm.locations.push(vm.routeLocations[index]);

    // remove originalindex from location
    vm.routeLocations.splice(index, 1);
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
