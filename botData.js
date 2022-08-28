require("dotenv").config();
const handleRoles = require("./handleRoles");

const bot = {
    names: [],
    guild: null,
    role: null
};

const initialize = (client) => {
    bot.names.push("<@" + client.user.id + ">",
        client.user.tag.split("#", 1)[0].toLowerCase(),
        client.user.tag.split("Bot", 1)[0].toLowerCase(),
        "mb"
    );
    bot.guild = client.guilds.cache.get(process.env.GUILD_ID);
    const roles = handleRoles.getServerRoles(bot.guild);
    bot.role = roles.find(role => role.name === "mblocal");

    console.log("Logged in as " + client.user.tag);
} 

const getBotName = (msg) => {
    return bot.names.find((name) => msg.includes(name));
};

module.exports = { bot, initialize, getBotName };
