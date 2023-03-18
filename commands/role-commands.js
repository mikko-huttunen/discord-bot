import { SlashCommandBuilder } from "discord.js";
import { handleRoleCommand } from "../functions/handle_roles.js";

export const rolesCommand = {
    data: new SlashCommandBuilder()
		.setName("roles")
		.setDescription("List of all roles and members"),
	execute: async (interaction) => {
        await handleRoleCommand(interaction);
    }
}

export const myRolesCommand = {
    data: new SlashCommandBuilder()
		.setName("myroles")
		.setDescription("List of your roles"),
	execute: async (interaction) => {
        await handleRoleCommand(interaction);
    }
}

export const addRoleCommand = {
    data: new SlashCommandBuilder()
		.setName("addrole")
		.setDescription("Add role to yourself")
        .addRoleOption(option =>
            option.setName("role")
                .setDescription("Role to add")
                .setRequired(true)),
	execute: async (interaction) => {
        await handleRoleCommand(interaction);
    }
}

export const removeRoleCommand = {
    data: new SlashCommandBuilder()
		.setName("removerole")
		.setDescription("Remove role from yourself")
        .addRoleOption(option =>
            option.setName("role")
                .setDescription("Role to remove")
                .setRequired(true)),
	execute: async (interaction) => {
        await handleRoleCommand(interaction);
    }
}