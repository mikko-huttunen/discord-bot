import { PermissionsBitField } from "discord.js";
import moment from "moment";
import { getBotGuild } from "../data/bot_data.js";
import { poll } from "../models/poll_schema.js";
import { getNumberEmotes } from "../data/emotes.js";
import { canSendMessageToChannel, isValidDateAndRepetition } from "../data/checks.js";
import { getUserData } from "./helpers.js";
import _ from "lodash";

const pollEmbed = {
    color: 0x32cd32,
    fields: []
};

export const handlePoll = async (interaction) => {
    switch(interaction.commandName) {
        case "poll": {
            const author = interaction.user.id;
            const topic = interaction.options.getString("topic");
            const date = interaction.options.getString("date");
            const dateTime = moment(date, "DD/MM/YYYY HH:mm").format("YYYY-MM-DD HH:mm");
            const repeat = interaction.options.getString("repeat").toLowerCase();
            const channel = interaction.options.getChannel("channel");
            const channelId = channel.id;
            const options = interaction.options._hoistedOptions
                .filter(option => option.name.includes("option"))
                .map(option => option.value);

            if (!await canCreateNewPoll(interaction.user)) {
                interaction.reply({
                    content: "Sinulla voi olla maksimissaan 5 luotua äänestystä\n" +
                        "Voit katsoa äänestyksesi komennolla **/listpolls**, ja poistaa niitä komennolla **/deletepolls**.",
                    ephemeral: true,
                });
                break;
            }

            if (!await canSendMessageToChannel(channel)) {
                interaction.reply({ content: "En voi luoda äänestystä kanavalle <#" + channelId + ">", ephemeral: true });
                break;
            }

            if (!isValidDateAndRepetition(interaction, dateTime, repeat)) return;

            const id = Math.random().toString(16).slice(9);
            createNewPoll(interaction, id, author, topic, dateTime, repeat, channelId, options);
            break;
        }

        case "deletepoll": {
            const id = interaction.options.getString("id");
            const author = interaction.user.id;

            deletePollByAuthor(interaction, id, author);
            break;
        }

        case "listpolls": {
            pollEmbed.author = {};
            pollEmbed.title = "📊 Polls 📊";
            pollEmbed.fields = [];
            pollEmbed.footer = {};

            getPollsByAuthor(interaction.user.id)
                .then(polls => {
                    if (polls.length > 0) {
                        const pollsSorted = polls.sort((a, b) => a.date.getTime() - b.date.getTime());
                        pollsSorted.forEach(field => pollEmbed.fields.push({
                            name: "ID: " + field.pollId,
                            value: "Topic: " + field.topic +
                                "\nDeadline: " + moment(field.date).format("DD.MM.YYYY HH:mm") +
                                "\nChannel: <#" + field.channelId + ">" +
                                "\nVotes: " + field.votes.number
                        }));

                        interaction.reply({ embeds: [pollEmbed], ephemeral: true });
                    } else {
                        interaction.reply({ content: "Et ole luonut vielä kyselyjä...", ephemeral: true });
                    }
            })

            break;
        }

        default: {
            break;
        }
    }
}

const canCreateNewPoll = async (user) => {
    return getPollsByAuthor(user)
        .then(polls => {
            if (polls.length >= 5) {
                return false;
            }

            return true;
        });
};

const createPollMsg = async (pollId, author, topic, dateTime, channelId, options) => {
    const numbers = getNumberEmotes();
    const authorData = await getBotGuild().members.fetch(author);
    
    pollEmbed.author = {
        name: authorData.nickname ? authorData.nickname : authorData.user.username,
        icon_url: authorData.user.avatarURL()
    },
    pollEmbed.title = "📊 " + topic + " 📊";
    pollEmbed.fields = [];
    pollEmbed.fields.push({
        name: " ",
        value: options.map((option, index) => numbers[index] + " " + option + ": 0").join("\n")
    });
    pollEmbed.fields.push({
        name: " ",
        value: "Votes: " + 0
    });
    pollEmbed.footer = ({ text: "Deadline: " + moment(dateTime).format("DD.MM.YYYY HH:mm") + "\nID: " + pollId});

    const channel = getBotGuild().channels.cache.get(channelId);
    const pollMsg = await channel.send({ embeds: [pollEmbed] });

    return pollMsg;
}

export const createNewPoll = async (interaction, pollId, author, topic, dateTime, repeat, channelId, options) => {
    const numbers = getNumberEmotes();
    const pollMsg = await createPollMsg(pollId, author, topic, dateTime, channelId, options);

    await new poll({
        pollId,
        msgId: pollMsg.id,
        author,
        topic,
        date: dateTime,
        repeat,
        channelId,
        options,
        votes: {
            number: 0,
            entries: []
        }
    })
    .save()
    .then(response => {
        console.log("New poll created: " + response);
        interaction.reply({ content: "New poll created successfully!", ephemeral: true });
    })
    .catch(err => {
        console.log(err);
        interaction.reply({ content: "Something went wrong! :(", ephemeral: true });
        return;
    });

    options.forEach((_option, index) => {
        pollMsg.react(numbers[index]);
    });
};

