import { MEMBER_FETCH_ERR, NO_ROLES, ROLE } from "../../variables/constants.js";

export const handleRoleCommand = async (interaction) => {
    await interaction.guild.members.fetch()
    .then()
    .catch(err => console.log(MEMBER_FETCH_ERR, err));

    const guildRoles = await getGuildRoles(interaction.guild);
    const botRole = guildRoles.find(role => role.tags?.botId);

    const roleEmbed = {
        color: 0xff0000,
        fields: []
    };

    switch (interaction.commandName) {
        case "roles": {
            roleEmbed.title = "Roles";
            guildRoles.map((role) => 
                roleEmbed.fields.push({
                    name: role.name,
                    value: `${role.members}`
                })
            );

            interaction.reply({ embeds: [roleEmbed], ephemeral: true });
            break;
        }

        case "myroles": {
            const userRoles = getUserRoleNames(interaction);

            if (userRoles.length <= 0) {
                interaction.reply({ content: NO_ROLES, ephemeral: true });
                break;
            }
            
            interaction.reply({ content: "Roolisi: " + userRoles.join(", "), ephemeral: true });
            break;
        }

        case "addrole": {
            const userRoles = Array.from(interaction.member.roles.cache.keys());
            const roleToAdd = interaction.options.getRole(ROLE);

            if (!guildRoles.find(role => role.name.toLowerCase() === roleToAdd.name.toLowerCase())) {
                interaction.reply({ content: "Role **" + roleToAdd.name + "** doesn't exist!", ephemeral: true });
                break;
            }

            if (userRoles.includes(roleToAdd.id)) {
                interaction.reply({ content: "You already have the role **" + roleToAdd.name + "**!", ephemeral: true });
                break;
            }

            if (roleToAdd.rawPosition > botRole.position || roleToAdd.name === botRole.name) {
                interaction.reply({ content: "Cannot add role **" + roleToAdd.name + "**...", ephemeral: true });
                break;
            }

            interaction.member.roles.add(roleToAdd.id);
            interaction.reply({ content: "Role " + roleToAdd.name + " added!", ephemeral: true });
            break;
        }

        case "removerole": {
            const userRoles = Array.from(interaction.member.roles.cache.keys());
            const roleToRemove = interaction.options.getRole(ROLE);

            if (!guildRoles.find(role => role.name.toLowerCase() === roleToRemove.name.toLowerCase())) {
                interaction.reply({ content: "Role **" + roleToRemove.name + "** doesn't exist!", ephemeral: true });
                break;
            }

            if (!userRoles.includes(roleToRemove.id)) {
                interaction.reply({ content: "You don't have the role **" + roleToRemove.name + "**!", ephemeral: true });
                break;
            }

            if (roleToRemove.rawPosition > botRole.position || roleToRemove.name === botRole.name) {
                interaction.reply({ content: "Cannot remove role **" + roleToRemove.name + "**...", ephemeral: true });
                break;
            }

            interaction.member.roles.remove(roleToRemove.id);
            interaction.reply({ content: "Role " + roleToRemove.name + " removed!", ephemeral: true });
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
