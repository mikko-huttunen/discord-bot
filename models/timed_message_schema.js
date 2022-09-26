import mongoose from "mongoose";

const timedMessageSchema = new mongoose.Schema({
    id: { type: String, required: true },
    user: { type: String, required: true },
    message: { type: String, required: true },
    date: { type: Date, required: true},
    channelId: { type: String, required: true }
}, { autoCreate: false });

export const timedMessage = mongoose.model("timed-messages", timedMessageSchema);