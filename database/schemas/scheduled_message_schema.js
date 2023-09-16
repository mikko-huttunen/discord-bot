import mongoose from "mongoose";

const scheduledMessageSchema = new mongoose.Schema({
    id: { type: String, required: true },
    author: { type: String, required: true },
    message: { type: String, required: true },
    dateTime: { type: Date, required: true },
    repeat: { type: String, required: false },
    guildId: { type: String, required: true },
    channelId: { type: String, required: true }
}, { autoCreate: false });

export const scheduledMessage = mongoose.model("scheduled-messages", scheduledMessageSchema);