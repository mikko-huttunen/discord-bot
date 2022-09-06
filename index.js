require("dotenv").config();

const { Client, EmbedBuilder } = require("discord.js");
const events = require("./events");
const greetings = require("./greetings");
const botData = require("./botData");
const handleRoles = require("./handle_roles");
const generateImage = require("./generate_image");
const imageSearch = require("./image_search");
const client = new Client({
    intents: ["Guilds", "GuildMessages", "MessageContent", "GuildMembers", "GuildEmojisAndStickers", "DirectMessages", "GuildPresences"],
});

let userName;
const welcomeChannelId = "340856154353696770";

client.on("ready", () => {
    botData.initialize(client);
});

client.on("messageCreate", async (msg) => {
    userName = msg.member.user.username;

    !msg.author.bot ? greetings.greet(userName, msg) : false;
    msg.content.startsWith("!help") ? showHelperEmbed(msg) : false;
    msg.content.startsWith("!weekly") ? events.getInfo(msg) : false;
    msg.content.startsWith("!role") ? handleRoles.handleRoleMessage(msg) : false;
    msg.content.startsWith("!image") || msg.content.startsWith("!kuva") ? await imageSearch.handleSearch(msg) : false;
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
                name: "!weekly",
                value: "Get info about weekly",
            },{
                name: "!role me",
                value: "Show your roles",
            }, {
                name: "!role list",
                value: "Show list of server roles",
            }, {
                name: "!role add <role name>",
                value: "Add role to yourself",
            }, {
                name: "!role remove <role name>",
                value: "Remove role from yourself",
            }, {
                name: "!image <keyword> | !kuva <hakusana>",
                value: "Get random image based on keyword",
            });
            msg.channel.send({ embeds: [helperEmbed] });
};

client.login(process.env.TOKEN);
