import * as dotenv from "dotenv";
dotenv.config();

import { ActivityType } from "discord.js";
import mongoose from "mongoose";
const database = process.env.DATABASE;

const bot = {
    botId: null,
    names: [],
    guild: null,
    role: null
};

export const initialize = (client) => {
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

export const getBotNames = () => {
    return bot.names;
};

export const getBotGuild = () => {
    return bot.guild;
}

export const getBotRole = () => {
    return bot.role;
}