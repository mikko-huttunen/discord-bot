import { bot } from "../../bot/bot.js";

export const getUserData = async (id) => {
    return await bot.guild.members.fetch(id);
};

export const tagUsername = (id) => {
    return `<@${id}>`;
}

export const getChannelName = (channelId) => {
    return "<#" + channelId + ">";
};

export const generateId = () => {
    return Math.random().toString(16).slice(9);
};

export const getRandomCustomEmote = (msg) => {
    const emojis = msg.guild.emojis.cache.map(
        (emoji) => " <:" + emoji.name + ":" + emoji.id + ">"
    );
    return emojis[Math.floor(Math.random() * emojis.length)];
};

export const getNumberEmojis = () => {
    return (
        ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"]
    );
};

export const getUnicodeEmoji = (code) => {
    return String.fromCodePoint(`0x${code}`);
};