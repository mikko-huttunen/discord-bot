require("dotenv").config();
const handleRoles = require("./handle_roles");

const bot = ({
    names: [],
    guild: null,
    role: null
});

const initialize = (client) => {
    bot.names.push(
        "<@" + client.user.id + ">",
        client.user.username.toLowerCase(),
        client.user.username.split("Bot", 1)[0].toLowerCase()
    );
    bot.guild = client.guilds.cache.get(process.env.GUILD_ID);
    const roles = handleRoles.getServerRoles(bot.guild);
    bot.role = roles.find(role => role.name === "Bot");

    console.log("Logged in as " + client.user.tag);
} 

const getBotNames = (msg) => {
    return bot.names.find((name) => msg.includes(name));
};

module.exports = { bot, initialize, getBotNames };
