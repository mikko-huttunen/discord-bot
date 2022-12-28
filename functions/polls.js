import { PermissionsBitField } from "discord.js";
import moment from "moment";
import { getBotGuild } from "../data/bot_data.js";
import { poll } from "../models/poll_schema.js";
import { getNumberEmotes } from "../data/emotes.js";

const pollsEmbed = {
    color: 0x32cd32,
    thumbnail: { url: "https://i.imgur.com/V8r2e5D.png" },
    fields: []
};

export const handlePoll = (msg, client) => {
    const msgToLowerCase = msg.content.toLowerCase();
    const msgCommand = msgToLowerCase.split(" ")[0] + " " + msgToLowerCase.split(" ")[1];
    const msgAuthor = msg.author.username + "#" + msg.author.discriminator;

    switch(msgCommand) {
        case "!poll +":
            if (msg.author.bot) break;
            const msgParameters = msg.content.substring(msgToLowerCase.indexOf("+") + 2).split("|");
            console.log(msgParameters);
            if (!msgParameters[0] || msgParameters.length < 3) {
                msg.reply("Syötä kyselyn tiedot muodossa: **!poll + otsikko | dd.mm.yyyy _hh:mm_ | #kanava | vaihtoehto 1 | vaihtoehto 2 jne.**");
                break;
            };

            const id = Math.random().toString(16).slice(9);

            const pollTopic = msgParameters[0];
            console.log(pollTopic);

            if (!msgParameters[1]) {
                msg.reply("Päivämäärä puuttuu! !poll + otsikko | **dd.mm.yyyy _hh:mm_** | #kanava | vaihtoehto 1 | vaihtoehto 2 jne.");
                break;
            }

            const pollDateTime = msgParameters[1];
            const pollDateTimeFormatted = moment(pollDateTime, "DD/MM/YYYY HH:mm").format("YYYY-MM-DD HH:mm");
            console.log(pollDateTimeFormatted);
            if (!moment(pollDateTimeFormatted, "YYYY/MM/DD").isValid()) {
                msg.reply("Anna päivämäärä oikeassa muodossa: !poll + otsikko | **dd.mm.yyyy _hh:mm_** | #kanava | vaihtoehto 1 | vaihtoehto 2 jne.");
                break;
            }

            const currentDateTime = moment().format("YYYY-MM-DD HH:mm");
            console.log(currentDateTime);
            if (moment(pollDateTimeFormatted).isSameOrBefore(currentDateTime)) {
                msg.reply("Antamasi päivämäärä tai kellonaika on jo mennyt!");
                break;
            } else if (moment(pollDateTimeFormatted).isAfter(moment(currentDateTime).add(6, "months"))) {
                msg.reply("Kyselyn aikarajaa ei voi asettaa yli puolen vuoden päähän!");
                break;
            }

            const pollChannelId = msgParameters[2].substring(msgParameters[2].indexOf("#") + 1, msgParameters[2].indexOf(">")).trim();
            console.log(pollChannelId);
            const pollChannel = client.channels.cache.get(pollChannelId);
            if (!pollChannel || (msgParameters[2].trim() !== ("<#" + pollChannelId + ">"))) {
                msg.reply("Antamaasi tekstikanavaa ei ole olemassa!");
                break;
            } else if (pollChannel.type === 2) {
                msg.reply("Anna kanavaksi tekstikanava!");
                break;
            }

            const guild = getBotGuild();
            if(!guild.members.me.permissionsIn(pollChannel).has(PermissionsBitField.Flags.SendMessages)) {
                msg.reply("En voi lähettää viestejä kanavalle <#" + pollChannelId + ">");
                break;
            }

            const pollOptions = msgParameters.slice(3);
            console.log(pollOptions);

            if (pollOptions.length < 2) {
                msg.reply("Kyselyllä täytyy olla ainakin 2 vastaus vaihtoehtoa");
                break;
            } else if (pollOptions.length > 10) {
                msg.reply("Kyselyllä voi olla maksimissaan 10 vastaus vaihtoehtoa");
                break;
            }

            createNewPoll(msg, id, msgAuthor, pollTopic, pollDateTimeFormatted, pollChannelId, pollOptions)
            return;

        case "!poll -":
            if (msg.author.bot) break;

            const pollId = msg.content.substring(msgToLowerCase.indexOf("-") + 1).trim();
            if (!pollId) {
                msg.reply("Anna poistettavan kyselyn id!\nNäet kyselyjen id:t komennolla **!poll list**");
                break;
            }

            deletePoll(msg, pollId, msgAuthor);
            break;

        case "!polls":
        case "!poll list":
            pollsEmbed.title = "Polls";

            getPolls(msg).then(polls => {
                if (polls.length > 0) {
                    const pollsSorted = polls.sort((a, b) => a.date.getTime() - b.date.getTime());
                    pollsSorted.forEach(field => pollsEmbed.fields.push({
                        name: "ID: " + field.pollId,
                        value: "Topic: " + field.topic +
                            "\nDate: " + moment(field.date).format("DD.MM.YYYY HH:mm") +
                            "\nChannel: <#" + field.channelId + ">" +
                            "\nVotes: " + field.votes.number +
                            "\n" + field.options.map(option => option + ": ").join(",\n")
                    }));

                    if (msg.author.bot) {
                        msg.edit({ 
                        content: "",
                        embeds: [pollsEmbed] });
                    } else {
                        msg.channel.send({ embeds: [pollsEmbed] });
                    }
                } else {
                    msg.reply("Et ole luonut vielä kyselyjä...")
                }
            })

            break;

        default:
            if (msg.author.bot) break;
            msg.reply("Syötä ajastetun viestin tiedot muodossa: **!timed + viesti | dd.mm.yyyy _hh:mm_ | #kanava**");
            break;
    }
}

