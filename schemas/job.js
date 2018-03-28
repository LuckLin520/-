var mongoose = require("mongoose");
module.exports = mongoose.Schema({
	logo: String,
	jobName: String,
	companyName: String,
	jobExp: String,
	jobType: String,
	jobPlace: String,
	jobMoney: String
})