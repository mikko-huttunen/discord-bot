export const getRandomCustomEmote = (msg) => {
    const emojis = msg.guild.emojis.cache.map(
        (emoji) => " <:" + emoji.name + ":" + emoji.id + ">"
    );
    return emojis[Math.floor(Math.random() * emojis.length)];
};