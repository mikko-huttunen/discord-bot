import { PermissionsBitField } from "discord.js";
import moment from "moment";
import { getBotGuild } from "../data/bot_data.js";
import { poll } from "../models/poll_schema.js";
import { getNumberEmotes } from "../data/emotes.js";

const pollsEmbed = {
    color: 0x32cd32,
    fields: []
};

export const handlePoll = (msg, client) => {
    const msgToLowerCase = msg.content.toLowerCase();
    const msgCommand = msgToLowerCase.split(" ")[0] + " " + msgToLowerCase.split(" ")[1];
    const msgAuthor = msg.author.username + "#" + msg.author.discriminator;

    switch(msgCommand) {
        case "!poll +":
            if (msg.author.bot) break;
            let msgParameters = msg.content.substring(msgToLowerCase.indexOf("+") + 2).split("|");
            msgParameters = msgParameters.map(parameter => parameter.trim());
            if (!msgParameters[0] || msgParameters.length < 3) {
                msg.reply("Syötä kyselyn tiedot muodossa: **!poll + otsikko | dd.mm.yyyy _hh:mm_ | #kanava | vaihtoehto 1 | vaihtoehto 2 jne.**");
                break;
            };

            const id = Math.random().toString(16).slice(9);
            const pollTopic = msgParameters[0];

            if (!msgParameters[1]) {
                msg.reply("Päivämäärä puuttuu! !poll + otsikko | **dd.mm.yyyy _hh:mm_** | #kanava | vaihtoehto 1 | vaihtoehto 2 jne.");
                break;
            }

            const pollDateTime = msgParameters[1];
            const pollDateTimeFormatted = moment(pollDateTime, "DD/MM/YYYY HH:mm").format("YYYY-MM-DD HH:mm");
            if (!moment(pollDateTimeFormatted, "YYYY/MM/DD").isValid()) {
                msg.reply("Anna päivämäärä oikeassa muodossa: !poll + otsikko | **dd.mm.yyyy _hh:mm_** | #kanava | vaihtoehto 1 | vaihtoehto 2 jne.");
                break;
            }

            const currentDateTime = moment().format("YYYY-MM-DD HH:mm");
            if (moment(pollDateTimeFormatted).isSameOrBefore(currentDateTime)) {
                msg.reply("Antamasi päivämäärä tai kellonaika on jo mennyt!");
                break;
            } else if (moment(pollDateTimeFormatted).isAfter(moment(currentDateTime).add(6, "months"))) {
                msg.reply("Kyselyn aikarajaa ei voi asettaa yli puolen vuoden päähän!");
                break;
            }

            const pollChannelId = msgParameters[2].substring(msgParameters[2].indexOf("#") + 1, msgParameters[2].indexOf(">")).trim();
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

            deletePollByAuthor(msg, pollId, msgAuthor);
            break;

        case "!polls":
        case "!poll list":
            pollsEmbed.title = "📊 Polls 📊";
            pollsEmbed.fields = [];
            pollsEmbed.footer = {};

            getPollsByAuthor(msg).then(polls => {
                if (polls.length > 0) {
                    const pollsSorted = polls.sort((a, b) => a.date.getTime() - b.date.getTime());
                    pollsSorted.forEach(field => pollsEmbed.fields.push({
                        name: "ID: " + field.pollId,
                        value: "Topic: " + field.topic +
                            "\nDate: " + moment(field.date).format("DD.MM.YYYY HH:mm") +
                            "\nChannel: <#" + field.channelId + ">" +
                            "\nVotes: " + field.votes.number +
                            "\n" + field.options.map((option, index) => option + ": " +
                                field.votes.entry.filter(entry => entry.answer === index + 1).length).join("\n")
                    }));

                    if (msg.author.bot) {
                        msg.edit({ 
                            content: "",
                            embeds: [pollsEmbed] 
                        });
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

    pollsEmbed.title = "📊 " + topic + " 📊";
    pollsEmbed.fields = [];
    pollsEmbed.fields.push({
        name: " ",
        value: options.map((option, index) => numbers[index] + " " + option + ": 0").join("\n")
    });
    pollsEmbed.fields.push({
        name: " ",
        value: "Votes: " + 0
    });
    pollsEmbed.footer = ({ text: "Deadline: " + moment(date).format("DD.MM.YYYY HH:mm") + "\nID: " + pollId});

    const channel = getBotGuild().channels.cache.get(channelId);
    const pollMsg = await channel.send({ embeds: [pollsEmbed] });

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

const deletePollByAuthor = async (msg, pollId, author) => {
    let channel;
    let msgId;

    await poll.findOneAndDelete({ 
        pollId,
        author
    })
    .then(response => {
        if (response) {
            channel = getBotGuild().channels.cache.get(response.channelId);
            msgId = response.msgId;
            console.log("Poll deleted: " + response);
            msg.react("✅");
        } else {
            msg.reply("Et voi poistaa kyselyä **" + pollId + "**, tai antamasi id on väärä!");
        }
    }).catch(err => {
        console.log(err);
        msg.reply("Sori nyt ei pysty...");
    });

    const pollMsg = await channel.messages.fetch(msgId);
    pollMsg.delete();
}

export const deletePollByMsg = async (msgId) => {
    await poll.findOneAndDelete({
        msgId
    })
    .then(response => {
        if (response) {
            console.log("Poll deleted: " + response);
        }
    }).catch(err => {
        console.log(err);
    });
}

const getPollsByAuthor = async (msg) => {
    return await poll.find(
        { author: msg.author.username + "#" + msg.author.discriminator },
        { _id: 0, pollId: 1, author: 1, topic: 1, date: 1, channelId: 1, options: 1, votes: 1}
    )
    .lean();
}

export const getPollsByMsg = async (msg) => {
    return await poll.find(
        { msgId: msg.id },
        { _id: 0, pollId: 1, msgId: 1, author: 1, topic: 1, date: 1, channelId: 1, options: 1, votes: 1}
    )
    .lean();
}

export const getPolls = async () => {
    return await poll.find(
        {},
        { _id: 0, pollId: 1, msgId: 1, author: 1, topic: 1, date: 1, channelId: 1, options: 1, votes: 1}
    ).lean();
};

//Delete if not used
// export const addVote = async (reaction) => {
//     const vote = getNumberEmotes().indexOf(reaction._emoji.name) + 1;
//     const entry = {
//         user: reaction.message.author,
//         answer: vote
//     };

//     await poll.updateOne(
//         { msgId: reaction.message.id },
//         { $inc: {
//             "votes.number": 1
//         }, $push: { 
//             "votes.entry": entry
//         }}
//     ).then(response => {
//         if (response) {
//             console.log("Vote add");
//             console.log(response);
//         }
//     }).catch(err => {
//         console.log(err);
//     });
// }

export const updateVotes = async (reactions, removedReactions, pollData) => {
    let entries = pollData.votes.entry;

    if (reactions.length) {
        let newEntries = reactions.map(reaction => ({
            user: reaction.user.username + "#" + reaction.user.discriminator,
            answer: getNumberEmotes().indexOf(reaction.reaction._emoji.name) + 1
        }));

        let entriesToAdd = newEntries.filter(newEntry => {
            const result = entries.find(entry => entry.user === newEntry.user && entry.answer === newEntry.answer);
            return !result;
        });

        entries = entries.concat(entriesToAdd);
    }

    if (removedReactions.length) {
        let removedEntries = removedReactions.map(reaction => ({
            user: reaction.user.username + "#" + reaction.user.discriminator,
            answer: getNumberEmotes().indexOf(reaction.reaction._emoji.name) + 1
        }));

        entries = entries.filter(entry => {
            const result = removedEntries.find(rEntry => rEntry.user === entry.user && rEntry.answer === entry.answer);
            return !result;
        });
    }

    await poll.updateMany(
        { msgId: pollData.msgId },
        { 
            "votes.number": entries.length,
            "votes.entry": entries
        }
    ).then(response => {
        if (response) {
            console.log("Vote add");
            console.log(response);
        }
    }).catch(err => {
        console.log(err);
    });

    updatePollMsg(pollData, entries);
};

const updatePollMsg = async (pollData, entries) => {
    const channel = getBotGuild().channels.cache.get(pollData.channelId);
    const msg = await channel.messages.fetch(pollData.msgId);
    const numbers = getNumberEmotes();
    
    pollsEmbed.title = "📊 " + pollData.topic + " 📊";
    pollsEmbed.fields = [];
    pollsEmbed.fields.push({
        name: " ",
        value: pollData.options.map((option, index) => numbers[index] + " " + option + ": " +
            entries.filter(entry => entry.answer === index + 1).length).join("\n")
    });
    pollsEmbed.fields.push({
        name: " ",
        value: "Votes: " + entries.length
    });
    pollsEmbed.footer = ({ text: "Deadline: " + moment(pollData.date).format("DD.MM.YYYY HH:mm") + "\nID: " + pollData.pollId});

    msg.edit({ embeds: [pollsEmbed] });
}

export const postPollResults = async (client, query) => {
    await poll.find(query)
    .then(async (response) => {
        if (response.length > 0) {
            console.log("Poll results posted: " + response);
            await syncPollVotesOnStartUp(client);
        }

        response.forEach(poll => {
            const { topic, channelId, options, votes } = poll;
            const guild = getBotGuild();
            const channel = client.channels.cache.get(channelId);

            const entries = options.map((option, index) => ({
                option: "**" + option + ": " + votes.entry.filter(entry => entry.answer === index + 1).length + "**",
                voters: votes.entry.filter(entry => entry.answer === index + 1).map(entry => entry.user.split("#")[0]).join(", ")
            }))
            .sort((a, b) => b.voters.length - a.voters.length);
            
            pollsEmbed.title = "📊 Poll Results 📊";
            pollsEmbed.fields = [];
            pollsEmbed.fields.push({
                name: topic,
                value: entries.map(entry => entry.voters.length ? (entry.option + "\n" + entry.voters) : entry.option).join("\n")
            });
            pollsEmbed.fields.push({
                name: "Votes: " + votes.number,
                value: " "
            });
            pollsEmbed.footer = {};

            if (!channel) return;

            if(guild.members.me.permissionsIn(channel).has(PermissionsBitField.Flags.SendMessages)) {
                channel.send({ embeds: [pollsEmbed] });
            } else {
                return;
            }
        });
    })
    .catch(err => {
        console.log(err);
    });

    await poll.deleteMany(query)
    .then(response => {
        if (response.length > 0) {
            console.log(response)
        }
    })
    .catch(err => {
        console.log(err);
    });
}

export const syncPollVotesOnStartUp = async (client) => {
    const numberEmojis = getNumberEmotes();
    const activePolls = await getPolls();

    for (const pollData of activePolls) {
        const channel = getBotGuild().channels.cache.get(pollData.channelId);
        let currentVotes = [];
        let pollMsg;

        try {
            pollMsg = await channel.messages.fetch(pollData.msgId);
        } catch {
            pollMsg = null;
        }

        if (pollMsg) {
            const reactions = pollMsg.reactions.cache.filter(reaction => numberEmojis.includes(reaction._emoji.name)).map(reaction => reaction);
            
            for (const reaction of reactions) {
                await reaction.users.fetch()
                .then(users => {
                    users.forEach(user => {
                        if (user.id !== client.user.id) {
                            const entry = {
                                user: user.username + "#" + user.discriminator,
                                answer: getNumberEmotes().indexOf(reaction._emoji.name) + 1
                            }
                            currentVotes.push(entry);
                        };
                    });
                });
            }
            
            if (currentVotes > 0) {
                const entriesToAdd = currentVotes.filter(vote => {
                    const result = pollData.votes.entry.find(entry => entry.user === vote.user && entry.answer === vote.answer);
                    return !result;
                });

                if (entriesToAdd.length > 0) {
                    currentVotes = currentVotes.concat(entriesToAdd);
                }
            }

            const entriesToDelete = pollData.votes.entry.filter(entry => {
                const result = currentVotes.find(vote => vote.user === entry.user && vote.answer === entry.answer);
                return !result;
            });

            if (entriesToDelete.length > 0) {
                currentVotes = currentVotes.filter(vote => {
                    const result = entriesToDelete.find(entry => entry.user !== vote.user && entry.answer !== vote.answer);
                    return !result;
                });
            }

            await poll.updateMany(
                { msgId: pollData.msgId },
                { 
                    "votes.number": currentVotes.length,
                    "votes.entry": currentVotes
                }
            ).then(response => {
                if (response) {
                    console.log("Vote add");
                    console.log(response);
                }
            }).catch(err => {
                console.log(err);
            });

            updatePollMsg(pollData, currentVotes);
        } else {
            deletePollByMsg(pollData.msgId);
        }
    }
}