import moment from "moment";
import _ from "lodash";
import { canSendMessageToChannel, isValidDateAndRepetition } from "../helpers/checks.js";
import { createPoll, deletePollById, deletePollByMsg, getPollByMsg, getPolls, getPollsByQuery, getPollsByUser, updatePollData, updatePollVotes } from "./services/poll_service.js";
import { bot } from "../../bot/bot.js";
import { generateId, getChannelName, getNumberEmojis, getUnicodeEmoji, getUserData } from "../helpers/helpers.js";
import { CHANNEL, DAILY, DATE, DAY_MONTH_YEAR_24, FAILURE, FETCH_ERR, ID, ISO_8601_24, MAX_POLLS, MONTHLY, MSG_DELETION_ERR, MSG_FETCH_ERR, NEVER, NO_CHANNEL, NO_RESULTS, REPEAT, SEND_PERMISSION_ERR, TOPIC, WEEKLY, YEARLY } from "../../variables/constants.js";

const pollEmbed = {
    color: 0x32cd32,
    fields: []
};
const numberEmojis = getNumberEmojis();
const barChartEmoji = getUnicodeEmoji("1F4CA");

export const handlePoll = async (interaction) => {
    switch(interaction.commandName) {
        case "poll": {
            const author = interaction.user.id;
            const topic = interaction.options.getString(TOPIC);
            const date = interaction.options.getString(DATE);
            const dateTime = moment(date, DAY_MONTH_YEAR_24).format(ISO_8601_24);
            const repeat = interaction.options.getString(REPEAT).toLowerCase();
            const channel = interaction.options.getChannel(CHANNEL);
            const channelId = channel.id;
            const options = interaction.options._hoistedOptions
                .filter(option => option.name.includes("option"))
                .map(option => option.value);

            if (!await canCreateNewPoll(interaction.user)) {
                interaction.reply({ content: MAX_POLLS, ephemeral: true });
                break;
            }

            if (!await canSendMessageToChannel(channel)) {
                interaction.reply({ content: SEND_PERMISSION_ERR + getChannelName(channel.id), ephemeral: true });
                break;
            }

            if (!isValidDateAndRepetition(interaction, dateTime, repeat)) return;

            createNewPoll(interaction, author, topic, dateTime, repeat, channelId, options);
            break;
        }

        case "deletepoll": {
            const id = interaction.options.getString(ID);
            const author = interaction.user.id;

            deletePollById(id, author, interaction);
            break;
        }

        case "listpolls": {
            pollEmbed.author = {};
            pollEmbed.title = barChartEmoji + " Polls " + barChartEmoji;
            pollEmbed.fields = [];
            pollEmbed.footer = {};

            getPolls()
            .then(polls => {
                if (polls.length > 0) {
                    const pollsSorted = polls.sort((a, b) => a.date.getTime() - b.date.getTime());
                    pollsSorted.forEach(field => pollEmbed.fields.push({
                        name: "ID: " + field.pollId,
                        value: "Topic: " + field.topic +
                            "\nDeadline: " + moment(field.date).format(DAY_MONTH_YEAR_24) +
                            "\nChannel: " + getChannelName(field.channelId) +
                            "\nVotes: " + field.votes.number
                    }));

                    interaction.reply({ embeds: [pollEmbed], ephemeral: true });
                } else {
                    interaction.reply({ content: NO_RESULTS, ephemeral: true });
                }
            }).catch(err => {
                console.error(FETCH_ERR, err);
                interaction.reply({ content: FAILURE, ephemeral: true });
            });

            break;
        }

        default: {
            break;
        }
    }
}

const canCreateNewPoll = async (user) => {
    return getPollsByUser(user).then(polls => {
        if (polls.length >= 5) {
            return false;
        }

        return true;
    }).catch(err => {
        console.error(FETCH_ERR, err);
    });
};

const createPollMsg = async (pollId, author, topic, dateTime, channelId, options) => {
    const authorData = await bot.guild.members.fetch(author);
    
    pollEmbed.author = {
        name: authorData.nickname ? authorData.nickname : authorData.user.username,
        icon_url: authorData.user.avatarURL()
    },
    pollEmbed.title = barChartEmoji + " " + topic + " " + barChartEmoji;
    pollEmbed.fields = [];
    pollEmbed.fields.push({
        name: " ",
        value: options.map((option, index) => numberEmojis[index] + " " + option + ": 0").join("\n")
    });
    pollEmbed.fields.push({
        name: " ",
        value: "Votes: " + 0
    });
    pollEmbed.footer = ({ text: "Deadline: " + moment(dateTime).format(DAY_MONTH_YEAR_24) + "\nID: " + pollId});

    const channel = bot.guild.channels.cache.get(channelId);
    const pollMsg = await channel.send({ embeds: [pollEmbed] });

    return pollMsg;
}

export const createNewPoll = async (interaction, author, topic, dateTime, repeat, channelId, options) => {
    const pollId = generateId();
    const pollMsg = await createPollMsg(pollId, author, topic, dateTime, channelId, options);

    createPoll(interaction, pollId, pollMsg.id, author, topic, dateTime, repeat, channelId, options);

    options.forEach((_option, index) => {
        pollMsg.react(numberEmojis[index]);
    });
};

