import { getUnicodeEmoji } from "./helpers/helpers.js";

export const listCommands = (interaction) => {
    const commandEmbed = {
        color: 0xFFEA00,
        title: `${getUnicodeEmoji("1F50D")} Commands`,
        fields: [
            {
                name: "Role Commands",
                value: 
                    "**/myroles**\nList of your roles\n" + 
                    "**/roles**\nList of all roles and members\n" +
                    "**/addrole**\nAdd role to yourself\n" +
                    "**/removerole**\nRemove role from yourself\n",
                inline: true
            }, {
                name: "Event Commands",
                value: 
                    "**/listevents**\nList of active events\n" +
                    "**/event**\nCreate new event\n" +
                    "**/deleteevent**\nDelete event\n",
                inline: true
            }, {
                name: "Scheduled Message Commands",
                value:
                    "**/listscheduledmessages**\nList of your scheduled messages\n" +
                    "**/scheduledmessage**\nCreate new scheduled message\n" +
                    "**/deletescheduledmessage**\nDelete scheduled message\n",
                inline: true
            }, {
                name: "Poll Commands",
                value:
                    "**/listpolls**\nList of active polls\n" +
                    "**/poll**\nCreate new poll\n" +
                    "**/deletepoll**\nDelete poll\n",
                inline: true
            }, {
                name: "Games",
                value: "**/roll**\nRoll a die\n" +
                    "**/coinflip**\nHeads or tails\n",
                inline: true
            }, {
                name: "Media",
                value: "**/image**\nGet random picture based on given keyword\n" +
                    "**/video**\nGet YouTube video based on given keyword\n",
                inline: true
            }, {
                name: "Settings",
                value: "**/configure**\nChange or view current bot configuration (Requires manage server permission)",
                inline: true
            }
        ],
    };

    interaction.reply({ embeds: [commandEmbed], ephemeral: true });
}