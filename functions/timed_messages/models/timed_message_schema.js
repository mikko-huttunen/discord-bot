import mongoose from "mongoose";

const timedMessageSchema = new mongoose.Schema({
    id: { type: String, required: true },
    author: { type: String, required: true },
    message: { type: String, required: true },
    date: { type: Date, required: true },
    repeat: { type: String, required: false },
    channelId: { type: String, required: true }
}, { autoCreate: false });

export const timedMessage = mongoose.model("timed-messages", timedMessageSchema);