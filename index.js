require("dotenv").config();

const { Client, EmbedBuilder } = require("discord.js");
const greetings = require("./greetings");
const botData = require("./botData");
const handleRoles = require("./handleRoles");
const generateImage = require("./generateImage");
const client = new Client({
    intents: ["Guilds", "GuildMessages", "MessageContent", "GuildMembers"],
});

let userName;
const welcomeChannelId = "1007764026387877979";

client.on("ready", () => {
    console.log("Logged in as " + client.user.tag);
    botData.botNames.push(
        "<@" + client.user.id + ">",
        client.user.tag.split("#", 1)[0].toLowerCase(),
        client.user.tag.split("Bot", 1)[0].toLowerCase(),
        "mb"
    );
});

client.on("messageCreate", (msg) => {
    userName = msg.member.user.username;

    !msg.author.bot ? greetings.greet(userName, msg) : false;
    msg.content.startsWith("!help") ? showHelperEmbed(msg) : false;
    msg.content.startsWith("!role") ? handleRoles.handleRoleMessage(msg) : false;
});

client.on("guildMemberAdd", async (member) => {
    const img = await generateImage(member);
    member.guild.channels.cache.get(welcomeChannelId).send({
        content: `<@${member.id}> Welcome to the server! !help to navigate around.`,
        files: [img],
    });
});

const showHelperEmbed = (msg) => {
    let helperEmbed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle("Bot Commands")
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
};

client.login(process.env.TOKEN);
