import { Collection, REST, Routes } from "discord.js";
import * as commandData from "../commands/commands.js";
import * as dotenv from "dotenv";
import { CMD_REGISTER_SUCCESS } from "../variables/constants.js";
dotenv.config();

export const initializeBot = async (client) => {
    await setBotNames(client);
    await createCommands(client);
};

const setBotNames = async (client) => {
    client.botNames = [
        "<@" + client.user.id + ">",
        client.user.username.toLowerCase(),
        client.user.username.split("Bot", 1)[0].toLowerCase()
    ];
    
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
    
    await rest.put(Routes.applicationCommands(client.user.id), { body: commandList })
        .then(() => console.log(CMD_REGISTER_SUCCESS))
        .catch(console.error);
};