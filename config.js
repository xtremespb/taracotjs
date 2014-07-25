var config = {
	"port": "3000",
	"layouts": {
		"default": "index",
		"avail": [
			"index"
		]
	},
	"locales": [
		"en",
		"ru"
	],
	"dir": {
		"storage": "../public/files",
		"avatars": "../public/img/avatars",
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
	"mailer" : {
		"sender": "TaracotJS <noreply@taracot.org>",
		"transport" : "sendmail",
		"sendmail" : {
    		path: 'c:/XTreme/local/usr/bin/sendmail.exe'
		},
		"smtp" : {
		    service: 'Gmail',
		    auth: {
		        user: 'gmail.user@gmail.com',
		        pass: 'userpass'
		    }
		}
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
	"captcha": "captcha_native",
	"graphicsmagick": true,
	"max_upload_file_mb": 100,
	"max_upload_image_mb": 5,
	"max_edit_file_kb": 1024,
	"salt": "sl0HcBdMEXWsJpuMFv8yDT1lZYEo7kyMcbKUCNySja0C0sNSEFgVPMDrkFwjhgEd"
};

module.exports = config;
