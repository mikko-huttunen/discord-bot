import mongoose from "mongoose";

const voteSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    pollId: { type: String, required: true },
    userId: { type: String, required: true },
    name: { type: String, required: true },
    vote: { type: Number, required: true }
}, { autoCreate: false });

export const poll = mongoose.model("polls", voteSchema);