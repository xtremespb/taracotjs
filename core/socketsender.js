var crypto = require('crypto');

module.exports = function(app) {
    var redis_client = app.get('redis_client');
    var socketsender = {
        emit: function(userid, msgtype, msg) {
            if (!userid || !msgtype || !msg) return;
            var io = app.get('socket.io');
            var sid = userid + crypto.createHash('md5').update(app.get('config').salt + '.' + userid).digest('hex');
            redis_client.get('taracot_socketio_sessions_' + sid, function(err, _sessions) {
                var sessions = [];
                if (_sessions) sessions = _sessions.split(',');
                for (var i = 0; i < sessions.length; i++) {
                    if (io.sockets.connected[sessions[i]]) io.sockets.connected[sessions[i]].emit(msgtype, msg);
                }
            });
        }
    };
    return socketsender;
};
