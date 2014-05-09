var auth = {
	check : function(req) {
		if (typeof req.session == 'undefined' || typeof req.session.username == 'undefined') {
			return false;
		}
		return true;
	}
};

module.exports = auth;