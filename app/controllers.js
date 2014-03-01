var MainCtrl = app.controller('MainCtrl', function($rootScope, $scope, $routeParams, $resource, userService){
	if(!$rootScope.data){
		$rootScope.data={};
		$rootScope.temp={};
	}

	var tools = {
		user: userService,
		active:function(loc){
			if(window.location.hash.split('/')[1]==loc)
				return 'active';
		},
		url:function(){
			return 'views/'+$routeParams.view+'.html';
		},
		setup:function(){
			$("#siteTitle").fitText(1.1, { minFontSize: '22px', maxFontSize: '75px' });
		}
	}
	$scope.tools = tools;

	userService.init();
	tools.setup();
	it.MainCtrl=$scope;
});


var AdminCtrl = app.controller('AdminCtrl', function($rootScope, $scope, $http, $q, config, fileService, initSetupService, roleService){
	var privateData = {};
	var tools = {
		hi:function(){
			$http.post(config.parseRoot+'functions/hello', {}).success(function(data){
				$scope.response = data;
			}).error(function(error, data){
				$scope.response = {error:error,data:data};
			});
		},
		roles:{
			setup:function(){	//This is a one time only thing - used to initiate the website roles.
				initSetupService.setup($rootScope.user,config.roles).then(function(results){
					$rootScope.data.roles = results;
				})
			},
			edit:function(role){
				$rootScope.temp.role = role;
				$('#adminRoleModal').modal('show');
			}
		},
		userRoles:roleService,

	}
	$scope.tools = tools;
	it.AdminCtrl=$scope;
});