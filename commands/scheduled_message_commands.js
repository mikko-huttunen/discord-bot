import { ChannelType, SlashCommandBuilder } from "discord.js";
import { createScheduledMessage, deleteScheduledMessage, listScheduledMessages } from "../functions/scheduled_messages.js";
import { CHANNEL, ID } from "../variables/constants.js";

export const listScheduledMessagesCommand = {
    data: new SlashCommandBuilder()
		.setName("listscheduledmessages")
		.setDescription("List of your scheduled messages"),
	execute: async (interaction) => {
        listScheduledMessages(interaction);
    },
};

export const scheduledMessageCommand = {
    data: new SlashCommandBuilder()
		.setName("scheduledmessage")
		.setDescription("Create new scheduled message")
        .addChannelOption(option =>
            option.setName(CHANNEL)
                .setDescription("Channel to send message to")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)),
	execute: async (interaction) => {
        createScheduledMessage(interaction);
    },
};

export const deleteScheduledMessageCommand = {
    data: new SlashCommandBuilder()
        .setName("deletescheduledmessage")
        .setDescription("Delete scheduled message")
        .addStringOption(option =>
                option.setName(ID)
                    .setDescription("ID of the scheduled message to delete")
                    .setMaxLength(6)
                    .setRequired(true)),
    execute: async (interaction) => {
        deleteScheduledMessage(interaction);
    },
};