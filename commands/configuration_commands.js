import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { changeConfiguration } from "../functions/configuration.js";

export const configureCommand = {
    data: new SlashCommandBuilder()
		.setName("configure")
		.setDescription("Change current bot configuration (Leave empty to list current configuration)")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addRoleOption(option =>
            option.setName("default-role")
                .setDescription("Default role to add to a new members")
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName("display-welcome-message")
                .setDescription("Display welcome message when a new member joins the server")
                .setRequired(false))
        .addChannelOption(option =>
            option.setName("welcome-message-channel")
                .setDescription("Channel the welcome message is posted to if enabled")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName("nsfw-filter")
                .setDescription("NSFW filter for image search (true=ON, false=OFF")
                .setRequired(false)),
	execute: async (interaction) => {
        changeConfiguration(interaction);
    }
};