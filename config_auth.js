module.exports = {

    'facebook': {
        'clientID': 'your client ID here',
        'clientSecret': 'your client secret here',
        'requestURL': 'https://www.facebook.com/dialog/oauth?client_id=[client_id]&redirect_uri=[redirect_uri]&response_type=code&scope=email',
        'callbackURL': 'https://demo.taracot.org/auth/facebook'
    },

    'google': {
        'clientID': 'your client ID here',
        'clientSecret': 'your client secret here',
        'requestURL': 'https://accounts.google.com/o/oauth2/auth?redirect_uri=[redirect_uri]&response_type=code&client_id=[client_id]&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile',
        'callbackURL': 'https://demo.taracot.org/auth/google'
    },

    'yandex': {
        'clientID': 'your client ID here',
        'clientSecret': 'your client secret here',
        'requestURL': 'https://oauth.yandex.ru/authorize?response_type=code&client_id=[client_id]',
        'callbackURL': 'https://demo.taracot.org/auth/yandex'
    },

    'vk': {
        'clientID': 'your client ID here',
        'clientSecret': 'your client secret here',
        'requestURL': 'http://oauth.vk.com/authorize?client_id=[client_id]&redirect_uri=[redirect_uri]&response_type=code',
        'callbackURL': 'https://demo.taracot.org/auth/vk'
    }

};
