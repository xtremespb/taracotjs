#!/usr/bin/env node

var config = require('../config'),
    version = require('../version');

var app = require('../app'),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    port = config.port || process.env.PORT || 3000,
    redis_client = app.get('redis_client'),
    redis_subscriber;

if (config.redis.active) {
    var _redis = require("redis");
    redis_subscriber = _redis.createClient(config.redis.port, config.redis.host, {
        return_buffers: false
    });
    redis_subscriber.subscribe(config.redis.prefix + 'medved_ipc');
    redis_subscriber.subscribe(config.redis.prefix + 'medved_broadcast');
    redis_subscriber.on("message", function(channel, message) {
        if (channel && channel == config.redis.prefix + 'medved_ipc' && message && message.length) {
            var msg = JSON.parse(message);
            if (!msg) return;
            if (io && io.sockets.connected[msg.session]) io.sockets.connected[msg.session].emit(msg.msgtype, msg.msg);
        }
        if (channel && channel == config.redis.prefix + 'medved_broadcast' && message && message.length) {
            var bmsg = JSON.parse(message);
            if (!bmsg) return;
            for (var key in io.sockets.connected)
                if (io && io.sockets.connected[key]) io.sockets.connected[key].emit(bmsg.msgtype, bmsg.msg);
        }
    });
    redis_subscriber.on("connect", function(err) {
        app.set('redis_connected', true);
    });
    redis_subscriber.on("error", function(err) {
        app.set('redis_connected', false);
    });
}

var server = http.listen(port, function() {
    if (config.gid) process.setgid(config.gid);
    if (config.uid) process.setuid(config.uid);
    console.log(" _____                         _     ___ _____ \n" + "|_   _|                       | |   |_  /  ___|\n" + "  | | __ _ _ __ __ _  ___ ___ | |_    | \\ `--. \n" + "  | |/ _` | '__/ _` |/ __/ _ \\| __|   | |`--. \\\n" + "  | | (_| | | | (_| | (_| (_) | |_/\\__/ /\\__/ /\n" + "  \\_/\\__,_|_|  \\__,_|\\___\\___/ \\__\\____/\\____/ \n");
    console.log('[%s] server listening on port: ' + port, process.pid);
});

io.on('connection', function(socket) {

    socket.on('set_session', function(userid, userid_hash) {
        if (userid && userid.match(/^[0-9a-z]{24}$/) && userid_hash && userid_hash.match(/^[0-9a-z]{32}$/)) {
            var sid = userid + userid_hash;
            redis_client.set(config.redis.prefix + 'socketio_online_' + userid, 1);
            redis_client.publish(app.get('config').redis.prefix + 'medved_broadcast', JSON.stringify({ msgtype: 'taracot_user_online', msg: { id: userid } }));
            redis_client.get(config.redis.prefix + 'socketio_sessions_' + sid, function(err, _sessions) {
                var sessions = [];
                if (_sessions) sessions = _sessions.split(',');
                sessions.push(socket.id);
                for (var i = 0; i < sessions.length; i++)
                    if (!io.sockets.connected[sessions[i]]) sessions.splice(i, 1);
                redis_client.set(config.redis.prefix + 'socketio_sessions_' + sid, sessions.join(','));
                redis_client.set(config.redis.prefix + 'socketio_sid_' + socket.id, sid);
            });
        }
    });

    socket.on('disconnect', function() {
        if (socket.id)
            var socket_id = socket.id;
            redis_client.get(config.redis.prefix + 'socketio_sid_' + socket.id, function(err, _sid) {
                if (!_sid) return;
                var _userid = _sid.substr(0, 24);
                redis_client.publish(app.get('config').redis.prefix + 'medved_broadcast', JSON.stringify({ msgtype: 'taracot_user_offline', msg: { id: _userid } }));
                redis_client.set(config.redis.prefix + 'socketio_online_' + _userid, 0);
                redis_client.get(config.redis.prefix + 'socketio_sessions_' + _sid, function(err, _sessions) {
                    if (!_sessions) return;
                    var sessions = _sessions.split(',');
                    for (var i = 0; i < sessions.length; i++)
                        if (!io.sockets.connected[sessions[i]]) sessions.splice(i, 1);
                    redis_client.set(config.redis.prefix + 'socketio_sessions_' + _sid, sessions.join(','));
                    redis_client.del(config.redis.prefix + 'socketio_sid_' + socket_id);
                    if (!sessions.length) redis_client.del(config.redis.prefix + 'socketio_sessions_' + _sid);
                });
            });
    });

});

app.set('socket.io', io);