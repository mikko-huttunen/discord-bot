require("dotenv").config();

const discord = require("discord.js");
const greetings = require("./greetings");
const botData = require("./botData")
const generateImage = require("./generateImage");
const client = new discord.Client({
    intents: ["Guilds", "GuildMessages", "MessageContent", "GuildMembers"],
});

let userName;
const welcomeChannelId = "1007764026387877979";

client.on("ready", () => {
    console.log("Logged in as " + client.user.tag);
    botData.botNames.push(
        client.user.tag.split("#", 1)[0].toLowerCase(),
        client.user.tag.split("Bot", 1)[0].toLowerCase(),
        "mb"
    );
});

client.on("messageCreate", (msg) => {
    const msgToLowerCase = msg.content.toLowerCase();
    userName = msg.member.user.username;

    if (greetings.greetCheck(userName, msg, msgToLowerCase) ? msg.reply(greetings.greetCheck(userName, msg, msgToLowerCase)) : false);
});

client.on("guildMemberAdd", async (member) => {
    const img = await generateImage(member);
    member.guild.channels.cache.get(welcomeChannelId).send({
        content: `<@${member.id}> Welcome to the server!`,
        files: [img],
    });
});

client.login(process.env.TOKEN);
