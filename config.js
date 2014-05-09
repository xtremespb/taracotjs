var config = {
	
	taracotjs : '0.1',
	default_layout : 'layout',
	locales : ['en', 'ru'],
	cookie_secret : 'taracot cookie secret',
	session_secret : 'taracot session secret',
	session_prefix : 'taracotjs',
	admin_username : 'admin',
	admin_password : 'a59a5399bb3b181d9cbc6230b9bb87ca',
	salt : 'LtONCvBnPtXmFk1H49aMGOWe4U4LHMLqQoDeS0v42pypepFeinQkMnnAVrxqTNG2',
	modules : [
							{  
								'name': 'auth',
								'prefix': '/auth/',
								'cp_prefix': ''
						 	},
						 	{  
								'name': 'cp',
								'prefix': '/cp/',
								'cp_prefix': ''
						 	},
						 	{
						 		'name': 'test',
						 		'prefix': '/test/',
						 		'cp_id': 'test',
						 		'cp_prefix': '/cp/test/'
						 	}
			  ]

};

module.exports = config;