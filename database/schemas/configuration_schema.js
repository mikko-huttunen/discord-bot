import mongoose from "mongoose";

const configurationSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    defaultRoleId: { type: String, required: false },
    defaultRoleName: { type: String, required: false },
    displayWelcomeMessage: { type: Boolean, required: false },
    welcomeMessageChannel: { type: String, required: false },
    canManageRoles: { type: Boolean, required: false },
    nsfwFilter: { type: Boolean, required: false }
}, { autoCreate: false });

export const configuration = mongoose.model("configurations", configurationSchema);