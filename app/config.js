app.factory('config', function ($rootScope, $http) {
	var config = {
		fireRoot: 			'https://starterproject.firebaseio.com/',
		fireRef: 			new Firebase('https://starterproject.firebaseio.com/'),
		parseRoot: 			'https://api.parse.com/1/',
	 	parseAppId: 		'rHyi1Yom55l8mME6oRppfaK5pPwkpZf7dpJYhKtw',
	 	parseJsKey: 		'0Ba4VFZ4u6Zz89S7pQzboYpiCqNWhaWL2yvyZ6lR',
	 	parseRestApiKey: 	'1lZ8ptEhn9R9hSgX9AFQT1q06BPhroIN1Pip7esK',
	 	roles: 				['Manager','Editor','Writer']
	};

	Parse.initialize(config.parseAppId, config.parseJsKey);
	 $http.defaults.headers.common['X-Parse-Application-Id'] = config.parseAppId;
	 $http.defaults.headers.common['X-Parse-REST-API-Key'] = config.parseRestApiKey;
	 $http.defaults.headers.common['Content-Type'] = 'application/json';

	return config;
});