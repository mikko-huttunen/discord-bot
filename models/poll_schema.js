import mongoose from "mongoose";

const pollSchema = new mongoose.Schema({
    pollId: { type: String, required: true },
    msgId: { type: String, required: true },
    author: { type: String, required: true },
    topic: { type: String, required: true },
    date: { type: Date, required: true},
    channelId: { type: String, required: false },
    options: { type: [String], required: true },
    votes: {
        number: { type: Number, required: true },
        entry: [{
            user: { type: String, required: true },
            answer: { type: Number, required: true }
        }],
    }
}, { autoCreate: false });

export const poll = mongoose.model("polls", pollSchema);