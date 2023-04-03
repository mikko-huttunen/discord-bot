import { Collection, REST, Routes } from "discord.js";
import * as commandData from "../commands/commands.js";
import * as dotenv from "dotenv";
dotenv.config();

export const bot = {
    client: null,
    id: null,
    names: [],
    guild: null,
    role: null,
};

export const initializeBot = async (client) => {
    await setBotData(client);
    await createCommands(client);
};

const setBotData = async (client) => {
    bot.client = client;
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
};

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

    await rest.put(Routes.applicationGuildCommands(bot.id, bot.guild.id), { body: commandList })
        .then(() => console.log("Successfully registered application commands!"))
        .catch(console.error);
};