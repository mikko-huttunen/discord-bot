const { EmbedBuilder } = require("discord.js");

const handleRoleMessage = (msg) => {
    msg.guild.members.fetch().then(console.log("Successfully fetched server members")).catch(console.error);
    const msgToLowerCase = msg.content.toLowerCase();
    const serverRoles = getServerRoles(msg.guild);
    let role = null;
    const roles = getServerRoles(msg.guild);
    const botRole = roles.find(role => role.name === "Bot"); //Remember to change hardcoded value
    let roleEmbed = new EmbedBuilder().setColor(0xff0000);

    switch (msgToLowerCase) {
        case "!role":
        case "!role help":
        case "!role -h":
            roleEmbed
            .setTitle("Role Commands")
            .addFields({
                name: "!role list",
                value: "Show list of server roles",
            }, {
                name: "!role add <role name>",
                value: "Add role to yourself",
            }, {
                name: "!role remove <role name>",
                value: "Remove role from yourself",
            });
            msg.channel.send({ embeds: [roleEmbed] });
            break;

        case "!role list":
            roleEmbed.setTitle("Roles");
            serverRoles.map((role) => roleEmbed.addFields({
                name: role.name,
                value: `${role.members}`,
            }));
            msg.channel.send({ embeds: [roleEmbed] });
            break;

        case "!role me":
            const userRoles = getUserRoleNames(msg);
            if (userRoles.length > 0) {
                roleEmbed.setTitle(msg.member.user.username);
                roleEmbed.addFields({
                    name: "Roles",
                    value: userRoles.join(", ")
                });
                msg.channel.send({ embeds: [roleEmbed] });
            } else {
                msg.channel.send("Sinulla ei ole rooleja...");
            }
            break;

        case "!role add " + serverRoles.filter((role) =>
            role.name.toLowerCase() === msgToLowerCase.slice(10)).map((role) => role.name.toLowerCase()):
                role = serverRoles.find((role) => role.name.toLowerCase() === msgToLowerCase.slice(10));

                if (msg.member._roles.includes(role.id)) {
                    msg.reply("You already have the role " + role.name + "!")
                    break;
                }

                if (role.position > botRole.position || role.name === botRole.name){
                    msg.reply("Sorry can't add role " + role.name + "...");
                    break;
                }

                msg.member.roles.add(role.id);
                msg.reply("Role " + role.name + " added!");
                break;

        case "!role remove " + serverRoles.filter((role) =>
            role.name.toLowerCase() === msgToLowerCase.slice(13)).map((role) => role.name.toLowerCase()):
                role = serverRoles.find((role) => role.name.toLowerCase() === msgToLowerCase.slice(13));

                if (!msg.member._roles.includes(role.id)) {
                    msg.reply("You don't have role " + role.name + "!")
                    break;
                }

                if (role.position > botRole.position){
                    msg.reply("Sorry cannot remove " + role.name + "...");
                    break;
                }

                msg.member.roles.remove(role.id);
                msg.reply("Role " + role.name + " removed!");
                break;

        default:
            break;
    }
};

const getServerRoles = (guild) => {
    return guild.roles.cache.map(role => ({
        id: role.id,
        name: role.name,
        size: guild.roles.cache.get(role.id).members.size,
        position: role.rawPosition,
        tags: role.tags,
        members: guild.roles.cache.get(role.id).members.size != 0 ? guild.roles.cache
            .get(role.id)
            .members.map((member) => member.user.username)
            .join(", ")
        : "-",
    })).slice(1).sort((a, b) => b.position - a.position);
}

const getUserRoleNames = (msg) => {
    const userRoleIds = msg.member._roles;
    const userRoleNames = msg.member.guild.roles.cache.filter(role =>
        userRoleIds.includes(role.id)
    )
    .sort((a, b) => b.rawPosition - a.rawPosition)
    .map(role => role.name);

    return userRoleNames;
}

module.exports = { handleRoleMessage, getServerRoles };
