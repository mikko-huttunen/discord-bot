import { EmbedBuilder } from "@discordjs/builders";
import { getBotRole } from "../data/bot_data.js";

export const handleRoleMessage = async (msg) => {
    await msg.guild.members.fetch()
        .then()
        .catch(error => console.log(error));

    const msgToLowerCase = msg.content.toLowerCase();
    const msgRole = msgToLowerCase.slice(msgToLowerCase.indexOf(" ") + 3);

    const guildRoles = getGuildRoles(msg.guild);
    const role = guildRoles.find((role) => role.name.toLowerCase() === msgRole);
    const botRole = getBotRole();

    let roleEmbed = new EmbedBuilder().setColor(0xff0000);

    switch (msgToLowerCase) {
        case "!role list":
            roleEmbed.setTitle("Roles");
            guildRoles.map((role) => roleEmbed.addFields({
                name: role.name,
                value: `${role.members}`,
            }));

            if (msg.author.bot) {
                msg.edit({ 
                    content: "",
                    embeds: [roleEmbed] });
            } else {
                msg.channel.send({ embeds: [roleEmbed] });
            }
            
            break;

        case "!role me":
            if (msg.author.bot) break;

            const userRoles = getUserRoleNames(msg);
            
            if (userRoles <= 0) {
                msg.reply("Sinulla ei ole rooleja...");
                break;
            }
            
            msg.reply("Roolisi: " + userRoles.join(", "));
            break;

        case "!role + " + msgRole:
            if (msg.author.bot) break;
            if (!guildRoles.find(role => role.name.toLowerCase() === msgRole)) {
                msg.reply("Roolia **" + msgRole + "** ei ole olemassa!");
                break;
            }

            if (msg.member._roles.includes(role.id)) {
                msg.reply("Sinulla on jo rooli **" + role.name + "**!")
                break;
            }

            if (role.position > botRole.position || role.name === botRole.name){
                msg.reply("En voi lisätä roolia **" + role.name + "**...");
                break;
            }

            msg.member.roles.add(role.id);
            msg.react("✅");
            break;

        case "!role - " + msgRole:
            if (msg.author.bot) break;
            if (!guildRoles.find((role) => role.name.toLowerCase() === msgRole)) {
                msg.reply("Roolia **" + msgRole + "** ei ole olemassa!");
                break;
            }

            if (!msg.member._roles.includes(role.id)) {
                msg.reply("Sinulla ei ole roolia **" + role.name + "**!")
                break;
            }

            if (role.position > botRole.position){
                msg.reply("En voi poistaa roolia **" + role.name + "**...");
                break;
            }

            msg.member.roles.remove(role.id);
            msg.react("✅");
            break;

        default:
            break;
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

const getUserRoleNames = (msg) => {
    const userRoleIds = msg.member._roles;
    const userRoleNames = msg.member.guild.roles.cache.filter(role =>
        userRoleIds.includes(role.id)
    )
    .sort((a, b) => b.rawPosition - a.rawPosition)
    .map(role => role.name);

    return userRoleNames;
}
