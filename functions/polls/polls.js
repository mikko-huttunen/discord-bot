import { PermissionsBitField } from "discord.js";
import moment from "moment";
import _ from "lodash";
import { canSendMessageToChannel, isValidDateAndRepetition } from "../helpers/checks.js";
import { createPoll, deletePollById, deletePollByMsg, getPollByMsg, getPolls, getPollsByQuery, getPollsByUser, updatePollData, updatePollVotes } from "./data/services/poll_service.js";
import { getNumberEmotes } from "../helpers/emotes.js";
import { bot } from "../../bot/bot.js";
import { getUserData } from "../helpers/helpers.js";

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

            deletePollById(interaction, id, author);
            break;
        }

        case "listpolls": {
            pollEmbed.author = {};
            pollEmbed.title = "📊 Polls 📊";
            pollEmbed.fields = [];
            pollEmbed.footer = {};

            getPolls(interaction).then(polls => {
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

const canCreateNewPoll = async (interaction) => {
    return getPollsByUser(interaction).then(polls => {
        if (polls.length >= 5) {
            return false;
        }

        return true;
    });
};

const createPollMsg = async (pollId, author, topic, dateTime, channelId, options) => {
    const numbers = getNumberEmotes();
    const authorData = await bot.guild.members.fetch(author);
    
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

    const channel = bot.guild.channels.cache.get(channelId);
    const pollMsg = await channel.send({ embeds: [pollEmbed] });

    return pollMsg;
}

export const createNewPoll = async (interaction, pollId, author, topic, dateTime, repeat, channelId, options) => {
    const numbers = getNumberEmotes();
    const pollMsg = await createPollMsg(pollId, author, topic, dateTime, channelId, options);

    await createPoll(interaction, pollId, pollMsg.id, author, topic, dateTime, repeat, channelId, options);

    options.forEach((_option, index) => {
        pollMsg.react(numbers[index]);
    });
};

export const handlePollReaction = async (reaction, user) => {
    const activePolls = await getPollByMsg(reaction.message);
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

const updatePollMsg = async (pollData, entries) => {
    const channel = bot.guild.channels.cache.get(pollData.channelId);
    const msg = await channel.messages.fetch(pollData.msgId);
    const numbers = getNumberEmotes();
    
    if (!Object.prototype.hasOwnProperty.call(pollEmbed, "author")) {
        const authorData = await bot.guild.members.fetch(pollEmbed.author);

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

    await getPollsByQuery(query).then(async (response) => {
        if (response?.length > 0) {
            console.log("Poll results posted: " + response);
            await syncPollVotes(client);

            response.forEach(async (pollData) => {
                const { pollId, msgId, author, topic, date, repeat, channelId, options, votes } = pollData;
                const guild = bot.guild;
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
                    
                    const authorData = await bot.guild.members.fetch(author);

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
                        await deletePollById(pollId, author);
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

    if (activePolls?.length > 0) {
        for (const pollData of activePolls) {
            const numberEmojis = getNumberEmotes().slice(0, pollData.options.length);

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
                console.log("Could not fetch poll message!");
            }

            if (pollMsg) {
                const reactions = pollMsg.reactions.cache.filter(reaction => numberEmojis.includes(reaction._emoji.name)).map(reaction => reaction);
                entries = await getEntries(client, reactions);

                await updatePollVotes(pollData, entries);
                await updatePollMsg(pollData, entries);
            } else {
                deletePollByMsg(pollData.msgId);
            }
        }
    }
};

const getEntries = async (client, reactions) => {
    let entries = [];
    const numberEmojis = getNumberEmotes();

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