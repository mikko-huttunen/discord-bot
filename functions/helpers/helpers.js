import { bot } from "../../bot/bot.js";

export const getUserData = async (id) => {
    return await bot.guild.members.fetch(id);
}