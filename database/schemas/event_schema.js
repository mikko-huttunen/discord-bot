import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
    eventId: { type: String, required: true },
    msgId: { type: String, required: true },
    author: { type: String, required: true },
    name: { type: String },
    description: { type: String },
    thumbnail: { type: String },
    dateTime: { type: Date, required: true },
    repeat: { type: String, required: false },
    guildId: { type: String, required: true },
    channelId: { type: String, required: true },
    attendees: {
        number: { type: Number, required: true },
        entries: [{
            id: { type: String, required: true },
            name: { type: String, required: true }
        }],
    }
}, { autoCreate: false });

export const event = mongoose.model("events", eventSchema);