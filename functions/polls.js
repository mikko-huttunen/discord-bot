import moment from "moment";
import _ from "lodash";
import { canSendMessageToChannel, isValidDateAndRepetition } from "./helpers/checks.js";
import { generateId, getChannelName, getMemberData, getNumberEmojis, getUnicodeEmoji } from "./helpers/helpers.js";
import { CHANNEL, DAILY, DATE, DAY_MONTH_YEAR_24, DELETE_ERR, DELETE_SUCCESS, ERROR_REPLY, ID, INSERT_FAILURE, INSERT_SUCCESS, ISO_8601_24, MAX_POLLS, MONTHLY, MSG_DELETION_ERR, MSG_FETCH_ERR, NEVER, NO_CHANNEL, NO_RECORDS, REPEAT, SEND_PERMISSION_ERR, TOPIC, WEEKLY, YEARLY } from "../variables/constants.js";
import { deleteDocument, getDocuments, insertDocument, updateDocument } from "../database/database_service.js";
import { poll } from "../database/schemas/poll_schema.js";

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
            const guild = interaction.guild;
            const channel = interaction.options.getChannel(CHANNEL);
            const options = interaction.options._hoistedOptions
                .filter(option => option.name.includes("option"))
                .map(option => option.value);

            if (!await canCreateNewPoll(author, guild.id)) {
                interaction.reply({ content: MAX_POLLS, ephemeral: true });
                break;
            }

            if (!await canSendMessageToChannel(guild, channel)) {
                interaction.reply({ content: SEND_PERMISSION_ERR + getChannelName(channel.id), ephemeral: true });
                break;
            }

            if (!isValidDateAndRepetition(interaction, dateTime, repeat)) return;

            createNewPoll(interaction, author, topic, dateTime, repeat, guild, channel.id, options);
            break;
        }

        case "deletepoll": {
            const id = interaction.options.getString(ID);
            const author = interaction.user.id;

            const query = {
                pollId: id,
                author
            };

            deleteDocument(poll, query).then(async (response) => {
                if (response) {
                    const guild = interaction.guild;
                    const channel = guild.channels.cache.get(response.channelId);
                    const msgId = response.msgId;

                    try {
                        const pollMsg = await channel.messages.fetch(msgId);
                        pollMsg.delete();
                    } catch (error) {
                        console.error(MSG_DELETION_ERR, error);
                    }

                    console.log(DELETE_SUCCESS, JSON.stringify(response));
                    interaction.reply({
                        content: "Poll deleted successfully! " + getUnicodeEmoji("1F44D"),
                        ephemeral: true 
                    });
                } else {
                    interaction.reply({
                        content: "Cannot delete poll **" + id + "**, or given ID is wrong!",
                        ephemeral: true
                    });
                }
            }).catch(err => {
                console.error(DELETE_ERR, err);
                interaction?.reply({ content: ERROR_REPLY, ephemeral: true });
            });
            break;
        }

        case "listpolls": {
            pollEmbed.author = {};
            pollEmbed.title = barChartEmoji + " Polls " + barChartEmoji;
            pollEmbed.fields = [];
            pollEmbed.footer = {};

            const query = {
                guildId: interaction.guild.id
            };

            getDocuments(poll, query).then(polls => {
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
                    interaction.reply({ content: NO_RECORDS, ephemeral: true });
                }
            });

            break;
        }

        default: {
            break;
        }
    }
}

const canCreateNewPoll = async (author, guildId) => {
    const query = {
        author,
        guildId
    };

    return getDocuments(poll, query).then(polls => {
        if (polls.length >= 5) {
            return false;
        }

        return true;
    });
};

const createPollMsg = async (pollId, author, topic, dateTime, guild, channelId, options) => {
    const authorData = await guild.members.fetch(author);
    
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

    const channel = guild.channels.cache.get(channelId);
    const pollMsg = await channel.send({ embeds: [pollEmbed] });

    return pollMsg;
}

export const createNewPoll = async (interaction, author, topic, dateTime, repeat, guild, channelId, options) => {
    const pollId = generateId();
    const pollMsg = await createPollMsg(pollId, author, topic, dateTime, guild, channelId, options);
    const pollData = {
        pollId,
        msgId: pollMsg.id,
        author,
        topic,
        date: dateTime,
        repeat,
        guildId: guild.id,
        channelId,
        options,
        votes: 0
    };

    insertDocument(poll, pollData).then(response => {
        console.log(INSERT_SUCCESS, JSON.stringify(response));
        interaction.reply({
            content: "New poll created successfully! " + getUnicodeEmoji("1F44D"),
            ephemeral: true
        });
    }).catch(err => {
        console.error(INSERT_FAILURE, err);
        interaction.reply({ content: ERROR_REPLY, ephemeral: true });
        return;
    });

    options.forEach((_option, index) => {
        pollMsg.react(numberEmojis[index]);
    });
};