export const handlePollReaction = async (reaction, user) => {
    const pollData = await getPollByMsg(reaction.message)
    .catch(err => {
        console.error(FETCH_ERR, err);
    });
    const vote = numberEmojis.indexOf(reaction._emoji.name) + 1;

    if (pollData) {
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

const updatePollMsg = async (pollData, entries) => {
    const channel = bot.guild.channels.cache.get(pollData.channelId);
    const msg = await channel.messages.fetch(pollData.msgId);
    const authorData = await bot.guild.members.fetch(pollData.author);
    
    pollEmbed.author = {
        name: authorData.nickname ? authorData.nickname : authorData.user.username,
        icon_url: authorData.user.avatarURL()
    };
    pollEmbed.title = barChartEmoji + " " + pollData.topic + " " + barChartEmoji;
    pollEmbed.fields = [];
    pollEmbed.fields.push({
        name: " ",
        value: pollData.options.map((option, index) => numberEmojis[index] + " " + option + ": " +
            entries.filter(entry => entry.vote === index + 1).length).join("\n")
    });
    pollEmbed.fields.push({
        name: " ",
        value: "Votes: " + entries.length
    });
    pollEmbed.footer = ({ text: "Deadline: " + moment(pollData.date).format(DAY_MONTH_YEAR_24) + "\nID: " + pollData.pollId});

    msg.edit({ embeds: [pollEmbed] });
}

export const postPollResults = async (client) => {
    const query = {
        date: {
            $lte: moment.utc()
        }
    };

    const activePolls = await getPollsByQuery(query)
    .catch(err => {
        console.error(FETCH_ERR, err);
    });

    if (activePolls.length > 0) {
        for (const pollData of activePolls) {
            const { pollId, msgId, author, topic, date, repeat, channelId, options, votes } = pollData;
            const channelToSend = await client.channels.cache.get(channelId);

            if (!channelToSend) {
                console.log(NO_CHANNEL + pollId);
                continue;
            }

            if (canSendMessageToChannel(channelToSend)) {
                const entries = options.map((option, index) => ({
                    option: "**" + option + ": " + votes.entries.filter(entry => entry.vote === index + 1).length + "**",
                    voters: votes.entries
                        .filter(entry => entry.vote === index + 1)
                        .map(entry => entry.name)
                        .join(", ")
                }))
                .sort((a, b) => b.voters.length - a.voters.length);
                
                const authorData = await bot.guild.members.fetch(author);

                pollEmbed.author = {
                    name: authorData.nickname ? authorData.nickname : authorData.user.username,
                    icon_url: authorData.user.avatarURL()
                },
                pollEmbed.title = barChartEmoji + " Poll Results " + barChartEmoji;
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

                await channelToSend.send({ embeds: [pollEmbed] });
                console.log("Poll results posted", JSON.stringify(pollData));

                if (repeat !== NEVER) {
                    let newDate;

                    if (repeat === DAILY) {
                        newDate = moment(date).add(1, "d");
                    } else if (repeat === WEEKLY) {
                        newDate = moment(date). add(1, "w");
                    } else if (repeat === MONTHLY) {
                        newDate = moment(date). add(1, "M");
                    } else if (repeat === YEARLY) {
                        newDate = moment(date). add(1, "y");
                    }

                    try {
                        const pollMsg = await channelToSend.messages.fetch(msgId);
                        pollMsg.delete();
                    } catch (err) {
                        console.error(MSG_DELETION_ERR, err);
                    }

                    const newPollMsg = await createPollMsg(pollId, author, topic, newDate, channelId, options);
                    await updatePollData(pollId, newPollMsg.id, newDate);
                    options.forEach((_option, index) => {
                        newPollMsg.react(numberEmojis[index]);
                    });
                } else {
                    await deletePollById(pollId, author);
                }
            } else {
                console.log("Cannot send poll results of " + pollId + " to channel: " + channelId);
                continue;
            }
        }
    }
};

export const syncPollVotes = async (client) => {
    const activePolls = await getPolls();

    for (const pollData of activePolls) {
        const numbers = numberEmojis.slice(0, pollData.options.length);

        const channel = bot.guild.channels.cache.get(pollData.channelId);
        const authorData = await bot.guild.members.fetch(pollData.author);
    
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
            console.log(MSG_FETCH_ERR);
        }

        if (pollMsg) {
            const reactions = pollMsg.reactions.cache.filter(reaction => numbers.includes(reaction._emoji.name)).map(reaction => reaction);
            entries = await getEntries(client, reactions);

            await updatePollVotes(pollData, entries);
            await updatePollMsg(pollData, entries);
        } else {
            deletePollByMsg(pollData.msgId);
        }
    }
};

const getEntries = async (client, reactions) => {
    let entries = [];

    for (const reaction of reactions) {
        await reaction.users.fetch().then(users => {
            users.forEach(user => {
                getUserData(user.id).then(userData => {
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