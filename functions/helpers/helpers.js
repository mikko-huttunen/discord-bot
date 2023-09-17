import { getDocuments } from "../../database/database_service.js";

export const getMemberData = async (id, guild) => {
    return await guild.members.fetch(id);
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

export const canCreateNew = async (collection, author, guildId) => {
    const documents = await getDocuments(collection, { author, guildId });
    if (documents.length >= 5) {
        return false;
    }

    return true;
};