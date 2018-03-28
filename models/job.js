var mongoose = require("mongoose");
var jobSchema = require("../schemas/job")
module.exports = mongoose.model("jobs", jobSchema);

