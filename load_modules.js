var load_modules = {
	blocks: [{
		name: 'menu'
	}],
	modules: [{
		name: 'auth',
		prefix: '/auth/',
		cp_prefix: ''
	}, {
		name: 'cp',
		prefix: '/cp/',
		cp_prefix: ''
	}, {
		name: 'user',
		prefix: '',
		cp_id: 'users',
		cp_prefix: '/cp/users/'
	}, {
		name: 'settings',
		prefix: '',
		cp_id: 'settings',
		cp_prefix: '/cp/settings/'
	}, {
		name: 'files',
		prefix: '/files/',
		cp_id: 'files',
		cp_prefix: '/cp/files/'
	}, {
		name: 'browse',
		prefix: '',
		cp_id: 'files',
		cp_prefix: '/cp/browse/',
		hidden: true
	}, {
		name: 'pages',
		prefix: '',
		cp_id: 'pages',
		cp_prefix: '/cp/pages/'
	}, {
		name: 'menu',
		prefix: '',
		cp_id: 'menu',
		cp_prefix: '/cp/menu/'
	}, {
		name: 'textedit',
		prefix: '',
		cp_id: 'textedit',
		cp_prefix: '/cp/textedit/',
		hidden: true
	}]
};

module.exports = load_modules;