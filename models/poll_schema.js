import mongoose from "mongoose";

const pollSchema = new mongoose.Schema({
    id: { type: String, required: true },
    msgId: { type: String, required: true },
    user: { type: String, required: true },
    topic: { type: String, required: true },
    options: { type: [String], required: true },
    date: { type: Date, required: true},
    channelId: { type: String, required: false },
    responses: {
        number: { type: Number, required: true },
        entry: [{
            user: { type: String, required: true },
            answer: { type: Number, required: true }
        }],
    }
}, { autoCreate: false });

export const poll = mongoose.model("polls", pollSchema);