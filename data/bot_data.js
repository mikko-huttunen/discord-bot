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

export const setBotPresence = (client) => {
    const activities = [
        {
            name: "Super Monkey Ball",
            type: ActivityType.Playing
        }, {
            name: "Ape Escape",
            type: ActivityType.Playing
        }, {
            name: "Donkey Kong",
            type: ActivityType.Playing
        }, {
            name: "Bloons Tower Defence",
            type: ActivityType.Playing
        }, {
            name: "King Kong",
            type: ActivityType.Watching
        }, {
            name: "Planet of The Apes",
            type: ActivityType.Watching
        }, {
            name: "The Jungle Book",
            type: ActivityType.Watching
        }, {
            name: "you 🐒", 
            type: ActivityType.Watching
        }, {
            name: "Monkey ASMR", 
            type: ActivityType.Listening
        }, {
            name: "Monke podcast", 
            type: ActivityType.Listening
        },
    ]

    const activity = activities[Math.floor(Math.random() * activities.length)]

    client.user.setPresence({
        status: "online",
        activities: [{
            name: activity.name,
            type: activity.type
        }],
    });

    console.log("Bot activity changed:", client.user.presence.activities[0].type, client.user.presence.activities[0].name)

    setTimeout( function(){ setBotPresence(client); }, 1000 * 60 * 60);
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