const getPollsByAuthor = async (author) => {
    return await poll.find(
        { author },
        { _id: 0, pollId: 1, msgId: 1, author: 1, topic: 1, date: 1, channelId: 1, options: 1, votes: 1 }
    )
    .lean();
}

export const getPollsByMsg = async (msg) => {
    return await poll.find(
        { msgId: msg.id },
        { _id: 0, pollId: 1, msgId: 1, author: 1, topic: 1, date: 1, channelId: 1, options: 1, votes: 1 }
    )
    .lean();
}

export const getPolls = async () => {
    return await poll.find(
        {},
        { _id: 0, pollId: 1, msgId: 1, author: 1, topic: 1, date: 1, repeat: 1, channelId: 1, options: 1, votes: 1 }
    ).lean();
};

const deletePollByAuthor = async (interaction, pollId, author) => {
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
            interaction.reply({ content: "Poll deleted successfully!", ephemeral: true });
        } else {
            interaction.reply({ content: "Et voi poistaa kyselyä **" + pollId + "**, tai antamasi id on väärä!", ephemeral: true });
        }
    }).catch(err => {
        console.log(err);
        interaction.reply({ content: "Something went wrong! :(", ephemeral: true });
    });

    try {
        const pollMsg = await channel.messages.fetch(msgId);
        pollMsg.delete();
    } catch (error) {
        console.error(error);
    }
};

export const deletePollByMsg = async (msgId) => {
    await poll.findOneAndDelete({ 
        msgId,
        repeat: "never"
    })
    .then(response => {
        if (response) {
            console.log("Poll deleted:");
            console.log(response);
        }
    }).catch(err => {
        console.log(err);
    });
};

export const handlePollReaction = async (reaction, user) => {
    const activePolls = await getPollsByMsg(reaction.message);
    const vote = getNumberEmotes().indexOf(reaction._emoji.name) + 1;

    if (activePolls.length > 0) {
        const pollData = activePolls.find(poll => poll.msgId === reaction.message.id);

        //Check if number emoji is a valid vote
        if (vote > pollData.options.length) return;

        let entries = pollData.votes.entries.map(entry => ({
            id: entry.id,
            name: entry.name,
            vote: entry.vote
        }));

        const userData = await getUserData(user.id);
        const entry = {
            id: userData.user.id,
            name: userData.nickname ? userData.nickname : userData.user.username,
            vote
        };

        const isExistingEntry = entries.some(e => e.id === entry.id && e.vote === entry.vote);

        if (!isExistingEntry) {
            entries.push(entry);
        }

        if (isExistingEntry) {
            entries = _.reject(entries, function(e) { 
                return e.id === entry.id && e.vote === entry.vote; 
            });
        }

        await updatePollVotes(pollData, entries);
        await updatePollMsg(pollData, entries);
    }

    return;
};

const updatePollVotes = async (pollData, entries) => {
    await poll.findOneAndUpdate(
        { pollId: pollData.pollId },
        { 
            "votes.number": entries.length,
            "votes.entries": entries
        }
    ).then(response => {
        if (response) {
            console.log("Votes updated:");
            console.log(response);
        }
    }).catch(err => {
        console.log(err);
    });
}

const updatePollData = async (pollId, msgId, newDate) => {
    await poll.findOneAndUpdate(
        { pollId },
        {
            msgId,
            date: newDate,
            "votes.number": 0,
            "votes.entries": [] 
        }, { returnDocument: "after" }
    )
    .then(console.log("Poll " + pollId + " updated!"))
    .catch(err => {
        console.log(err);
    })
};

const updatePollMsg = async (pollData, entries) => {
    const channel = getBotGuild().channels.cache.get(pollData.channelId);
    const msg = await channel.messages.fetch(pollData.msgId);
    const numbers = getNumberEmotes();
    
    if (!Object.prototype.hasOwnProperty.call(pollEmbed, "author")) {
        const authorData = await getBotGuild().members.fetch(pollEmbed.author);

        pollEmbed.author = {
            name: authorData.nickname ? authorData.nickname : authorData.user.username,
            icon_url: authorData.user.avatarURL()
        };
    }
    pollEmbed.title = "📊 " + pollData.topic + " 📊";
    pollEmbed.fields = [];
    pollEmbed.fields.push({
        name: " ",
        value: pollData.options.map((option, index) => numbers[index] + " " + option + ": " +
            entries.filter(entry => entry.vote === index + 1).length).join("\n")
    });
    pollEmbed.fields.push({
        name: " ",
        value: "Votes: " + entries.length
    });
    pollEmbed.footer = ({ text: "Deadline: " + moment(pollData.date).format("DD.MM.YYYY HH:mm") + "\nID: " + pollData.pollId});

    msg.edit({ embeds: [pollEmbed] });
}

