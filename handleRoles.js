const { EmbedBuilder } = require("discord.js");

const handleRoleMessage = (msg) => {
    const msgToLowerCase = msg.content.toLowerCase();
    const serverRoles = msg.guild.roles.cache
        .map((role) => ({
            id: role.id,
            name: role.name,
            size: msg.guild.roles.cache.get(role.id).members.size,
            members:
                msg.guild.roles.cache.get(role.id).members.size != 0
                    ? msg.guild.roles.cache
                          .get(role.id)
                          .members.map((member) => member.user.username)
                          .join(", ")
                    : "-",
        }))
        .slice(2);

    switch (msgToLowerCase) {
        case "!role":
        case "!role help":
        case "!role -h":
            let helperEmbed = new EmbedBuilder()
                .setColor(0x9900ff)
                .setTitle("Role Commands")
                .addFields(
                    {
                        name: "!role list",
                        value: "Show list of server roles",
                    },
                    {
                        name: "!role add <role name>",
                        value: "Add role to yourself",
                    },
                    {
                        name: "!role remove <role name>",
                        value: "Remove role from yourself",
                    }
                );
            msg.channel.send({ embeds: [helperEmbed] });
            break;

        case "!role list":
            let rolesEmbed = new EmbedBuilder()
                .setColor(0x9900ff)
                .setTitle("Roles");

            serverRoles.map((role) =>
                rolesEmbed.addFields({
                    name: role.name,
                    value: `${role.members}`,
                })
            );
            msg.channel.send({ embeds: [rolesEmbed] });
            break;

        case "!role add " +
            serverRoles
                .filter(
                    (role) =>
                        role.name.toLowerCase() === msgToLowerCase.slice(10)
                )
                .map((role) => role.name.toLowerCase()):
            role = serverRoles.find(
                (role) => role.name.toLowerCase() === msgToLowerCase.slice(10)
            );
            msg.member.roles.add(role.id);
            msg.reply("Rooli " + role.name + " lisätty");
            break;

        case "!role remove " +
            serverRoles
                .filter(
                    (role) =>
                        role.name.toLowerCase() === msgToLowerCase.slice(13)
                )
                .map((role) => role.name.toLowerCase()):
            role = serverRoles.find(
                (role) => role.name.toLowerCase() === msgToLowerCase.slice(13)
            );
            msg.member.roles.remove(role.id);
            msg.reply("Rooli " + role.name + " poistettu");
            break;
    }
};

module.exports = { handleRoleMessage };
