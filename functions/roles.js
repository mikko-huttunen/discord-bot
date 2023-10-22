import { clientId } from "../bot/bot.js";
import { MEMBER_FETCH_ERR, NO_ROLES, ROLE } from "../variables/constants.js";
import { getUnicodeEmoji } from "./helpers/helpers.js";

export const listRoles = async (interaction) => {
    const getGuildRoles = async () => {
        const roles = await getGuildRoleData(interaction.guild);
        if (!roles) return;
        return roles.map(role => ({
            name: role.name,
            value: role.members
        }));
    }

    const roleEmbed = {
        color: 0xff0000,
        title: getUnicodeEmoji("1F396") + " Roles",
        fields: await getGuildRoles()
    };

    interaction.reply({ 
        embeds: [roleEmbed],
        ephemeral: true
    });
};

export const myRoles = (interaction) => {
    const userRoles = getUserRoleNames(interaction);

    if (userRoles.length === 0) {
        return interaction.reply({
            content: NO_ROLES,
            ephemeral: true
        });
    }
    
    interaction.reply({ 
        content: "Your roles: " + userRoles.join(", "), 
        ephemeral: true
    });
};

export const addRole = async (interaction) => {
    const guildRoles = await getGuildRoleData(interaction.guild);
    const botRole = guildRoles.find(role => role.tags?.botId === clientId);
    const userRoles = Array.from(interaction.member.roles.cache.keys());
    const roleToAdd = interaction.options.getRole(ROLE);

    if (!guildRoles.find(role => role.name.toLowerCase() === roleToAdd.name.toLowerCase())) {
        interaction.reply({
            content: `Role **${roleToAdd.name}** doesn't exist!`,
            ephemeral: true
        });
        return;
    }

    if (userRoles.includes(roleToAdd.id)) {
        interaction.reply({
            content: `You already have the role **${roleToAdd.name}**!`,
            ephemeral: true 
        });
        return;
    }

    if (roleToAdd.rawPosition > botRole.position || roleToAdd.tags?.botId) {
        interaction.reply({
            content: `Cannot add role **${roleToAdd.name}**...`,
            ephemeral: true
        });
        return;
    }

    interaction.member.roles.add(roleToAdd.id);
    interaction.reply({
        content: `Role ${roleToAdd.name} added!`,
        ephemeral: true 
    });
};

export const removeRole = async (interaction) => {
    const userRoles = Array.from(interaction.member.roles.cache.keys());
    const roleToRemove = interaction.options.getRole(ROLE);
    const guildRoles = await getGuildRoleData(interaction.guild);
    const botRole = guildRoles.find(role => role.tags?.botId === clientId);

    if (!guildRoles.find(role => role.name.toLowerCase() === roleToRemove.name.toLowerCase())) {
        interaction.reply({
            content: `Role **${roleToRemove.name}** doesn't exist!`, 
            ephemeral: true 
        });
        return;
    }

    if (!userRoles.includes(roleToRemove.id)) {
        interaction.reply({
            content: `You don't have the role **${roleToRemove.name}**!`, 
            ephemeral: true 
        });
        return;
    }

    if (roleToRemove.rawPosition > botRole.position || roleToRemove.tags?.botId) {
        interaction.reply({
            content: `Cannot remove role **${roleToRemove.name}**...`, 
            ephemeral: true 
        });
        return;
    }

    interaction.member.roles.remove(roleToRemove.id);
    interaction.reply({
        content: `Role ${roleToRemove.name} removed!`, 
        ephemeral: true 
    });
};

const getGuildRoleData = async (guild) => {
    try {
        await guild.members.fetch();
    } catch(err) {
        console.error(MEMBER_FETCH_ERR, err);
        return;
    }

    return guild.roles.cache.map(role => ({
        id: role.id,
        name: role.name,
        size: guild.roles.cache.get(role.id).members.size,
        position: role.rawPosition,
        tags: role.tags,
        members: guild.roles.cache.get(role.id).members.size > 0 ? guild.roles.cache
            .get(role.id)
            .members.map((member) => member.nickname ? member.nickname : member.user.username)
            .join(", ")
        : "-",
    }))
    .slice(1) //Exclude @everyone role
    .sort((a, b) => b.position - a.position);
};

const getUserRoleNames = (interaction) => {
    const userRoles = Array.from(interaction.member.roles.cache.values())
        .sort((a, b) => b.rawPosition - a.rawPosition)
        .slice(0, -1) //Exclude @everyone role
        
    if (!userRoles.length) return;

    return userRoles.map(role => role.name);
};