import mongoose from "mongoose";

const weeklyParticipantSchema = new mongoose.Schema({
    user: { type: String, required: true },
    nickname: { type: String }
}, { autoCreate: false });

export const weeklyParticipant = mongoose.model("weekly-participants", weeklyParticipantSchema);