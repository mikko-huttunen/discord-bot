require("dotenv").config();

const { ActivityType } = require("discord.js");
const mongoose = require("mongoose");
const database = process.env.DATABASE;

const bot = {
    botId: null,
    names: [],
    guild: null,
    role: null
};

const initialize = (client) => {
    bot.botId = client.user.id;
    bot.names.push(
        "<@" + client.user.id + ">",
        client.user.username.toLowerCase(),
        client.user.username.split("Bot", 1)[0].toLowerCase()
    );

    bot.guild = client.guilds.cache.get(process.env.GUILD_ID);
    const roles = bot.guild.roles.cache;
    bot.role = roles.find(role => role.tags.botId === bot.botId);

    console.log("Logged in as " + client.user.tag);

    client.user.setPresence({
        status: "online",
        activities: [{ 
            name: "you 🐒", 
            type: ActivityType.Watching
        }],
    });

    if (!database) return;

    mongoose.connect(database, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }).then(() => {
        console.log("Connected to database!");
    }).catch((err) => {
        console.log(err);
    })
} 

const getBotNames = () => {
    return bot.names;
};

const getBotRole = () => {
    return bot.role;
}

module.exports = { initialize, getBotNames, getBotRole };
