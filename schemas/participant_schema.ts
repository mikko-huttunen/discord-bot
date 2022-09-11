const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema({
    user: { type: String, required: true },
    nickname: { type: String }
})

module.exports = mongoose.model("weekly-participants", participantSchema);