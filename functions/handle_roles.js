import { EmbedBuilder } from "@discordjs/builders";
import { getBotRole } from "../data/bot_data.js";

export const handleRoleCommand = async (interaction) => {
    await interaction.guild.members.fetch()
        .then()
        .catch(error => console.log(error));

    const guildRoles = getGuildRoles(interaction.guild);
    const botRole = getBotRole();

    let roleEmbed = new EmbedBuilder().setColor(0xff0000);

    switch (interaction.commandName) {
        case "roles": {
            roleEmbed.setTitle("Roles");
            guildRoles.map((role) => roleEmbed.addFields({
                name: role.name,
                value: `${role.members}`,
            }));

            interaction.reply({ embeds: [roleEmbed], ephemeral: true });
            break;
        }

        case "myroles": {
            const userRoles = getUserRoleNames(interaction);

            if (userRoles.length <= 0) {
                interaction.reply({ content: "Sinulla ei ole rooleja...", ephemeral: true });
                break;
            }
            
            interaction.reply({ content: "Roolisi: " + userRoles.join(", "), ephemeral: true });
            break;
        }

        case "addrole": {
            const userRoles = Array.from(interaction.member.roles.cache.keys());
            const roleToAdd = interaction.options.getRole("role");

            if (!guildRoles.find(role => role.name.toLowerCase() === roleToAdd.name.toLowerCase())) {
                interaction.reply({ content: "Roolia **" + roleToAdd.name + "** ei ole olemassa!", ephemeral: true });
                break;
            }

            if (userRoles.includes(roleToAdd.id)) {
                interaction.reply({ content: "Sinulla on jo rooli **" + roleToAdd.name + "**!", ephemeral: true });
                break;
            }

            if (roleToAdd.rawPosition > botRole.position || roleToAdd.name === botRole.name){
                interaction.reply({ content: "En voi lisätä roolia **" + roleToAdd.name + "**...", ephemeral: true });
                break;
            }

            interaction.member.roles.add(roleToAdd.id);
            interaction.reply({ content: "Role " + roleToAdd.name + " add", ephemeral: true });
            break;
        }

        case "removerole": {
            const userRoles = Array.from(interaction.member.roles.cache.keys());
            const roleToRemove = interaction.options.getRole("role");

            if (!guildRoles.find(role => role.name.toLowerCase() === roleToRemove.name.toLowerCase())) {
                interaction.reply({ content: "Roolia **" + roleToRemove.name + "** ei ole olemassa!", ephemeral: true });
                break;
            }

            if (!userRoles.includes(roleToRemove.id)) {
                interaction.reply({ content: "Sinulla ei ole roolia **" + roleToRemove.name + "**!", ephemeral: true });
                break;
            }

            if (roleToRemove.rawPosition > botRole.position || roleToRemove.name === botRole.name){
                interaction.reply({ content: "En voi poistaa roolia **" + roleToRemove.name + "**...", ephemeral: true });
                break;
            }

            interaction.member.roles.remove(roleToRemove.id);
            interaction.reply({ content: "Role " + roleToRemove.name + " removed", ephemeral: true });
            break;
        }

        default: {
            break;
        }
    }
};

export const getGuildRoles = (guild) => {
    return guild.roles.cache.map(role => ({
        id: role.id,
        name: role.name,
        size: guild.roles.cache.get(role.id).members.size,
        position: role.rawPosition,
        tags: role.tags,
        members: guild.roles.cache.get(role.id).members.size > 0 ? guild.roles.cache
            .get(role.id)
            .members.map((member) => member.user.username)
            .join(", ")
        : "-",
    }))
    .slice(1) //Exclude @everyone role
    .sort((a, b) => b.position - a.position);
}

const getUserRoleNames = (interaction) => {
    const userRoles = Array.from(interaction.member.roles.cache.values());

    if (userRoles.length > 0) {
        const userRoleNames = userRoles
            .map(role => role.name)
            .sort((a, b) => b.rawPosition - a.rawPosition)
            .slice(0, -1) //Remove @everyone role

        return userRoleNames;
    }

    return;
}
