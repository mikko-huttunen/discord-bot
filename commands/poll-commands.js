import { ChannelType, SlashCommandBuilder } from "discord.js";
import { handlePoll } from "../functions/polls.js";

export const listPollsCommand = {
    data: new SlashCommandBuilder()
		.setName("listpolls")
		.setDescription("List of active polls"),
	execute: async (interaction) => {
        handlePoll(interaction);
    },
};

export const pollCommand = {
    data: new SlashCommandBuilder()
		.setName("poll")
		.setDescription("Create new poll")
        .addChannelOption(option =>
            option.setName("channel")
                .setDescription("Channel to send poll to")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true))
        .addStringOption(option =>
            option.setName("date")
                .setDescription("Date and time when the poll ends (dd.mm.yy hh:mm)")
                .setMinLength(6)
                .setMaxLength(16)
                .setRequired(true))
        .addStringOption(option =>
            option.setName("repeat")
                .setDescription("Poll repeat interval")
                .setRequired(true)
                .addChoices(
                    { name: "Never", value: "never" },
                    { name: "Daily", value: "daily" },
                    { name: "Weekly", value: "weekly" },
                    { name: "Monthly", value: "monthly" },
                    { name: "Yearly", value: "yearly" }
                ))
        .addStringOption(option =>
            option.setName("topic")
                .setDescription("Topic of the poll")
                .setMinLength(1)
                .setMaxLength(100)
                .setRequired(true))
        .addStringOption(option =>
                option.setName("option1")
                    .setDescription("Vote option 1")
                    .setMinLength(1)
                    .setMaxLength(50)
                    .setRequired(true))
        .addStringOption(option =>
                option.setName("option2")
                    .setDescription("Vote option 2")
                    .setMinLength(1)
                    .setMaxLength(50)
                    .setRequired(true))
        .addStringOption(option =>
                option.setName("option3")
                    .setDescription("Vote option 3")
                    .setMinLength(1)
                    .setMaxLength(50)
                    .setRequired(false))
        .addStringOption(option =>
                option.setName("option4")
                    .setDescription("Vote option 4")
                    .setMinLength(1)
                    .setMaxLength(50)
                    .setRequired(false))
        .addStringOption(option =>
                option.setName("option5")
                    .setDescription("Vote option 5")
                    .setMinLength(1)
                    .setMaxLength(50)
                    .setRequired(false))
        .addStringOption(option =>
                option.setName("option6")
                    .setDescription("Vote option 6")
                    .setMinLength(1)
                    .setMaxLength(50)
                    .setRequired(false))
        .addStringOption(option =>
                option.setName("option7")
                    .setDescription("Vote option 7")
                    .setMinLength(1)
                    .setMaxLength(50)
                    .setRequired(false))
        .addStringOption(option =>
                option.setName("option8")
                    .setDescription("Vote option 8")
                    .setMinLength(1)
                    .setMaxLength(50)
                    .setRequired(false))
        .addStringOption(option =>
                option.setName("option9")
                    .setDescription("Vote option 9")
                    .setMinLength(1)
                    .setMaxLength(50)
                    .setRequired(false))
        .addStringOption(option =>
                option.setName("option10")
                    .setDescription("Vote option 10")
                    .setMinLength(1)
                    .setMaxLength(50)
                    .setRequired(false)),
	execute: async (interaction) => {
        handlePoll(interaction);
    },
};

export const deletePollCommand = {
    data: new SlashCommandBuilder()
		.setName("deletepoll")
		.setDescription("Delete poll")
        .addStringOption(option =>
                option.setName("id")
                    .setDescription("ID of the poll to delete")
                    .setMaxLength(6)
                    .setRequired(true)),
	execute: async (interaction) => {
        handlePoll(interaction);
    },
};