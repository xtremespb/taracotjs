var config = {
	"taracotjs": "0.1",
	"default_layout": "layout",
	"locales": [
		"en",
		"ru"
	],
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
			"prefix": "/user/",
			"cp_id": "users",
			"cp_prefix": "/cp/users/"
		},
		{
			"name": "settings",
			"prefix": "/settings/",
			"cp_id": "settings",
			"cp_prefix": "/cp/settings/"
		}
	]
};

module.exports = config;