const createNewPoll = async (msg, pollId, author, topic, date, channelId, options) => {
    await new poll({ 
        pollId,
        msgId: "-",
        author,
        topic,
        date,
        channelId,
        options,
        votes: {
            number: 0,
            entry: []
        }
    })
    .save()
    .then(response => {
        console.log("New poll created: " + response);
        msg.react("✅");
    })
    .catch(err => {
        console.log(err);
        msg.reply("Sori nyt ei pysty...")
        return;
    });

    const numbers = getNumberEmotes();

    pollsEmbed.title = topic
    pollsEmbed.fields = [];
    pollsEmbed.fields.push({
        name: "ID: " + pollId,
        value: options.map((option, index) => numbers[index] + ": " + option + ": 0").join("\n")
    });
    pollsEmbed.footer = ({ text: "\nDeadline: " + moment(date).format("DD.MM.YYYY HH:mm") });

    const pollMsg = await msg.channel.send({ embeds: [pollsEmbed] });

    console.log(pollMsg.id);

    await poll.updateOne(
        { pollId },
        { $set: { msgId: pollMsg.id }}
    ).then(response => {
        if (response) {
            console.log("Poll msgId added");
            console.log(response);
        }
    }).catch(err => {
        console.log(err);
        msg.reply("Sori nyt ei pysty...");
    });

    options.forEach((option, index) => {
        pollMsg.react(numbers[index]);
    });
};

const deletePoll = async (msg, pollId, author) => {
    await poll.findOneAndDelete({ 
        pollId,
        author
    })
    .then(response => {
        if (response) {
            console.log("Poll deleted: " + response);
            msg.react("✅");
        } else {
            msg.reply("Et voi poistaa kyselyä **" + pollId + "**, tai antamasi id on väärä!");
        }
    }).catch(err => {
        console.log(err);
        msg.reply("Sori nyt ei pysty...");
    });
}

const getPolls = async (msg) => {
    return await poll.find(
        { author: msg.author.username + "#" + msg.author.discriminator },
        { _id: 0, pollId: 1, author: 1, topic: 1, date: 1, channelId: 1, options: 1, votes: 1}
    )
    .lean();
}