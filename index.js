require("dotenv").config();

const { Client } = require("discord.js");
const events = require("./functions/events");
const greetings = require("./functions/greetings");
const botData = require("./data/bot_data");
const helpers = require("./functions/helpers")
const handleRoles = require("./functions/handle_roles");
const welcomeMessage = require("./functions/welcome_message");
const imageSearch = require("./functions/image_search");

const client = new Client({
    intents: ["Guilds", "GuildMessages", "MessageContent", "GuildMembers", "GuildEmojisAndStickers", "DirectMessages", "GuildPresences"],
});

client.on("ready", () => {
    botData.initialize(client);
});

client.on("messageCreate", async (msg) => {
    const msgToLowerCase = msg.content.toLowerCase();

    msgToLowerCase.includes(botData.getBotNames(msgToLowerCase)) ? greetings.greet(msg) : false;
    msgToLowerCase.startsWith("!help") ? helpers.handleHelp(msg) : false;
    msgToLowerCase.startsWith("!role") ? handleRoles.handleRoleMessage(msg) : false;
    msgToLowerCase.startsWith("!weekly") ? events.handleEvents(msg) : false;
    msgToLowerCase.startsWith("!attendees") ? events.showParticipants(msg) : false;
    msgToLowerCase.startsWith("!image") || msg.content.startsWith("!kuva") ? await imageSearch.handleSearch(msg) : false;
});

client.on("guildMemberAdd", async (member, msg) => {
    await welcomeMessage.generateMessage(member, msg);
});

client.login(process.env.TOKEN);
