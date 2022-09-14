require("dotenv").config();

const mongoose = require("mongoose");
const database = process.env.DATABASE;

const bot = {
    names: [],
    guild: null,
    role: null
};

const initialize = (client) => {
    const handleRoles = require("../functions/handle_roles");

    bot.names.push(
        "<@" + client.user.id + ">",
        client.user.username.toLowerCase(),
        client.user.username.split("Bot", 1)[0].toLowerCase()
    );
    
    bot.guild = client.guilds.cache.get(process.env.GUILD_ID);
    const roles = handleRoles.getGuildRoles(bot.guild);
    bot.role = roles.find(role => role.members.includes(client.user.username) && role.tags.hasOwnProperty("botId"));

    console.log("Logged in as " + client.user.tag);

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
