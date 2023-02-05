import { PermissionsBitField } from "discord.js";
import moment from "moment";
import { getBotGuild } from "../data/bot_data.js";
import { timedMessage } from "../models/timed_message_schema.js";

export const handleTimedMessage = (msg, client) => {
    const msgToLowerCase = msg.content.toLowerCase();
    const msgCommand = msgToLowerCase.split(" ")[0] + " " + msgToLowerCase.split(" ")[1];
    const msgAuthor = msg.author.username + "#" + msg.author.discriminator;

    switch(msgCommand) {
        case "!timed +":
            if (msg.author.bot) break;

            const msgParameters = msg.content.substring(msgToLowerCase.indexOf("+") + 2).split("|");
            if (!msgParameters[0] || msgParameters.length > 3) {
                msg.reply("Syötä ajastetun viestin tiedot muodossa: **!timed + viesti | dd.mm.yyyy _hh:mm_ _(-d/-w/-m/-y)_ | #kanava**");
                break;
            };
            const timedMsg = msgParameters[0];

            const id = Math.random().toString(16).slice(9);

            if (!msgParameters[1]) {
                msg.reply("Päivämäärä puuttuu! !timed + viesti | **dd.mm.yyyy _hh:mm_** _(-d/-w/-m/-y)_ | #kanava");
                break;
            }

            const msgDateTime = msgParameters[1];
            const msgDateTimeFormatted = moment(msgDateTime, "DD/MM/YYYY HH:mm").format("YYYY-MM-DD HH:mm");
            const repeat = msgDateTime.split("-")[1] ? msgDateTime.split("-")[1].trim() : "";

            if (!moment(msgDateTimeFormatted, "YYYY/MM/DD").isValid()) {
                msg.reply("Anna päivämäärä oikeassa muodossa: !timed + viesti | **dd.mm.yyyy _hh:mm_** | #kanava");
                break;
            }

            const currentDateTime = moment().format("YYYY-MM-DD HH:mm");
            if (moment(msgDateTimeFormatted).isSameOrBefore(currentDateTime)) {
                msg.reply("Antamasi päivämäärä tai kellonaika on jo mennyt!");
                break;
            } else if (moment(msgDateTimeFormatted).isAfter(moment(currentDateTime).add(6, "months"))) {
                msg.reply("Ajastettua viestiä ei voi asettaa yli puolen vuoden päähän!");
                break;
            }

            if (repeat !== "" && repeat !== "d" && repeat !== "w" && repeat !== "m" && repeat !== "y") {
                msg.reply("Antamasi viestin toisto on virheellinen! Hyväksyttyjä muotoja ovat:\n" +
                "-d = Toista joka päivä\n" +
                "-w = Toista joka viikko\n" +
                "-m = Toista joka kuukausi\n" +
                "-y = Toista joka vuosi");
                break;
            }

            if (!msgParameters[2]) {
                msg.reply("Tekstikanava ei voi olla tyhjä! !timed + viesti | dd.mm.yyyy _hh:mm_ _(-d/-w/-m/-y)_ | **#kanava**");
                break;
            }

            const msgChannelId = msgParameters[2].substring(msgParameters[2].indexOf("#") + 1, msgParameters[2].indexOf(">")).trim();
            const msgChannel = client.channels.cache.get(msgChannelId);
            if (!msgChannel || (msgParameters[2].trim() !== ("<#" + msgChannelId + ">"))) {
                msg.reply("Antamaasi tekstikanavaa ei ole olemassa!");
                break;
            } else if (msgChannel.type === 2) {
                msg.reply("Anna kanavaksi tekstikanava!");
                break;
            }

            const guild = getBotGuild();
            if(!guild.members.me.permissionsIn(msgChannel).has(PermissionsBitField.Flags.SendMessages)) {
                msg.reply("En voi lähettää viestejä kanavalle <#" + msgChannelId + ">");
                break;
            }

            getTimedMessages(msg).then(posts => {
                if (posts.length >= 5) {
                    msg.reply("Sinulla voi olla maksimissaan 5 ajastettua viestiä!\nVoit katsoa viestisi komennolla !timed messages, ja poistaa niitä komennolla !timed - <id>.");
                    return;
                }

                addTimedMessage(msg, id, msgAuthor, timedMsg, msgDateTimeFormatted, repeat, msgChannelId);
                return;
            });

            break;

        case "!timed -":
            if (msg.author.bot) break;

            const msgId = msg.content.substring(msgToLowerCase.indexOf("-") + 1).trim();
            if (!msgId) {
                msg.reply("Anna poistettavan ajastetun viestin id!\nNäet ajastettujen viestien id:t komennolla **!timed messages**");
                break;
            }

            deleteTimedMessage(msg, msgId, msgAuthor);
            break;

        case "!timed messages":
            const timedMessagesEmbed = {
                color: 0x0096FF,
                title: "Timed Messages",
                fields: []
            };

            getTimedMessages(msg).then(posts => {
                if (posts.length > 0) {
                    const postsSorted = posts.sort((a, b) => a.date.getTime() - b.date.getTime());
                    postsSorted.forEach(field => timedMessagesEmbed.fields.push({
                        name: "ID: " + field.id,
                        value: "Message: " + field.message + "\nDate: " + moment(field.date).format("DD.MM.YYYY HH:mm") + "\nChannel: <#" + field.channelId + ">"
                    }));

                    if (msg.author.bot) {
                        msg.edit({ 
                        content: "",
                        embeds: [timedMessagesEmbed] });
                    } else {
                        msg.channel.send({ embeds: [timedMessagesEmbed] });
                    }
                } else {
                    msg.reply("Sinulla ei ole ajastettuja viestejä...")
                }
            })

            break;

        default:
            if (msg.author.bot) break;
            msg.reply("Syötä ajastetun viestin tiedot muodossa: **!timed + viesti | dd.mm.yyyy _hh:mm_ _(-d/-w/-m/-y)_ | #kanava**");
            break;
    }
}

