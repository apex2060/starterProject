/****************************************************************************************************
userService: allows us to quickly interact with firebase and parse to create and login users
****************************************************************************************************/
app.factory('userService', function ($rootScope, $http, $q, config, geoService) {
	var userService = {
 		init:function(){
 			if($rootScope.user==undefined){
	 			if(navigator.onLine){
	 				userService.auth = new FirebaseSimpleLogin(config.fireRef, function(error, data) {
	 					if (error) {
	 						console.log(error);
	 					} else if (data) {
							// console.log('FireAuth has been authenticated!')
							$('#userLoginModal').modal('hide');
							if(localStorage.user){
								var localUser = angular.fromJson(localStorage.user);
								$http.defaults.headers.common['X-Parse-Session-Token'] = localUser.sessionToken;
							}
							userService.initParse(data);
						} else {
							// console.log('not logged in.');
							$rootScope.$broadcast('authError');
						}
					});
	 			}else{
	 				alert('You are not online!')
	 			}
	 		}
 		},
 		initParse:function(){
 			$http.get(config.parseRoot+'users/me').success(function(data){
 				userService.getRoles(data).then(function(roles){
 					data.roles = roles;
	 				$rootScope.user=data;
	 				$rootScope.user.isAdmin = userService.is('Admin')
	 				$rootScope.user.isManager = userService.is('Manager')
	 				$rootScope.user.isEditor = userService.is('Editor')
	 				$rootScope.user.isEmployee = userService.is('Employee')
 				})
 			}).error(function(){
				alert('You are not authenticated any more!');
			});
 		},
 		signupModal:function(){
 			$('#userSignupModal').modal('show');
 		},
 		signup:function(user){
 			userService.signupParse(user);
 		},
 		signupParse:function(user){
 			user.username = user.email;
 			if(user.password!=user.password1){
 				console.error('error','Your passwords do not match.');
 			}else{
 				delete user.password1;
 				$http.post('https://api.parse.com/1/users', user).success(function(data){
 					userService.signupFire(user);
 				}).error(function(error, data){
 					console.log('signupParse error: ',error,data);
 				});
 			}
 		},
 		signupFire:function(user){
 			userService.auth.createUser(user.email, user.password, function(error, data) {
 				if(error)
 					console.log('signupFire error: ',error,data)
 				else{
 					$('#userSignupModal').modal('hide');
 					userService.login(user);
 				}
 			});
 		},
 		loginModal:function(){
 			$('#userLoginModal').modal('show');
 		},
 		login:function(user){
 			userService.loginParse(user);
 		},
 		loginParse:function(user){
 			var login = {
 				username:user.email,
 				password:user.password
 			}
 			$http.get("https://api.parse.com/1/login", {params: login}).success(function(data){
 				$http.defaults.headers.common['X-Parse-Session-Token'] = data.sessionToken;
 				localStorage.user=angular.toJson(data);
 				$rootScope.user=data;
 				userService.loginFire(user);
 			}).error(function(data){
 				console.error('error',data.error);
				// $('#loading').removeClass('active');
			});
 		},
 		loginFire:function(user){
 			userService.auth.login('password', {
 				email: user.email,
 				password: user.password
 			});
 		},
 		logout:function(){
 			localStorage.clear();
 			$rootScope.user=null;
 		},
 		getRoles:function(user){
			var deferred = $q.defer();
			var roleQry = 'where={"users":{"__type":"Pointer","className":"_User","objectId":"'+user.objectId+'"}}'
			$http.get(config.parseRoot+'classes/_Role?'+roleQry).success(function(data){
				deferred.resolve(data.results);
			}).error(function(data){
				deferred.reject(data);
			});
			return deferred.promise;
		},
		is:function(roleName){
			if($rootScope.user && $rootScope.user.roles)
				for(var i=0; i<$rootScope.user.roles.length; i++)
					if($rootScope.user.roles[i].name==roleName)
						return true;
			return false;
		},
 		settingsModal:function(){
 			$('#userSettingsModal').modal('show');
 		}
 	}
	it.userService = userService;
	return userService;
});





