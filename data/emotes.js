export const getRandomCustomEmote = (msg) => {
    const emojis = msg.guild.emojis.cache.map(
        (emoji) => " <:" + emoji.name + ":" + emoji.id + ">"
    );
    return emojis[Math.floor(Math.random() * emojis.length)];
};

export const getNumberEmotes = () => {
    return (
        ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"]
    )
}