/**
 * Log Model
 * Track user changes to character sheets.
 */

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var LogSchema = new Schema({
	user: { type: String, index: true },
	date: { type: Date, default: Date.now },
	characterId: { type: Schema.Types.ObjectId, index: true },
	character: { type: String, index: true },
	changes: Object
});

LogSchema.statics = {
	createEscaped: function(data, callback) {
		var lo = require('lodash'),
			clean = {};

		lo.each(data.changes, function(val, key) {
			var newKey = key.split('.').join('-');
			clean[newKey] = val;
		});

		data.changes = clean;

		this.create(data, callback);
	}
};

mongoose.model('Log', LogSchema);