/****************************************************************************************************
roleSerivce: allows us to manage parse.com user roles
****************************************************************************************************/
app.factory('roleService', function ($rootScope, $http, $q, config) {
	var roleService = {
		listAllRoles:function(){
			$http.get(config.parseRoot+'classes/_Role').success(function(data){
				$rootScope.data.roles = data.results;
			}).error(function(data){
				console.error(data);
			});
		},
		listAllUsers:function(){
			$http.get(config.parseRoot+'classes/_User').success(function(data){
				$rootScope.data.users = data.results;
			}).error(function(data){
				console.error(data);
			});
		},
		listUserRoles:function(user){
			var deferred = $q.defer();
			var roleQry = 'where={"users":{"__type":"Pointer","className":"_User","objectId":"'+user.objectId+'"}}'
			$http.get(config.parseRoot+'classes/_Role?'+roleQry).success(function(data){
				deferred.resolve(data.results);
			}).error(function(data){
				deferred.reject(data);
			});
			return deferred.promise;
		},
		editUserRoles:function(user){
			$rootScope.temp.user = user;
			roleService.listUserRoles(user).then(function(roles){
				$rootScope.temp.user.roles = roles;
			})
			$('#adminUserModal').modal('show');
		},
		toggleUserRole:function(user,role){
			if(roleService.hasRole(user,role))
				roleService.deleteUserRole(user,role).then(function(data){
					roleService.listUserRoles(user).then(function(roles){
						$rootScope.temp.user.roles = roles;
					})
				})
			else
				roleService.addUserRole(user,role).then(function(data){
					roleService.listUserRoles(user).then(function(roles){
						$rootScope.temp.user.roles = roles;
					})
				})
		},
		addUserRole:function(user,role){
			var deferred = $q.defer();
			var request = {
				users: {
					"__op": "AddRelation",
					"objects": [{
						"__type": "Pointer",
						"className": "_User",
						"objectId": user.objectId
					}]
				}
			}
			$http.put(config.parseRoot+'classes/_Role/'+role.objectId, request).success(function(data){
				console.log('Role Updated: ',data)
				deferred.resolve(data);
			}).error(function(data){
				deferred.reject(data);
			});
			return deferred.promise;
		},
		deleteUserRole:function(user,role){
			var deferred = $q.defer();
			var request = {
				users: {
					"__op": "RemoveRelation",
					"objects": [{
						"__type": "Pointer",
						"className": "_User",
						"objectId": user.objectId
					}]
				}
			}
			$http.put(config.parseRoot+'classes/_Role/'+role.objectId, request).success(function(data){
				deferred.resolve(data);
			}).error(function(data){
				deferred.reject(data);
			});
			return deferred.promise;
		},
		hasRole:function(user, role){
			if(user && user.roles)
				for(var i=0; i<user.roles.length; i++)
					if(user.roles[i].objectId==role.objectId)
						return true
			return false;
		}
	}
	it.roleService = roleService;
	return roleService;
});





/****************************************************************************************************
geoService: allows us to gracefully request and use the native geolocation services.
			formats geolocation information into parse-friendly information for saving & searches
****************************************************************************************************/
app.factory('geoService', function ($q) {
	var  geoService={
		helpModal:function(){
			$('#userGeoHelpModal').modal('show');
		},
		location:function(){
			var deferred = $q.defer();
			if(navigator.geolocation){
				navigator.geolocation.getCurrentPosition(function(geo){
					deferred.resolve(geo)
				})
			}else{
				deferred.resolve({status:'error',message:'Geolocation is not supported by this browser.'});
			}
			return deferred.promise;
		},
		distance:function(geo1,geo2){
			var from = new google.maps.LatLng(geo1.latitude,geo1.longitude);
			var to = new google.maps.LatLng(geo2.latitude,geo2.longitude);
			var dist = google.maps.geometry.spherical.computeDistanceBetween(from, to);
			var miles = dist*.00062137;
			return miles;
		},
		parsePoint:function(geo){
			return {
				__type:"GeoPoint",
				latitude:geo.coords.latitude,
				longitude:geo.coords.longitude
			}
		},
		parseSearch:function(geoShape){
			var where = {};
			if(geoShape.type=='circle'){
				where={
					"location": {
						"$nearSphere": {
							"__type": "GeoPoint",
							"latitude": geoShape.latitude,
							"longitude": geoShape.longitude
						},
						"$maxDistanceInMiles": geoShape.radius
					}
				}
			}else if(geoShape.type=='rectangle'){
				where = {
					"location": {
						"$within": {
							"$box": [{
								"__type": "GeoPoint",
								"latitude": geoShape.northEast.latitude,
								"longitude": geoShape.northEast.longitude
							},{
								"__type": "GeoPoint",
								"latitude": geoShape.southWest.latitude,
								"longitude": geoShape.southWest.longitude
							}]
						}
					}
				}
			}else if(geoShape.type=='marker'){
				where={
					"location": {
						"$nearSphere": {
							"__type": "GeoPoint",
							"latitude": geoShape.latitude,
							"longitude": geoShape.longitude
						}
					}
				}
			}
			return where;
		}
	}
	it.geoService = geoService;
	return geoService;
});





