import moment from "moment";
import { DAILY, MONTHLY, WEEKLY, YEARLY } from "../../variables/constants.js";

export const getMemberData = async (id, guild) => {
    return await guild.members.fetch(id);
};

export const tagUsername = (id) => {
    return `<@${id}>`;
}

export const getChannelName = (channelId) => {
    return `<#${channelId}>`;
};

export const generateId = () => {
    return Math.random().toString(16).slice(9);
};

export const getRandomCustomEmote = (msg) => {
    const emojis = msg.guild.emojis.cache.map(
        emoji => `<:${emoji.name}:${emoji.id}>`
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

export const getNewDate = (dateTime, repeat) => {
    switch (repeat) {
        case DAILY:
            return moment(dateTime).add(1, "d");

        case WEEKLY:
            return moment(dateTime). add(1, "w");

        case MONTHLY:
            return moment(dateTime). add(1, "M");

        case YEARLY:
            return moment(dateTime). add(1, "y");

        default:
            console.error("Invalid repeat!");
            break;
    }
}

export const getImageFileExtension = (fileName) => {
    //Discord supported image file extensions
    const imageExtensions = ["jpg", "jpeg", "JPG", "JPEG", "png", "PNG", "gif", "gifv", "webm"]
    const extension = fileName.split(".").pop();

    if (extension === "gifv") return "gif";
    if (imageExtensions.includes(extension)) return extension;
    
    return;
};