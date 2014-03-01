var it = {};

var app = angular.module('SeedApp', ['firebase','pascalprecht.translate','ngAnimate','ngResource','ngRoute'])
.config(function($routeProvider,$translateProvider) {
	$routeProvider
	.when('/:view', {
		templateUrl: 'views/main.html',
		controller: 'MainCtrl'
	})
	.when('/:view/:id', {
		templateUrl: 'views/main.html',
		controller: 'MainCtrl'
	})
	.otherwise({
		redirectTo: '/home'
	});

	$translateProvider.useStaticFilesLoader({
		prefix: 'assets/languages/',
		suffix: '.json'
	});
	$translateProvider.uses('en');
});


angular.element(document).ready(function() {
	angular.bootstrap(document, ['SeedApp']);
});