const addTimedMessage = async (msg, id, user, content, date, repeat, channelId) => {
    await new timedMessage({ 
        id,
        user,
        message: content,
        date,
        repeat,
        channelId
    })
    .save()
    .then(response => {
        console.log("Timed message created: " + response);
        msg.react("✅");
    })
    .catch(err => {
        console.log(err);
        msg.reply("Sori nyt ei pysty...")
    });
};

const updateTimedMessage = async (id, newDate) => {
    await timedMessage.findOneAndUpdate(
        { id: id },
        { date: newDate },
        { returnDocument: "after" }
    )
    .then(response => {
        console.log("Timed message updated: " + response);
    })
    .catch(err => {
        console.log(err);
    });
}

const deleteTimedMessage = async (msg, id, user) => {
    await timedMessage.findOneAndDelete({ 
        id: id, 
        user: user 
    })
    .then(response => {
        if (response) {
            console.log("Timed message deleted: " + response);
            msg.react("✅");
        } else {
            msg.reply("Et voi poistaa ajastettua viestiä **" + id + "**, tai antamasi id on väärä!");
        }
    })
    .catch(err => {
        console.log(err);
        msg.reply("Sori nyt ei pysty...");
    });
}

const getTimedMessages = async (msg) => {
    return await timedMessage.find(
        { user: msg.author.username + "#" + msg.author.discriminator },
        { _id: 0, id: 1, user: 1, message: 1, date: 1, channelId: 1}
    )
    .lean();
}

export const postTimedMessages = async (client, query) => {
    let doesRepeat;
    let newDate;
    let msgId;

    await timedMessage.find(query)
    .then(response => {
        response.forEach(post => {
            const { id, message, date, repeat, channelId } = post;
            msgId = id;
            doesRepeat = repeat ? repeat : false;
            const guild = getBotGuild();
            const channel = client.channels.cache.get(channelId);

            if (!channel) return;

            if (guild.members.me.permissionsIn(channel).has(PermissionsBitField.Flags.SendMessages)) {
                channel.send(message);
                console.log("Timed message posted: " + post);
            } else {
                return;
            }

            if (repeat) {
                if (repeat === "d") {
                    newDate = moment(date).add(1, "d");
                } else if (repeat === "w") {
                    newDate = moment(date). add(1, "w");
                } else if (repeat === "m") {
                    newDate = moment(date). add(1, "M");
                } else if (repeat === "y") {
                    newDate = moment(date). add(1, "y");
                }
            }
        });
    })
    .catch(err => {
        console.log(err);
    });
    
    if (doesRepeat) {
        await updateTimedMessage(msgId, newDate);
    } else if (!doesRepeat) {
        await timedMessage.deleteMany(query)
        .then(response => {
            if (response.deletedCount > 0) {
                console.log("deleted message");
            }
        })
        .catch(err => {
            console.log(err);
        });
    }
}