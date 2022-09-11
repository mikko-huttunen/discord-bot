const canvas = require("canvas");
const { AttachmentBuilder } = require("discord.js");

const welcomeChannelId = "340856154353696770"; //Remember to change hardcoded value
const background = "https://i.imgur.com/WtLxcC7.png";

const dim = {
    width: 883,
    height: 911,
    margin: 0,
};

const av = {
    size: 256,
    x: 313,
    y: 300,
};

const generateMessage = async (member) => {
    const username = member.user.username;
    const discrim = "#" + member.user.discriminator;
    const avatarURL = member.user.avatarURL({
        extension: "png",
        forceStatic: true,
        size: av.size,
    });

    const canvasPaper = canvas.createCanvas(dim.width, dim.height);
    const ctx = canvasPaper.getContext("2d");

    // draw in the background
    const backimg = await canvas.loadImage(background);
    ctx.drawImage(backimg, 0, 0);

    // draw black tinted box
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(dim.margin, dim.margin, dim.width, dim.height);

    const avimg = await canvas.loadImage(avatarURL);
    ctx.save();

    ctx.beginPath();
    ctx.arc(
        av.x + av.size / 2,
        av.y + av.size / 2,
        av.size / 2,
        0,
        Math.PI * 2,
        true
    );
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(avimg, av.x, av.y);
    ctx.restore();

    // write in text
    ctx.fillStyle = "white";
    ctx.textAlign = "center";

    // draw in Welcome
    ctx.font = "80px Roboto";
    ctx.fillText("Tervetuloa", dim.width / 2, 190);

    // draw in the username
    ctx.font = "70px Roboto";
    ctx.fillText(
        username + discrim,
        dim.width / 2,
        dim.height - 210
    );

    // draw in to the server
    ctx.font = "60px Roboto";
    ctx.fillText("serverille!", dim.width / 2, dim.height - 120);

    const attachment = new AttachmentBuilder(canvasPaper.toBuffer(), {
        name: "welcome.png",
    });
    
    member.guild.channels.cache.get(welcomeChannelId).send({
        content: `Tervetuloa <@${member.id}>! Lisää paikkakuntarooli komennolla **!role add <rooli>**, tai katso weeklyn tiedot komennolla **!weekly**. Muita komentoja näet komennolla **!help**.`,
        files: [attachment],
    });
};

module.exports = { generateMessage };
