import { SlashCommandBuilder } from "discord.js";
import { listCommands } from "../functions/helpers/list_commands.js";

export const helpCommand = {
    data: new SlashCommandBuilder()
		.setName("help")
		.setDescription("Get list of all bot commands"),
	execute: async (interaction) => {
        listCommands(interaction);
    }
}