//TODO: Change to create new vote document
export const handlePollReaction = async (reaction, user) => {
    const query = {
        msgId: reaction.message.id
    };

    const pollData = await getDocuments(poll, query);
    const vote = numberEmojis.indexOf(reaction._emoji.name) + 1;

    if (pollData) {
        //Check if number emoji is a valid vote
        if (vote > pollData.options.length) return;

        let entries = pollData.votes.entries.map(entry => ({
            id: entry.id,
            name: entry.name,
            vote: entry.vote
        }));

        const entry = {
            id: user.user.id,
            name: user.nickname ? user.nickname : user.user.username,
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

        const filter = { pollId: pollData.pollId };
        const update = { votes: entries.length };
        
        //TODO: Delete votes from collection
        await updateDocument(poll, filter, update);
        await updatePollMsg(pollData, entries, user.guild);
    }

    return;
};

const updatePollMsg = async (pollData, entries, guild) => {
    const channel = guild.channels.cache.get(pollData.channelId);
    const msg = await channel.messages.fetch(pollData.msgId);
    const authorData = await guild.members.fetch(pollData.author);
    
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
    const findQuery = {
        date: {
            $lte: moment.utc()
        }
    };
    const activePolls = await getDocuments(poll, findQuery);

    if (activePolls.length > 0) {
        for (const pollData of activePolls) {
            const { pollId, msgId, author, topic, date, repeat, guildId, channelId, options, votes } = pollData;
            const guild = await client.guilds.cache.get(guildId);
            const channelToSend = await guild.channels.cache.get(channelId);

            if (!channelToSend) {
                console.log(NO_CHANNEL + pollId);
                continue;
            }

            if (canSendMessageToChannel(guild, channelToSend)) {
                const entries = options.map((option, index) => ({
                    option: "**" + option + ": " + votes.entries.filter(entry => entry.vote === index + 1).length + "**",
                    voters: votes.entries
                        .filter(entry => entry.vote === index + 1)
                        .map(entry => entry.name)
                        .join(", ")
                }))
                .sort((a, b) => b.voters.length - a.voters.length);
                
                const authorData = await guild.members.fetch(author);

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
                    const update = {
                        msgId: newPollMsg.id,
                        date: newDate,
                        votes: 0  
                    };

                    updateDocument(poll, pollId, update);
                    //TODO: Delete votes from collection

                    options.forEach((_option, index) => {
                        newPollMsg.react(numberEmojis[index]);
                    });
                } else {
                    const deleteQuery = {
                        pollId,
                        author
                    };

                    deleteDocument(poll, deleteQuery).then(async (response) => {
                        try {
                            const pollMsg = await channelToSend.messages.fetch(msgId);
                            pollMsg.delete();
                            console.log(DELETE_SUCCESS, JSON.stringify(response));
                        } catch (err) {
                            console.error(MSG_DELETION_ERR, err);
                        }
                    }).catch(err => {
                        console.error(DELETE_ERR, err);
                    });
                }
            } else {
                console.log("Cannot send poll results of " + pollId + " to channel: " + channelId);
                continue;
            }
        }
    }
};

export const syncPollVotes = async (client) => {
    const activePolls = await getDocuments(poll);

    for (const pollData of activePolls) {
        const numbers = numberEmojis.slice(0, pollData.options.length);

        const guild = client.guilds.cache.get(pollData.guildId);
        const channel = guild.channels.cache.get(pollData.channelId);
        const authorData = await guild.members.fetch(pollData.author);
    
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
            entries = await getEntries(client, reactions, guild);

            const filter = {
                pollId: pollData.id
            };
            const update = {
                votes: entries.length
            };

            updateDocument(poll, filter, update);
            await updatePollMsg(pollData, entries);
        } else {
            const query = {
                msgId: pollData.msgId,
                repeat: NEVER
            };

            deleteDocument(poll, query)
            .then(response => console.log(DELETE_SUCCESS, JSON.stringify(response)))
            .catch(err => console.error(DELETE_ERR, err));
        }
    }
};

const getEntries = async (client, reactions, guild) => {
    let entries = [];

    for (const reaction of reactions) {
        await reaction.users.fetch().then(users => {
            users.forEach(user => {
                getMemberData(user.id, guild).then(userData => {
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