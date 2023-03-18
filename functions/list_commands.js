export const listCommands = (interaction) => {
    const commandEmbed = {
        color: 0xFFEA00,
        title: "Commands",
        fields: [
            {
                name: "Role Commands",
                value: 
                    "**/myroles**\nList of your roles\n" + 
                    "**/roles**\nList of all roles and members\n" +
                    "**/addrole**\nAdd role to yourself\n" +
                    "**/removerole**\nRemove role from yourself\n"
            }, {
                name: "Event Commands",
                value: 
                    "**/listevents**\nList of active events\n" +
                    "**/event**\nCreate new event\n" +
                    "**/deleteevent**\nDelete event\n"
            }, {
                name: "Timed Message Commands",
                value:
                    "**/listtimedmessages**\nList of your timed messages\n" +
                    "**/timedmessage**\nCreate new timed message\n" +
                    "**/deletetimedmessage**\nDelete timed message\n"
            }, {
                name: "Poll Commands",
                value:
                    "**/listpolls**\nList of active polls\n" +
                    "**/poll\nCreate new poll\n" +
                    "**/deletepoll**\nDelete poll\n"
            }, {
                name: "Games",
                value: "**!roll <dice>d<sides> / !roll <dice>d / !roll <sides>**\nRoll a die or dice\n" +
                    "**!cf**\nHeads or tails\n"
            }, {
                name: "Media",
                value: "**!image <keyword>**\nGet random picture based on given keyword\n" +
                    "**!video <keyword>**\nGet YouTube video based on given keyword\n"
            }
        ],
    };

    interaction.reply({ embeds: [commandEmbed], ephemeral: true });
}