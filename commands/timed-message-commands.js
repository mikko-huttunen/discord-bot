import { ChannelType, SlashCommandBuilder } from "discord.js";
import { handleTimedMessage } from "../functions/timed_messages/timed_message.js";

export const listTimedMessagesCommand = {
    data: new SlashCommandBuilder()
		.setName("listtimedmessages")
		.setDescription("List of your timed messages"),
	execute: async (interaction) => {
        handleTimedMessage(interaction);
    },
};

export const timedMessageCommand = {
    data: new SlashCommandBuilder()
		.setName("timedmessage")
		.setDescription("Create new timed message")
        .addChannelOption(option =>
            option.setName("channel")
                .setDescription("Channel to send message to")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)),
	execute: async (interaction) => {
        handleTimedMessage(interaction);
    },
};

export const deleteTimedMessageCommand = {
    data: new SlashCommandBuilder()
        .setName("deletetimedmessage")
        .setDescription("Delete timed message")
        .addStringOption(option =>
                option.setName("id")
                    .setDescription("ID of the timed message to delete")
                    .setMaxLength(6)
                    .setRequired(true)),
    execute: async (interaction) => {
        handleTimedMessage(interaction);
    },
};