module.exports = function(db, ensure_indexes, config) {
    var is = {
            name: 'files',
            version: '0.5.170',
            collections: function(_callback) {
                // Create collections
                _callback();
            },
            indexes: function(_callback) {
                // Create indexes
                _callback();
            },
            defaults: function(_callback) {
                // Create default values
                _callback();
            },
            misc: function(_callback) {
                // Misc. tasks
                _callback();
            },
            uninstall: function(_callback) {
                // Uninstall tasks
                _callback();
            }
        };
    return is;
};
