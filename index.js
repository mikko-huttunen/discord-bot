require("dotenv").config();

const discord = require("discord.js");
const greetings = require("./greetings");
const botData = require("./botData");
const handleRoles = require("./handleRoles");
const generateImage = require("./generateImage");
const client = new discord.Client({
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
    console.log(botData.botNames);
});

client.on("messageCreate", (msg) => {
    userName = msg.member.user.username;

    !msg.author.bot ? greetings.greet(userName, msg) : false;

    msg.content.startsWith("!role")
        ? handleRoles.handleRoleMessage(msg)
        : false;
});

client.on("guildMemberAdd", async (member) => {
    const img = await generateImage(member);
    member.guild.channels.cache.get(welcomeChannelId).send({
        content: `<@${member.id}> Welcome to the server!`,
        files: [img],
    });
});

client.login(process.env.TOKEN);
