var config = {
	
	taracotjs : '0.1',
	default_layout : 'layout',
	locales : ['en', 'ru'],
	cookie_secret : 'taracot cookie secret',
	session_secret : 'taracot session secret',
	session_prefix : 'taracotjs',
	modules : [
							{  
								'name': 'auth',
								'prefix': '/auth/'
						 	}
						 ]

};

module.exports = config;