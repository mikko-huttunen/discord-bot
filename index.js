require("dotenv").config();

const { Client, EmbedBuilder } = require("discord.js");
const events = require("./events");
const greetings = require("./greetings");
const botData = require("./botData");
const handleRoles = require("./handle_roles");
const welcomeMessage = require("./welcome_message");
const imageSearch = require("./image_search");

const client = new Client({
    intents: ["Guilds", "GuildMessages", "MessageContent", "GuildMembers", "GuildEmojisAndStickers", "DirectMessages", "GuildPresences"],
});

client.on("ready", () => {
    botData.initialize(client);
});

client.on("messageCreate", async (msg) => {
    const msgToLowerCase = msg.content.toLowerCase();

    msgToLowerCase.includes(botData.getBotNames(msgToLowerCase)) ? greetings.greet(msg) : false;
    msgToLowerCase.startsWith("!help") ? showHelperEmbed(msg) : false;
    msgToLowerCase.startsWith("!weekly") ? events.getInfo(msg) : false;
    msgToLowerCase.startsWith("!role") ? handleRoles.handleRoleMessage(msg) : false;
    msgToLowerCase.startsWith("!image") || msg.content.startsWith("!kuva") ? await imageSearch.handleSearch(msg) : false;
});

client.on("guildMemberAdd", async (member, msg) => {
    await welcomeMessage.generateMessage(member, msg);
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
