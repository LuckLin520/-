var mongoose = require("mongoose");
module.exports = mongoose.Schema({
	username: String,
	pwd: String,
	email: String
});