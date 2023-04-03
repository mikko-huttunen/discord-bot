import mongoose from "mongoose";

const attendeeSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    eventId: { type: String, required: true },
    userId: { type: String, required: true },
    name: { type: String, required: true }
}, { autoCreate: false });

export const event = mongoose.model("events", attendeeSchema);