export const listCommands = (msg) => {
    const commandEmbed = {
        color: 0xFFEA00,
        title: "Commands",
        fields: [
            {
                name: "Role Commands",
                value: 
                    "**!role me**\nList of your roles\n" + 
                    "**!role list**\nList of all roles and users\n" +
                    "**!role + <role name>**\nAdd role to yourself\n" +
                    "**!role - <role name>**\nRemove role from yourself\n"
            }, {
                name: "Weekly Commands",
                value: 
                    "**!weekly**\nWeekly event information\n" +
                    "**!weekly players**\nList of weekly event participants\n" +
                    "**!weekly +**\nRegister for the weekly event\n" +
                    "**!weekly -**\nCancel registration for the weekly event\n"
            }, {
                name: "Timed Message Commands",
                value:
                    "**!timed + <message> | <dd.mm.yyyy hh:mm> | <#channel>**\nCreate new timed message\n" +
                    "**!timed - <id>**\nDelete timed message. Use !timed messages to find id\n" +
                    "**!timed messages**\nList of your timed messages\n"
            }, {
                name: "Poll Commands",
                value:
                    "**!poll + <topic> | <dd.mm.yyyy hh:mm> | <#channel> | <option1> | <option2>...**\nCreate new timed message\n" +
                    "**!poll - <id>**\nDelete poll. Use !poll list to find id\n" +
                    "**!poll list**\nList of your polls\n"
            }, {
                name: "!image <keyword>",
                value: "Get random picture based on given keyword",
            }, {
                name: "!video <keyword>",
                value: "Get YouTube video based on given keyword",
            }
        ],
    };

    if (msg.author.bot) {
        msg.edit({ 
            content: "",
            embeds: [commandEmbed] });
    } else {
        msg.channel.send({ embeds: [commandEmbed] });
    }
}