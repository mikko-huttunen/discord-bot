const { EmbedBuilder } = require("discord.js");
//const botData = require("./botData");

const handleRoleMessage = (msg) => {
    msg.guild.members.fetch().then(console.log("Success")).catch(console.error);
    const msgToLowerCase = msg.content.toLowerCase();
    const serverRoles = getServerRoles(msg.guild);
    let role = null;
    const roles = getServerRoles(msg.guild);
    const botRole = roles.find(role => role.name === "mblocal");

    switch (msgToLowerCase) {
        case "!role":
        case "!role help":
        case "!role -h":
            let helperEmbed = new EmbedBuilder()
            .setColor(0xff0000)
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
            msg.channel.send({ embeds: [helperEmbed] });
            break;

        case "!role list":
            let rolesEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle("Roles");

            serverRoles.map((role) => rolesEmbed.addFields({
                name: role.name,
                value: `${role.members}`,
            }));
            msg.channel.send({ embeds: [rolesEmbed] });
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
    return guild.roles.cache.map((role) => ({
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

module.exports = { handleRoleMessage, getServerRoles };
