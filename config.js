var config = {
	"taracotjs": "0.042606",
	"layouts": {
		"default": "index",
		"avail": ["index"]
	},
	"locales": [
		"en",
		"ru"
	],
	"dir": {
		"storage": "../public/files",
		"tmp": "../tmp"
	},
	"cookie_secret": "RyPuUGSsPulhvQnNL0lLOJCQjjVM0xHw",
	"session_secret": "Dd7nMf1FawoIGPeps4NjVPJeSIqzjkgN",
	"redis": {
		"host": "localhost",
		"port": 6379,
		"prefix": "taracotjs",
		"password": ""
	},
	"log": {
		"console": {
			"level": "info",
			"colorize": true
		},
		"file": {
			"level": "error",
			"filename": "../logs/taracotjs.log",
			"json": false,
			"maxsize": 1048576,
			"maxFiles": 3
		},
		"stack": true
	},
	"mongo": {
		"url": "mongodb://localhost/taracotjs",
		"options": {
			"server": {
				"auto_reconnect": false,
				"poolSize": 10,
				"socketOptions": {
					"keepAlive": 1
				}
			},
			"db": {
				"numberOfRetries": 10,
				"retryMiliSeconds": 1000
			}
		}
	},
	"captcha": 'captcha_native',
	"graphicsmagick": true,
	"max_upload_file_mb": 100,
	"max_upload_image_mb": 5,
	"salt": "sl0HcBdMEXWsJpuMFv8yDT1lZYEo7kyMcbKUCNySja0C0sNSEFgVPMDrkFwjhgEd",
	"modules": [
		{
			"name": "auth",
			"prefix": "/auth/",
			"cp_prefix": ""
		},
		{
			"name": "cp",
			"prefix": "/cp/",
			"cp_prefix": ""
		},
		{
			"name": "user",
			"prefix": "",
			"cp_id": "users",
			"cp_prefix": "/cp/users/"
		},
		{
			"name": "settings",
			"prefix": "",
			"cp_id": "settings",
			"cp_prefix": "/cp/settings/"
		},
		{
			"name": "files",
			"prefix": "/files/",
			"cp_id": "files",
			"cp_prefix": "/cp/files/"
		},
		{
			"name": "pages",
			"prefix": "",
			"cp_id": "pages",
			"cp_prefix": "/cp/pages/"
		},
		{
			"name": "menu",
			"prefix": "",
			"cp_id": "menu",
			"cp_prefix": "/cp/menu/"
		}
	]
};

module.exports = config;