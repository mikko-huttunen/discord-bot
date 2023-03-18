import { getBotGuild } from "../data/bot_data.js";

export const getUserData = async (id) => {
    return await getBotGuild().members.fetch(id);
}