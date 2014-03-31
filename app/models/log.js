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

mongoose.model('Log', LogSchema);