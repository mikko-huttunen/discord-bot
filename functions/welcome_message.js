import { createCanvas, loadImage } from "canvas";
import { AttachmentBuilder } from "discord.js";
import { tagUsername } from "./helpers/helpers.js";
import { canSendMessageToChannel } from "./helpers/checks.js";

const background = "https://i.imgur.com/RdqOaKw.png";

const dim = {
    width: 819,
    height: 461,
    margin: 0,
};

const av = {
    size: 256,
    x: (dim.width / 2) + 70,
    y: (dim.height / 2) - 128
};

export const generateMessage = async (member) => {
    const guild = member.guild;
    const channel = guild.channels.cache.filter(c => c.type === 0).find(x => x.position == 0);

    if (!await canSendMessageToChannel(guild, channel)) return;

    const username = member.user.username;
    const avatarURL = member.user.avatarURL({
        extension: "png",
        forceStatic: true,
        size: av.size,
    });

    const canvasPaper = createCanvas(dim.width, dim.height);
    const ctx = canvasPaper.getContext("2d");

    // draw in the background
    const backimg = await loadImage(background);
    ctx.drawImage(backimg, 0, 0);

    // draw black tinted box
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(dim.margin, dim.margin, dim.width, dim.height);

    const avimg = avatarURL ? await loadImage(avatarURL) : null;
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

    if (avimg) ctx.drawImage(avimg, av.x, av.y);
    ctx.restore();

    // write in text
    ctx.fillStyle = "white";
    ctx.textAlign = "center";

    // draw in Welcome
    ctx.font = "80px Luminari";
    ctx.fillText("Welcome", ((dim.width / 2) - 180), ((dim.height / 2) - 50));

    // draw in the username
    ctx.font = "80px Luminari";
    ctx.fillText(username, ((dim.width / 2) - 180), (dim.height / 2) + 70);

    const attachment = new AttachmentBuilder(canvasPaper.toBuffer(), {
        name: "welcome.png",
    });
    
    await channel.send({
        content: "Welcome " + tagUsername(member.id) + "!\n" +
            "Add roles with **/addrole** command or check events using **/listevents** command!\n" +
            "Use **/help** command to see other commands!\n" +
            "Hope you will enjoy your time here!",
        files: [attachment],
    });
};