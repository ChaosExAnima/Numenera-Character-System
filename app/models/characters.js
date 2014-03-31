/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var CharacterSchema = new Schema({
	player: String,
	creationDate: { type: Date, default: Date.now },
	
	name: { type: String, index: true },
	descriptor: String,
	type: String,
	focus: String,
	
	portrait: String,
	background: String,
	personality: String,
	notes: String,
	
	tier: { type: Number, default: 1, min: 1, max: 6 },
	effort: { type: Number, default: 1, min: 1 },

	might: {
		total: { type: Number, default: 10, min: 1 },
		pool: Number,
		edge: Number
	},
	speed: {
		total: { type: Number, default: 10, min: 1 },
		pool: Number,
		edge: Number
	},
	intellect: {
		total: { type: Number, default: 10, min: 1 },
		pool: Number,
		edge: Number
	},

	skills: [{
		name: String,
		trained: { type: Boolean, default: true },
		specialized: { type: Boolean, default: false }
	}],

	specialAbilities: [String],

	impaired: { type: Boolean, default: false },
	debilitated: { type: Boolean, default: false },

	recovery: {
		roll: { type: Number, default: 1 },
		oneAction: { type: Boolean, default: false },
		tenMinutes: { type: Boolean, default: false },
		oneHour: { type: Boolean, default: false },
		eightHours: { type: Boolean, default: false }
	},

	armor: Number,

	attacks: [{
		name: String,
		mod: Number,
		damage: String
	}],

	experience: {
		total: Number,
		statPools: { type: Boolean, default: false },
		edge: { type: Boolean, default: false },
		effort: { type: Boolean, default: false },
		skills: { type: Boolean, default: false },
		log: [{
			date: { type: Date, default: Date.now },
			val: Number,
			notes: String
		}]
	},

	cyphers: [String],
	cypherLimit: Number,

	artifacts: [String],

	oddities: [String],

	equipment: [String],

	shins: Number
});

CharacterSchema.statics = {
	findByName: function(name, callback) {
		this.findOne({ name: name }, callback);
	},

	findByNameAndUpdate: function(name, data, callback) {
		this.findOneAndUpdate({ name: name }, data, function(err, character) {
			var Log = mongoose.model('Log');

			Log.create({
				user: 'Ephraim',
				characterId: character._id,
				character: character.name,
				changes: data
			},
			function(err, data) {
				if(err) {
					console.warn('Unable to save log:', err);
				}
			});

			callback(err, character);
		});
	}
};

mongoose.model('Character', CharacterSchema);