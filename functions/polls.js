import moment from "moment";
import { canSendMessageToChannel, isValidDateAndRepetition } from "./helpers/checks.js";
import { generateId, getChannelName, getMemberData, getNumberEmojis, getUnicodeEmoji } from "./helpers/helpers.js";
import { CHANNEL, DAILY, DATE, DAY_MONTH_YEAR_24, DELETE_ERR, DELETE_SUCCESS, EMPTY, ERROR_REPLY, ID, INSERT_FAILURE, INSERT_SUCCESS, ISO_8601_24, MAX_POLLS, MONTHLY, MSG_DELETION_ERR, MSG_FETCH_ERR, NEVER, NO_CHANNEL, NO_RECORDS, REPEAT, SEND_PERMISSION_ERR, TOPIC, WEEKLY, YEARLY } from "../variables/constants.js";
import { deleteDocument, getDocument, getDocuments, insertDocument, updateDocument } from "../database/database_service.js";
import { poll } from "../database/schemas/poll_schema.js";
import { vote } from "../database/schemas/vote_schema.js";

const numberEmojis = getNumberEmojis();
const barChartEmoji = getUnicodeEmoji("1F4CA");

export const handlePoll = async (interaction) => {
    switch(interaction.commandName) {
        case "poll": {
            const userDateTime = interaction.options.getString(DATE);
            const userRepeat = interaction.options.getString(REPEAT).toLowerCase();
            const guild = interaction.guild;
            const channel = interaction.options.getChannel(CHANNEL);

            if (!await canCreateNewPoll(interaction.user.id, guild.id)) {
                interaction.reply({ content: MAX_POLLS, ephemeral: true });
                break;
            }

            if (!await canSendMessageToChannel(guild, channel)) {
                interaction.reply({ content: SEND_PERMISSION_ERR + getChannelName(channel.id), ephemeral: true });
                break;
            }

            const pollData = {
                pollId: generateId(),
                author: interaction.user.id,
                topic: interaction.options.getString(TOPIC),
                dateTime: moment(userDateTime, DAY_MONTH_YEAR_24).format(ISO_8601_24),
                repeat: userRepeat,
                guildId: guild.id,
                channelId: channel.id,
                options: interaction.options._hoistedOptions
                    .filter(option => option.name.includes("option"))
                    .map(option => option.value),
                votes: 0
            };

            if (!isValidDateAndRepetition(interaction, pollData.dateTime, userRepeat)) return;

            createNewPoll(interaction, pollData, guild);
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
            const pollEmbed = {
                title: barChartEmoji + " Polls " + barChartEmoji,
                fields: []
            };
            const query = {
                guildId: interaction.guild.id
            };
            const polls = await getDocuments(poll, query);
            
            if (polls.length <= 0) {
                interaction.reply({ content: NO_RECORDS, ephemeral: true });
                break;
            }

            const pollsSorted = polls.sort((a, b) => a.date.getTime() - b.date.getTime());

            pollsSorted.forEach(p => pollEmbed.fields.push({
                name: "ID: " + p.pollId,
                value: "Topic: " + p.topic +
                    "\nDeadline: " + moment(p.date).format(DAY_MONTH_YEAR_24) +
                    "\nChannel: " + getChannelName(p.channelId) +
                    "\nVotes: " + p.votes.number
            }));

            interaction.reply({ embeds: [pollEmbed], ephemeral: true }); 
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

const createPollMsg = async (pollData, guild) => {
    const authorData = await guild.members.fetch(pollData.author);

    const pollEmbed = {
        color: 0x32cd32,
        author: {
            name: authorData.nickname ? authorData.nickname : authorData.user.username,
            icon_url: authorData.user.avatarURL()
        },
        title: `${barChartEmoji} ${pollData.topic} ${barChartEmoji}`,
        fields: [{
            name: EMPTY,
            value: pollData.options.map((option, index) => numberEmojis[index] + " " + option + ": 0").join("\n")
        }, {
            name: EMPTY,
            value: "Votes: " + 0
        }],
        footer: {
            text: "Deadline: " + moment(pollData.dateTime).format(DAY_MONTH_YEAR_24) + "\nID: " + pollData.pollId
        }
    };

    const channel = guild.channels.cache.get(pollData.channelId);
    const pollMsg = await channel.send({ embeds: [pollEmbed] });

    return pollMsg;
}

export const createNewPoll = async (interaction, pollData, guild) => {
    const pollMsg = await createPollMsg(pollData, guild);
    pollData.msgId = pollMsg.id;

    insertDocument(poll, pollData).then(response => {
        console.log(INSERT_SUCCESS, JSON.stringify(response));
        interaction.reply({
            content: "New poll created successfully! " + getUnicodeEmoji("1F44D"),
            ephemeral: true
        });
    }).catch(err => {
        console.error(INSERT_FAILURE, err);

        try {
            pollMsg.delete();
        } catch (error) {
            console.error(MSG_DELETION_ERR, error);
        }

        interaction.reply({ content: ERROR_REPLY, ephemeral: true });
        return;
    });

    pollData.options.forEach((_option, index) => {
        pollMsg.react(numberEmojis[index]);
    });
};

//TODO: Change to create new vote document
export const handlePollReaction = async (reaction, user) => {
    const pollQuery = {
        msgId: reaction.message.id
    };
    const pollData = await getDocument(poll, pollQuery);

    if (!pollData) return;

    const voteNumber = numberEmojis.indexOf(reaction._emoji.name) + 1;
    console.log(voteNumber);
    console.log(pollData);

    //Check if number emoji is a valid vote
    if (voteNumber > pollData.options.length) return;

    const voteData = {
        guildId: reaction.message.guildId,
        pollId: pollData.pollId,
        userId: user.user.id,
        name: user.nickname ? user.nickname : user.user.username,
        vote: voteNumber
    };

    let votes = await getDocuments(vote, { pollId: pollData.pollId });
    const isExistingVote = votes.some(v => v.userId === user.user.id && v.vote === voteNumber);

    let pollUpdate;

    if (isExistingVote) {
        const deleteQuery = {
            pollId: pollData.id,
            userId: user.user.id,
            vote: voteNumber
        };

        await deleteDocument(vote, deleteQuery);
        pollUpdate = { $inc : {"votes" : -1} };
    } else if (!isExistingVote) {
        await insertDocument(vote, voteData);
        votes.push(voteData);
        pollUpdate = { $inc : {"votes" : 1} };
    }

    await updateDocument(poll, pollQuery, pollUpdate);
    await updatePollMsg(pollData, votes, user.guild);
};

const updatePollMsg = async (pollData, pollVotes, guild) => {
    const channel = guild.channels.cache.get(pollData.channelId);
    const msg = await channel.messages.fetch(pollData.msgId);
    const authorData = await guild.members.fetch(pollData.author);
    
    const pollEmbed = {
        color: 0x32cd32,
        author: {
            name: authorData.nickname ? authorData.nickname : authorData.user.username,
            icon_url: authorData.user.avatarURL()
        },
        title: barChartEmoji + " " + pollData.topic + " " + barChartEmoji,
        fields: [],
        footer: { text: "Deadline: " + moment(pollData.date).format(DAY_MONTH_YEAR_24) + "\nID: " + pollData.pollId }
    };
    
    pollEmbed.fields.push({
        name: EMPTY,
        value: pollData.options.map((option, index) => numberEmojis[index] + EMPTY + option + ": " +
            pollVotes.filter(entry => entry.vote === index + 1).length).join("\n")
    });
    pollEmbed.fields.push({
        name: EMPTY,
        value: "Votes: " + pollVotes.length
    });

    msg.edit({ embeds: [pollEmbed] });
}

export const postPollResults = async (client) => {
    const findQuery = {
        dateTime: {
            $lte: moment.utc()
        }
    };
    const activePolls = await getDocuments(poll, findQuery);

    if (activePolls.length > 0) {
        for (const pollData of activePolls) {
            const { pollId, msgId, author, topic, date, repeat, guildId, channelId, options, votes } = pollData;
            const guild = await client.guilds.cache.get(guildId);
            const channel = await guild.channels.cache.get(channelId);

            if (!channel) {
                console.log(NO_CHANNEL + pollId);
                continue;
            }

            if (canSendMessageToChannel(guild, channel)) {
                const entries = options.map((option, index) => ({
                    option: "**" + option + ": " + votes.entries.filter(entry => entry.vote === index + 1).length + "**",
                    voters: votes.entries
                        .filter(entry => entry.vote === index + 1)
                        .map(entry => entry.name)
                        .join(", ")
                }))
                .sort((a, b) => b.voters.length - a.voters.length);
                
                const authorData = await guild.members.fetch(author);
                const pollEmbed = {
                    author: {
                        name: authorData.nickname ? authorData.nickname : authorData.user.username,
                        icon_url: authorData.user.avatarURL()
                    },
                    title: barChartEmoji + " Poll Results " + barChartEmoji,
                    fields: [],
                };

                pollEmbed.fields.push({
                    name: topic,
                    value: entries.map(entry => entry.voters.length ? (entry.option + "\n" + entry.voters) : entry.option).join("\n")
                });
                pollEmbed.fields.push({
                    name: "Votes: " + votes.number,
                    value: " "
                });

                await channel.send({ embeds: [pollEmbed] });
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
                        const pollMsg = await channel.messages.fetch(msgId);
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
                            const pollMsg = await channel.messages.fetch(msgId);
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
            await updatePollMsg(pollData, entries, guild);
        } else {
            const query = {
                msgId: pollData.msgId,
                repeat: NEVER
            };

            deleteDocument(poll, query).then(response =>
                console.log(DELETE_SUCCESS, JSON.stringify(response))
            ).catch(err => console.error(DELETE_ERR, err));
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