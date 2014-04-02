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





/****************************************************************************************************
dataService: 	Allows you to create new data objects, store them locally, and sync them realtime
				as changes occurr.
				When you use the dataService, you create a new .resource object.  ie. from your
				controller you would call: 
				var myList = new dataService.resource(className, identifier, isLive, isLocal, query)

				in the controller, you will want to create a $on listener, and if you want to speed
				up the loading of locally stored content, you will want to call the .item.list() 
				method.
				myList.item.list().then(function(data){
					$scope.myList = data;
				})
				$rootScope.$on(myList.listenId, function(event, data){
					$scope.myList = data;
				})

				You can also assign the myList.item to a local scope and use it as a tool ie.
				$scope.tools = {
					myItem: myList.item
				}
				Doing this allows you to make calls from within the html its self ie.
				ng-repeat="item in myList.results"
				ng-click="tools.myItem.remove(item)"

				Finally, if you wish to utilize the WIP, you will want to use the datastore directive
				See documentation for the datastore directive.

				This service requires Firebase to dynamically update the content.  It uses 
				localStorage to save information locally for wip and quick access.
****************************************************************************************************/
app.factory('dataService', function ($rootScope, $http, $q, config, Firebase) {
	//Set local dataStore obj if it doesn't exist
	if(!localStorage.getItem('RQdataStore'))
		localStorage.setItem('RQdataStore', angular.toJson({
			resource: {},
			resourceList: [],
			notLocal:[], 
			wip: {}
		}))

	//Load local dataStore
	var dataStore = angular.fromJson(localStorage.getItem('RQdataStore'));



	var DS = {
		data: function(){
			return dataStore;
		},
		resourceList: function(){
			return dataStore.resourceList;
		},
		localSave:function(){
			var tempData = angular.fromJson(angular.toJson(dataStore))
				for(var i=0; i<tempData.notLocal.length; i++)
					delete tempData.resource[tempData.notLocal[i]]
			localStorage.setItem('RQdataStore', angular.toJson(tempData))
		},
		wip: {
			add: function(identifier, object){
				if(object.objectId){
					if(!dataStore.wip[identifier])
						dataStore.wip[identifier] = {};
					dataStore.wip[identifier][object.objectId] = object;
					DS.localSave();
				}
			},
			remove: function(identifier, objectId){
				if(typeof(object)=='object')
					objectId = objectId.objectId

				if(dataStore.wip[identifier])
					delete dataStore.wip[identifier][objectId];
			},
			list: function(){
				return dataStore.wip;
			},
			isInEdit: function(identifier, object){
				if(dataStore.wip[identifier])
					return !!dataStore.wip[identifier][object.objectId]
			},
			keepResource: function(identifier, resource){
				if(dataStore.wip[identifier])
					for(var i=0; i<resource.length; i++)
						if(dataStore.wip[identifier][resource[i].objectId])
							resource[i] = dataStore.wip[identifier][resource[i].objectId]
				return resource;
			}
		},
		resource: function(className, identifier, isLive, isLocal, query){
			var resource = this;
			resource.listenId = 'DS-'+identifier;
			resource.config = {
				className: className,
				identifier: identifier,
				isLive: isLive,
				isLocal: isLocal,
				query: query,
			}
			if(isLive){
				resource.config.liveRef = new Firebase(config.fireRoot+identifier)
				resource.config.liveRef.on('value', function(dataSnapshot) {
					// alert(dataSnapshot.val())
					if(dataStore.resource[identifier])
						var lastUpdate = dataStore.resource[identifier].liveSync;
					if(dataSnapshot.val() != lastUpdate){
						resource.loadData(dataSnapshot.val())
					}else{
						$rootScope.$broadcast(resource.listenId, dataStore.resource[identifier]);
					}
				});
			}
			if(!isLocal){
				if(dataStore.notLocal && dataStore.notLocal.indexOf(resource.config.identifier) == -1)
					dataStore.notLocal.push(resource.config.identifier)
			}
			if(dataStore.resourceList.indexOf(identifier) == -1)
				dataStore.resourceList.push(identifier)

 			resource.setQuery = function(query){
				resource.config.query = query;
			}
			resource.loadData = function(lastUpdate){
				var deferred 	= $q.defer();
				var className 	= resource.config.className
				var identifier 	= resource.config.identifier
				var query = '';
				if(resource.config.query)
					query = '?'+resource.config.query

				$http.get(config.parseRoot+'classes/'+className+query).success(function(data){
					dataStore.resource[identifier] = {
						identifier: identifier,
						results: DS.wip.keepResource(identifier, data.results),
						liveSync: lastUpdate
					}

					DS.localSave();
					$rootScope.$broadcast(resource.listenId, dataStore.resource[identifier]);
					deferred.resolve(dataStore.resource[identifier]);
				}).error(function(data){
					deferred.reject(data);
				});
				return deferred.promise;
			}
			function fireBroadcast(timestamp){
				if(resource.config.liveRef)
					resource.config.liveRef.set(timestamp)
				else
					resource.loadData();
			}
			this.item = {
				list: function(){
					var deferred = $q.defer();
					var className 	= resource.config.className
					var identifier 	= resource.config.identifier
					if(dataStore.resource[identifier]){
						deferred.resolve(dataStore.resource[identifier]);
						if(!resource.config.isLive)
							resource.loadData()
					}else{
						resource.loadData().then(function(data){
							deferred.resolve(data);
						})
					}
					return deferred.promise;
				},
				get: function(objectId){
					var deferred = $q.defer();
					var className 	= resource.config.className
					var identifier 	= resource.config.identifier

					var resourceList = dataStore.resource[identifier].results;
					var requestedResource = false;
					for(var i=0; i<resourceList.length; i++){
						if(resourceList[i].objectId == objectId)
							requestedResource = resourceList[i]
					}
					if(requestedResource)
						deferred.resolve(requestedResource);
					else
						$http.get(config.parseRoot+'classes/'+className+'/'+objectId).success(function(data){
							deferred.resolve(data);
						}).error(function(data){
							deferred.reject(data);
						});
					return deferred.promise;
				},
				save: function(object){
					if(!object)
						object = {};
					if(object.objectId)
						return this.update(object)
					else
						return this.add(object)
				},
				add: function(object){
					var deferred = $q.defer();
					var className = resource.config.className;
					var identifier = resource.config.identifier;
					var objectId = object.objectId;

					$http.post(config.parseRoot+'classes/'+className, object).success(function(data){
						DS.wip.remove(identifier, objectId)
						fireBroadcast(data.createdAt)
						deferred.resolve(data);
					}).error(function(error, data){
						resource.loadData();
						deferred.reject(data);
					});
					return deferred.promise;
				},
				update: function(object){
					var deferred = $q.defer();
					var className = resource.config.className;
					var identifier = resource.config.identifier;
					var objectId = object.objectId;

					delete object.objectId;
					delete object.createdAt;
					delete object.updatedAt;

					$http.put(config.parseRoot+'classes/'+className+'/'+objectId, object).success(function(data){
						DS.wip.remove(identifier, objectId)
						fireBroadcast(data.updatedAt)
						deferred.resolve(data);
					}).error(function(error, data){
						resource.loadData();
						deferred.reject(data);
					});
					return deferred.promise;
				},
				remove: function(object){
					var deferred = $q.defer();
					var className = resource.config.className
					var identifier = resource.config.identifier;
					var objectId = object.objectId;

					$http.delete(config.parseRoot+'classes/'+className+'/'+object.objectId).success(function(data){
						var deletedAt = new Date();
						DS.wip.remove(identifier, objectId)
						fireBroadcast(deletedAt.toISOString())
						deferred.resolve(data);
					}).error(function(error, data){
						resource.loadData();
						deferred.reject(data);
					});
					return deferred.promise;
				}
			}
			this.remove = function(){
				var identifier = resource.config.identifier;

				var posInNotLocal = dataStore.notLocal.indexOf[identifier]
				if(posInNotLocal != -1)
					dataStore.notLocal.splice(posInNotLocal, 1)
				delete dataStore.resource[identifier]
				var posInResourceList = dataStore.resourceList.indexOf[identifier]
				if(posInResourceList != -1)
					dataStore.notLocal.splice(posInResourceList, 1)
				delete dataStore.wip[identifier]

				DS.localSave();
			}
		}
	}
	it.DS = DS;
	return DS;
});





/****************************************************************************************************
mediaService: 	Allows you to easily manage and provide access to users when adding, or editing 
				any file or refrence.  The first use case is adding a picture to a photo gallery.
				Most all files are supported.  Search and filter is available.  
****************************************************************************************************/
app.factory('mediaService', function ($rootScope, $http, $q, config, dataService) {
	
});