export const postPollResults = async (client) => {
    const numbers = getNumberEmotes();
    const query = {
        date: {
            $lte: moment.utc()
        }
    }

    await poll.find(query)
    .then(async (response) => {
        if (response.length > 0) {
            console.log("Poll results posted: " + response);
            await syncPollVotes(client);

            response.forEach(async (pollData) => {
                const { pollId, msgId, author, topic, date, repeat, channelId, options, votes } = pollData;
                const guild = getBotGuild();
                const channel = await client.channels.cache.get(channelId);

                if (!channel) {
                    console.log("No channel to send poll results of " + pollId);
                    return;
                }

                if (canSendMessageToChannel(channel)) {
                    const entries = options.map((option, index) => ({
                        option: "**" + option + ": " + votes.entries.filter(entry => entry.vote === index + 1).length + "**",
                        voters: votes.entries
                            .filter(entry => entry.vote === index + 1)
                            .map(entry => entry.name)
                            .join(", ")
                    }))
                    .sort((a, b) => b.voters.length - a.voters.length);
                    
                    const authorData = await getBotGuild().members.fetch(author);

                    pollEmbed.author = {
                        name: authorData.nickname ? authorData.nickname : authorData.user.username,
                        icon_url: authorData.user.avatarURL()
                    },
                    pollEmbed.title = "📊 Poll Results 📊";
                    pollEmbed.fields = [];
                    pollEmbed.fields.push({
                        name: topic,
                        value: entries.map(entry => entry.voters.length ? (entry.option + "\n" + entry.voters) : entry.option).join("\n")
                    });
                    pollEmbed.fields.push({
                        name: "Votes: " + votes.number,
                        value: " "
                    });
                    pollEmbed.footer = {};

                    if(guild.members.me.permissionsIn(channel).has(PermissionsBitField.Flags.SendMessages)) {
                        await channel.send({ embeds: [pollEmbed] });
                    } else {
                        return;
                    }

                    try {
                        const pollMsg = await channel.messages.fetch(msgId);
                        pollMsg.delete();
                    } catch (error) {
                        console.error(error);
                    }

                    if (repeat !== "never") {
                        let newDate;

                        if (repeat === "daily") {
                            newDate = moment(date).add(1, "d");
                        } else if (repeat === "weekly") {
                            newDate = moment(date). add(1, "w");
                        } else if (repeat === "monthly") {
                            newDate = moment(date). add(1, "M");
                        } else if (repeat === "yearly") {
                            newDate = moment(date). add(1, "y");
                        }

                        const newPollMsg = await createPollMsg(pollId, author, topic, newDate, channelId, options);
                        await updatePollData(pollId, newPollMsg.id, newDate);
                        options.forEach((_option, index) => {
                            newPollMsg.react(numbers[index]);
                        });
                    } else {
                        await poll.findOneAndDelete({ pollId })
                        .then(response => {
                            if (response.length > 0) {
                                console.log("Poll " + pollId + " deleted:");
                                console.log(response)
                            }
                        })
                        .catch(err => {
                            console.log(err);
                        });
                    }
                } else {
                    console.log("Cannot send poll results of " + pollId + " to channel: " + channelId);
                    return;
                }
            });
        }
    })
    .catch(err => {
        console.log(err);
    });
};

export const syncPollVotes = async (client) => {
    const activePolls = await getPolls();

    for (const pollData of activePolls) {
        const numberEmojis = getNumberEmotes().slice(0, pollData.options.length);

        const channel = getBotGuild().channels.cache.get(pollData.channelId);
        const authorData = await getBotGuild().members.fetch(pollData.author);
    
        pollEmbed.author = {
            name: authorData.nickname ? authorData.nickname : authorData.user.username,
            icon_url: authorData.user.avatarURL()
        };

        let entries = [];
        let pollMsg;

        try {
            pollMsg = await channel.messages.fetch(pollData.msgId);
        } catch {
            pollMsg = null;
            console.log("Could not fetch poll message!");
        }

        if (pollMsg) {
            const reactions = pollMsg.reactions.cache.filter(reaction => numberEmojis.includes(reaction._emoji.name)).map(reaction => reaction);
            entries = await getEntries(client, reactions);

            await poll.findOneAndUpdate(
                { msgId: pollData.msgId },
                { 
                    "votes.number": entries.length,
                    "votes.entries": entries
                }
            ).then(response => {
                if (response) {
                    console.log("Votes updated:");
                    console.log(response);
                }
            }).catch(err => {
                console.log(err);
            });

            await updatePollMsg(pollData, entries);
        } else {
            deletePollByMsg(pollData.msgId);
        }
    }
};

const getEntries = async (client, reactions) => {
    let entries = [];
    const numberEmojis = getNumberEmotes();

    for (const reaction of reactions) {
        await reaction.users.fetch()
        .then(users => {
            users.forEach(user => {
                getUserData(user.id)
                .then(userData => {
                    if (user.id !== client.user.id) {
                        const entry = {
                            id: userData.user.id,
                            name: userData.nickname ? userData.nickname : userData.user.username,
                            vote: numberEmojis.indexOf(reaction._emoji.name) + 1
                        };

                        entries.push(entry);
                    }
                });
            });
        });
    }

    return entries;
}