/****************************************************************************************************
fileService: Allows us to upload files to parse.com and receive returned file information.
****************************************************************************************************/
app.factory('fileService', function ($http, config) {
	var fileService = {
		upload:function(details,b64,successCallback,errorCallback){
			var file = new Parse.File(details.name, { base64: b64});
			file.save().then(function(data) {
				it.fileData = data;
				console.log('save success',data)
				if(successCallback)
					successCallback(data);
			}, function(error) {
				console.log('save error',error)
				if(errorCallback)
					errorCallback(error)
			});
		}
	}

	it.fileService = fileService;
	return fileService;
});





/****************************************************************************************************
roleSerivce: 	makes it easy to setup the roles which will be required on a website.
				this service is currently only used once to initially setup roles.
****************************************************************************************************/
app.factory('initSetupService', function($rootScope, $http, $q, config){
	//1st time admin user login
	//Setup permissions and assign 1st user as admin
	var privateData = {}
	var initSetupService = {
		setup:function(user, roleList){
			var deferred = $q.defer();
			if(!user || !user.objectId){
				console.error('You must create an account before you can setup roles.')
				deferred.reject();
			}else{
				var createdRoles = [];
				var superAdmin = user.objectId;
				initSetupService.setAdminRole(superAdmin).then(
					function(adminRole){
						privateData.adminRole = adminRole;
						createdRoles.push(adminRole);
						roleSetupArray = [];
						for(var i=0; i<roleList.length; i++)
							roleSetupArray.push(initSetupService.setOtherRole(roleList[i]))
						$q.all(roleSetupArray).then(function(data){
							for(var i=0; i<data.length; i++)
								createdRoles.push(data[i]);
							deferred.resolve(createdRoles);
						});
					}
				)
			}
			return deferred.promise;
		},
		setAdminRole:function(superAdmin){
			var deferred = $q.defer();
			var adminRole = {
				name: 'Admin',
				ACL: {
					"*":{
						read: true
					}
				},
				users: {
					"__op": "AddRelation",
					"objects": [{
						"__type": "Pointer",
						"className": "_User",
						"objectId": superAdmin
					}]
				}
			};
			adminRole.ACL[superAdmin] = {
				read: true,
				write: true
			}
			$http.post('https://api.parse.com/1/classes/_Role', adminRole).success(function(data){
				adminRole.response = data;
				deferred.resolve(adminRole);
			}).error(function(error, data){
				deferred.reject({error:error,data:data});
			});

			return deferred.promise;
		},
		setOtherRole:function(roleName){
			var deferred = $q.defer();
			var roleParams = {
				name: roleName,
				ACL: {
					"*":{
						read: true
					},
					"role:Admin":{
						read: true,
						write: true
					}
				},
				roles: {
					"__op": "AddRelation",
					"objects": [
					{
						"__type": "Pointer",
						"className": "_Role",
						"objectId": privateData.adminRole.response.objectId
					}
					]
				}
			};
			$http.post('https://api.parse.com/1/classes/_Role', roleParams).success(function(data){
				roleParams.response = data;
				deferred.resolve(roleParams);
			}).error(function(error, data){
				$scope.response = {error:error,data:data};
				deferred.reject({error:error,data:data});
			});

			return deferred.promise;
		}
	}
	it.initSetupService = initSetupService;
	return initSetupService;
});