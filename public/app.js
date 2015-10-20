angular.module('tpApp', ['mgcrea.ngStrap'])
.controller('mainController', function($http) {
  console.log('Angular loaded');

  vm = this;
  vm.header = { title: "Select a Category!", subtitle: "Pick one from the navbar"}
  vm.pageLoading = false;
  vm.routeLocations = [];
  vm.routeAlert = "";
  var maxLocations = 5;

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

  vm.addLocation = function(location) {
    if (vm.routeLocations.length >= maxLocations) {
      vm.routeAlert = "Too many locations!";
      return;
    }
    vm.routeLocations.push(location);
  };

  vm.removeRouteLocation = function(index) {
    if (vm.routeLocations.length <= maxLocations) vm.routeAlert = "";
    vm.routeLocations.splice(index, 1);
  };

  vm.planRoute = function() {
    if (vm.routeLocations.length < 3 ) return;

    console.log(vm.routeLocations);

    console.log("sending route request");
    $http.post('/api/directions', vm.routeLocations)
    .then(function(res) {
      console.log(res.data);
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
