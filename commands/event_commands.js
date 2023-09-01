import { ChannelType, SlashCommandBuilder } from "discord.js";
import { handleEvent } from "../functions/events.js";
import { CHANNEL, ID } from "../variables/constants.js";

export const listEventsCommand = {
    data: new SlashCommandBuilder()
		.setName("listevents")
		.setDescription("List of active events"),
	execute: async (interaction) => {
        handleEvent(interaction);
    },
};

export const addEventCommand = {
    data: new SlashCommandBuilder()
		.setName("event")
		.setDescription("Create new event")
        .addChannelOption(option =>
            option.setName(CHANNEL)
                .setDescription("Channel to publish event to")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)),
	execute: async (interaction) => {
        handleEvent(interaction);
    },
};

export const deleteEventCommand = {
    data: new SlashCommandBuilder()
        .setName("deleteevent")
        .setDescription("Delete event")
        .addStringOption(option =>
            option.setName(ID)
                .setDescription("ID of the event to delete")
                .setMaxLength(6)
                .setRequired(true)),
    execute: async (interaction) => {
        handleEvent(interaction);
    },
};