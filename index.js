require("dotenv").config();

const { Client } = require("discord.js");
const events = require("./functions/events");
const greetings = require("./functions/greetings");
const botData = require("./data/bot_data");
const helpers = require("./functions/helpers")
const handleRoles = require("./functions/handle_roles");
const welcomeMessage = require("./functions/welcome_message");
const imageSearch = require("./functions/image_search");
let botNames;

const client = new Client({
    intents: ["Guilds", "GuildMessages", "MessageContent", "GuildMembers", "GuildEmojisAndStickers", "DirectMessages", "GuildPresences"],
});

client.on("ready", () => {
    botData.initialize(client);
    botNames = botData.getBotNames();
});

client.on("messageCreate", async (msg) => {
    const msgToLowerCase = msg.content.toLowerCase();

    botNames.some(botName => msgToLowerCase.includes(botName)) ? greetings.greet(msg) : false;
    msgToLowerCase.startsWith("!help") ? helpers.handleHelp(msg) : false;
    msgToLowerCase.startsWith("!role") ? handleRoles.handleRoleMessage(msg) : false;
    msgToLowerCase.startsWith("!weekly") ? events.handleEvents(msg) : false;
    msgToLowerCase.startsWith("!attendees") ? events.showParticipants(msg) : false;
    msgToLowerCase.startsWith("!image") || msg.content.startsWith("!kuva") ? await imageSearch.handleSearch(msg) : false;
});

client.on("guildMemberAdd", async (member) => {
    await welcomeMessage.generateMessage(member);
});

client.login(process.env.TOKEN);
