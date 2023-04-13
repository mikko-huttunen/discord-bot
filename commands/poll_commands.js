import { ChannelType, SlashCommandBuilder } from "discord.js";
import { handlePoll } from "../functions/polls/polls.js";
import { CHANNEL, DAILY, DATE, ID, MONTHLY, NEVER, REPEAT, TOPIC, WEEKLY, YEARLY } from "../variables/constants.js";

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
            option.setName(CHANNEL)
                .setDescription("Channel to send poll to")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true))
        .addStringOption(option =>
            option.setName(DATE)
                .setDescription("Date and time when the poll ends (dd.mm.yy hh:mm)")
                .setMinLength(6)
                .setMaxLength(16)
                .setRequired(true))
        .addStringOption(option =>
            option.setName(REPEAT)
                .setDescription("Poll repeat interval")
                .setRequired(true)
                .addChoices(
                    { name: "Never", value: NEVER },
                    { name: "Daily", value: DAILY },
                    { name: "Weekly", value: WEEKLY },
                    { name: "Monthly", value: MONTHLY },
                    { name: "Yearly", value: YEARLY }
                ))
        .addStringOption(option =>
            option.setName(TOPIC)
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
            option.setName(ID)
                .setDescription("ID of the poll to delete")
                .setMaxLength(6)
                .setRequired(true)),
	execute: async (interaction) => {
        handlePoll(interaction);
    },
};