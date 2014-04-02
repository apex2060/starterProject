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



var NotebookCtrl = app.controller('NotebookCtrl', function($rootScope, $scope, $q, config, dataService, fileService){
	var myNotebooks = new dataService.resource('notebook', '235ea8/notebook', true, true);
		// myNotebooks.setQuery('where={"category":"apple"}');
	myNotebooks.item.list().then(function(data){
		$scope.myNotebooks = data;
	})
	$rootScope.$on(myNotebooks.listenId, function(event, data){
		$scope.myNotebooks = data;
	})

	var tools = {
		notebook: myNotebooks.item,
		focusNotebook: function(notebook){
			$rootScope.temp.currentNotebook = notebook;
		},
		setNotebookPicture: function(details,src){
			it.details=details
			it.src=src

			if(!$rootScope.temp.currentNotebook)
				$rootScope.temp.currentNotebook = {};
			$rootScope.$apply(function(){
				$rootScope.temp.currentNotebook.picture = {
					temp: true,
					status: 'uploading',
					class: 'grayscale',
					name: 'Image Uploading...',
					src: src
				};
			})

			fileService.upload(details,src,function(data){
				$rootScope.$apply(function(){
					$rootScope.temp.currentNotebook.picture = {
						name: data.name(),
						src: data.url()
					}
				})
			});
		},
		addNotebook: function(notebook){
			myNotebooks.item.save(notebook)
			$scope.temp.notebook = {};
		}
	}
	it.myNotebooks = myNotebooks;
	$scope.tools = tools;
	it.NotebookCtrl=$scope;
});


var NoteCtrl = app.controller('NoteCtrl', function($rootScope, $scope, $q, config, dataService){
	var myNotes = new dataService.resource('notes', '235ea8/myNotes', false, true);
		// myNotes.setQuery('where={"category":"apple"}');
	myNotes.item.list().then(function(data){
		$scope.myNotes = data;
	})
	$rootScope.$on(myNotes.listenId, function(event, data){
		$scope.myNotes = data;
	})

	var tools = {
		note: myNotes.item,
		addNote: function(note){
			myNotes.item.save(note)
			$scope.temp.note = {};
		}
	}
	it.myNotes = myNotes;
	$scope.tools = tools;
	it.NoteCtrl=$scope;
});



var ArticleCtrl = app.controller('ArticleCtrl', function($rootScope, $scope, $q, config, dataService){
	var myArticle = new dataService.resource('notes', '235ea8/myArticle', false, false);
		myArticle.setQuery('where={"body":"abc"}');

	myArticle.item.list().then(function(data){
		$scope.myArticle = data;
	})
	$rootScope.$on(myArticle.listenId, function(event, data){
		$scope.myArticle = data;
	})

	var tools = {
		article: myArticle.item,
		addArticle: function(article){
			myArticle.item.save(article)
			$scope.temp.article = {};
		}
	}
	it.myArticle = myArticle;
	$scope.tools = tools;
	it.ArticleCtrl=$scope;
});