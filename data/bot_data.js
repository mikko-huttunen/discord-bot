import { Collection, REST, Routes } from "discord.js";
import * as dotenv from "dotenv";
import { ActivityType } from "discord.js";
import mongoose from "mongoose";
import * as commandData from "../commands/commands.js";
dotenv.config();

const database = process.env.DATABASE;

const bot = {
    id: null,
    names: [],
    guild: null,
    role: null
};

export const initialize = async (client) => {
    setBotData(client);
    createCommands(client);

    if (!database) {
        console.log("No database set!");
        return;
    }

    setDatabase();
}

const setBotData = (client) => {
    bot.id = client.user.id;
    bot.names.push(
        "<@" + client.user.id + ">",
        client.user.username.toLowerCase(),
        client.user.username.split("Bot", 1)[0].toLowerCase()
    );

    bot.guild = client.guilds.cache.get(process.env.GUILD_ID);
    const roles = bot.guild.roles.cache;
    bot.role = roles.find(role => role.tags.botId === bot.id);
    console.log("Logged in as " + client.user.tag);
}

const setDatabase = () => {
    mongoose.set('strictQuery', true);
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

const createCommands = async (client) => {
    client.commands = new Collection();
    let commandList = [];

    Object.entries(commandData).forEach(command => {
        Object.entries(command[1]).forEach(cmd => {
            if ("data" in cmd[1] && "execute" in cmd[1]) {
                client.commands.set(cmd[1].data.name, cmd[1]);
                commandList.push(cmd[1].data);
            } else {
                console.log("The command at" + cmd[1] + "is missing a required data or execute property.");
            }
        })
    });

    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

    await rest.put(Routes.applicationGuildCommands(getBotId(), getBotGuild().id), { body: commandList })
        .then(() => console.log("Successfully registered application commands!"))
        .catch(console.error);
}

export const getBotId = () => {
    return bot.id;
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