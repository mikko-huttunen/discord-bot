import { SlashCommandBuilder } from "discord.js";
import { addRole, listRoles, myRoles, removeRole } from "../functions/roles.js";
import { ROLE } from "../variables/constants.js";

export const rolesCommand = {
    data: new SlashCommandBuilder()
		.setName("roles")
		.setDescription("List of all roles and members"),
	execute: async (interaction) => {
        await listRoles(interaction);
    }
}

export const myRolesCommand = {
    data: new SlashCommandBuilder()
		.setName("myroles")
		.setDescription("List of your roles"),
	execute: async (interaction) => {
        myRoles(interaction);
    }
}

export const addRoleCommand = {
    data: new SlashCommandBuilder()
		.setName("addrole")
		.setDescription("Add role to yourself")
        .addRoleOption(option =>
            option.setName(ROLE)
                .setDescription("Role to add")
                .setRequired(true)),
	execute: async (interaction) => {
        await addRole(interaction);
    }
}

export const removeRoleCommand = {
    data: new SlashCommandBuilder()
		.setName("removerole")
		.setDescription("Remove role from yourself")
        .addRoleOption(option =>
            option.setName(ROLE)
                .setDescription("Role to remove")
                .setRequired(true)),
	execute: async (interaction) => {
        await removeRole(interaction);
    }
}