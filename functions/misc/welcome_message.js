import { createCanvas, loadImage } from "canvas";
import { AttachmentBuilder } from "discord.js";
import { tagUsername } from "../helpers/helpers.js";

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

export const generateMessage = async (member) => {
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

    const avimg = await loadImage(avatarURL);
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
    ctx.fillText("Welcome", dim.width / 2, 190);

    // draw in the username
    ctx.font = "80px Roboto";
    ctx.fillText(
        username,
        dim.width / 2,
        dim.height - 190
    );

    const attachment = new AttachmentBuilder(canvasPaper.toBuffer(), {
        name: "welcome.png",
    });
    
    member.guild.channels.cache.get(welcomeChannelId).send({
        content: `Welcome ${tagUsername(member.id)}!\n
            Add roles with **/addrole** command or check events using **/listevents** command!\n
            Use **/help** command to see other commands!\n
            Hope you will enjoy your time here!`,
        files: [attachment],
    });

    member.roles.add("371642384989159434"); //Hardcoded value
};