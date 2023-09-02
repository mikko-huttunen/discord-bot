import mongoose from "mongoose";

const pollSchema = new mongoose.Schema({
    pollId: { type: String, required: true },
    msgId: { type: String, required: true },
    author: { type: String, required: true },
    topic: { type: String, required: true },
    dateTime: { type: Date, required: true },
    repeat: { type: String, required: true },
    guildId: { type: String, required: true },
    channelId: { type: String, required: false },
    options: { type: [String], required: true },
    votes: { type: Number, required: true }
}, { autoCreate: false });

export const poll = mongoose.model("polls", pollSchema);