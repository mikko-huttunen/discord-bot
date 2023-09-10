import moment from "moment";
import { canSendMessageToChannel, isValidDateAndRepetition } from "./helpers/checks.js";
import { generateId, getChannelName, getMemberData, getNumberEmojis, getUnicodeEmoji } from "./helpers/helpers.js";
import { CHANNEL, DAILY, DATE, DAY_MONTH_YEAR_24, DELETE_ERR, DELETE_SUCCESS, EMPTY, ERROR_REPLY, ID, ISO_8601_24, MAX_POLLS, MONTHLY, MSG_DELETION_ERR, MSG_FETCH_ERR, NEVER, NO_CHANNEL, NO_RECORDS, REPEAT, SEND_PERMISSION_ERR, TOPIC, WEEKLY, YEARLY } from "../variables/constants.js";
import { bulkTransaction, deleteDocuments, findOneDocument, getDocuments, insertDocuments, updateDocument } from "../database/database_service.js";
import { poll } from "../database/schemas/poll_schema.js";
import { vote } from "../database/schemas/vote_schema.js";

const numberEmojis = getNumberEmojis();
const barChartEmoji = getUnicodeEmoji("1F4CA");

export const createPoll = async (interaction) => {
    const userDateTime = interaction.options.getString(DATE);
    const userRepeat = interaction.options.getString(REPEAT).toLowerCase();
    const guild = interaction.guild;
    const channel = interaction.options.getChannel(CHANNEL);

    if (!await canCreateNewPoll(interaction.user.id, guild.id)) {
        interaction.reply({ content: MAX_POLLS, ephemeral: true });
        return;
    }

    if (!await canSendMessageToChannel(guild, channel)) {
        interaction.reply({ content: SEND_PERMISSION_ERR + getChannelName(channel.id), ephemeral: true });
        return;
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

    const pollMsg = await createPollMessage(pollData, guild);
    pollData.msgId = pollMsg.id;
    const inserted = await insertDocuments(poll, pollData);
    
    if (inserted) {
        interaction.reply({
            content: "New poll created successfully! " + getUnicodeEmoji("1F44D"),
            ephemeral: true
        });
    } else {
        try {
            pollMsg.delete();
        } catch (error) {
            console.error(MSG_DELETION_ERR, error);
        }

        interaction.reply({ content: ERROR_REPLY, ephemeral: true });
        return;
    }

    pollData.options.forEach((_option, index) => {
        pollMsg.react(numberEmojis[index]);
    });
};

export const listPolls = async (interaction) => {
    const query = {
        guildId: interaction.guild.id
    };
    const pollsData = await getDocuments(poll, query);
    
    if (pollsData.length == 0) {
        interaction.reply({ content: NO_RECORDS, ephemeral: true });
        return;
    }

    const pollsSorted = pollsData.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

    const polls = await Promise.all(pollsSorted.map(async p => {
        const author = await getMemberData(p.author, interaction.guild);
        return ({
            name: `ID: ${p.pollId}`,
            value: `Author: ${author.nickname ? author.nickname : author.user.username}` +
                `\nTopic: ${p.topic}` +
                `\nDeadline: ${moment(p.dateTime).format(DAY_MONTH_YEAR_24)}` +
                `\nChannel: ${getChannelName(p.channelId)}`
        });
    }));

    const pollEmbed = {
        title: barChartEmoji + " Polls",
        fields: polls
    };

    interaction.reply({ embeds: [pollEmbed], ephemeral: true }); 
};

export const deletePoll = async (interaction) => {
    const pollId = interaction.options.getString(ID);
    const author = interaction.user.id;
    const query = {
        pollId,
        author
    };
    const deleted = await deleteDocuments(poll, query);

    if (!deleted) {
        interaction.reply({
            content: "Cannot delete poll **" + pollId + "**, or given ID is wrong!",
            ephemeral: true
        });
        return;
    }

    const guild = interaction.guild;
    const channel = guild.channels.cache.get(deleted.channelId);
    const msgId = deleted.msgId;

    try {
        const pollMsg = await channel.messages.fetch(msgId);
        pollMsg.delete();
    } catch (error) {
        console.error(MSG_DELETION_ERR, error);
    }

    await deleteDocuments(vote, { pollId: deleted.pollId });

    interaction.reply({
        content: "Poll deleted successfully! " + getUnicodeEmoji("1F44D"),
        ephemeral: true 
    });
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

const createPollMessage = async (pollData, guild, pollVotes) => {
    const author = await getMemberData(pollData.author, guild);
    
    const pollOption = (index, option) => {
        return `${numberEmojis[index]} ${option}`;
    };

    const numberOfVotes = (index) => {
        if (!pollVotes) return 0;
        return pollVotes.filter(v => v.vote === index + 1).length;
    };

    const voters = (index) => {
        if (!pollVotes) return EMPTY;
        return pollVotes.map(v => {
            if (v.vote === index + 1) return v.name
        }).filter(v => v).join(", ");
    }

    const voteData = pollData.options.map((option, index) => ({
        name: `${pollOption(index, option)}: ${numberOfVotes(index)}`,
        value: voters(index),
        inline: true
    }));

    const totalVotes = {
        name: EMPTY,
        value: `Votes: ${pollVotes ? pollVotes.length : 0}`
    };

    console.log(voteData);
    console.log(totalVotes);

    const pollEmbed = {
        color: 0x32cd32,
        author: {
            name: author.nickname ? author.nickname : author.user.username,
            icon_url: author.user.avatarURL()
        },
        title: `${barChartEmoji} ${pollData.topic}`,
        fields: [...voteData, totalVotes],
        footer: {
            text: "Deadline: " + moment(pollData.dateTime).format(DAY_MONTH_YEAR_24) + "\nID: " + pollData.pollId
        }
    };

    const channel = guild.channels.cache.get(pollData.channelId);
    let pollMsg;
    if (pollData.msgId) pollMsg = await channel.messages.fetch(pollData.msgId);

    console.log(pollMsg);

    if (!pollMsg) pollMsg = await channel.send({ embeds: [pollEmbed] });
    else await pollMsg.edit({ embeds: [pollEmbed] });

    return pollMsg;
};

export const handlePollReaction = async (reaction, user, action) => {
    const pollData = await findOneDocument(poll, { msgId: reaction.message.id });
    if (!pollData) return;

    const userVote = numberEmojis.indexOf(reaction.emoji.name) + 1;
    //Check if number emoji is a valid voting number
    if (userVote > pollData.options.length) return;

    const filter = {
        pollId: pollData.pollId,
        userId: user.id,
        vote: userVote
    };

    const voteData = {
        guildId: reaction.message.guildId,
        pollId: pollData.pollId,
        userId: user.id,
        name: user.nickname ? user.nickname : user.user.username,
        vote: userVote
    };

    if (action === "add") {
        await updateDocument(vote, filter, voteData);
    } else if (action === "remove") {
        await deleteDocuments(vote, filter);
    }

    const pollVotes = await getDocuments(vote, { pollId: pollData.pollId });

    createPollMessage(pollData, reaction.message.guild, pollVotes);
}

// export const handlePollReaction = async (reaction) => {
//     const pollVotes = new Map();
//     const pollData = await getDocument(poll, { msgId: reaction.message.id });

//     if (!pollData) return;

//     const reactions = reaction.message.reactions.cache.filter(r => numberEmojis.includes(r.emoji.name));

//     for (let i = 0; i < pollData.options.length; i++) {
//         const voteNumber = numberEmojis.indexOf(reactions.get(numberEmojis[i]).emoji.name) + 1;
//         //Check if number emoji is a valid voting number
//         if (voteNumber > pollData.options.length) return;

//         let users = await reactions.get(numberEmojis[i]).users.fetch();
//         console.log(users);
//         // users = await Promise.all(users.map(async (user) => {
//         //     if (!user.bot) return await getMemberData(user.id, reaction.message.guild);
//         // }));
//         const filteredUsers = users.filter(user => !user.bot);

//         if (filteredUsers.size > 0) pollVotes.set(i, filteredUsers);
//     }

//     console.log(pollVotes);

//     updatePollMsg(pollData, pollVotes, reaction.message.guild);
// };

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

                    pollData.dateTime = moment(newDate, DAY_MONTH_YEAR_24).format(ISO_8601_24);

                    const newPollMsg = await createPollMessage(pollData, guild);
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

                    await deleteDocuments(poll, deleteQuery).then(async (response) => {
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

                    await deleteDocuments(vote, { pollId: pollId });
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
        const validVoteNumbers = numberEmojis.slice(0, pollData.options.length);
        const guild = client.guilds.cache.get(pollData.guildId);
        const channel = guild.channels.cache.get(pollData.channelId);
        let pollMsg;

        try {
            pollMsg = await channel.messages.fetch(pollData.msgId);
        } catch {
            console.log(MSG_FETCH_ERR);
        }

        if (!pollMsg) {
            const query = {
                msgId: pollData.msgId,
                repeat: NEVER
            };

            await deleteDocuments(poll, query).then(response =>
                console.log(DELETE_SUCCESS, JSON.stringify(response))
            ).catch(err => console.error(DELETE_ERR, err));

            await deleteDocuments(vote, { pollId: pollData.pollId }).then(response =>
                console.log(DELETE_SUCCESS, JSON.stringify(response))
            ).catch(err => console.error(DELETE_ERR, err));

            continue;
        }

        const reactions = pollMsg.reactions.cache.filter(reaction => 
            validVoteNumbers.includes(reaction.emoji.name)).map(reaction => reaction);
        const currentVotes = await getEntries(client, pollData.pollId, reactions, guild);
        const votesInDB = await getDocuments(vote, { pollId: pollData.pollId });

        // A comparer used to determine if two entries are equal.
        const isSameVote = (a, b) => a.userId === b.userId && a.vote === b.vote;

        // Get items that only occur in the left array,
        // using the compareFunction to determine equality.
        const onlyInLeft = (left, right, compareFunction) => 
            left.filter(leftValue =>
                !right.some(rightValue => 
                    compareFunction(leftValue, rightValue)
                )
            );

        const votesToInsert = onlyInLeft(currentVotes, votesInDB, isSameVote);
        const votesToDelete = onlyInLeft(votesInDB, currentVotes, isSameVote);

        if (votesToInsert.length > 0) await insertDocuments(vote, votesToInsert);
        if (votesToDelete.length > 0) {
            let transactions = [];
            votesToDelete.forEach(entry => transactions.push({
                deleteOne: {
                    filter: {
                        userId: entry.userId,
                        vote: entry.vote
                    }
                }
            }));

            await bulkTransaction(vote, transactions);
        }

        await createPollMessage(pollData, guild, currentVotes);
    }
};

const getEntries = async (client, pollId, reactions, guild) => {
    let entries = [];

    for (const reaction of reactions) {
        await reaction.users.fetch().then(users => {
            users.forEach(user => {
                getMemberData(user.id, guild).then(userData => {
                    if (user.id !== client.user.id) {
                        const entry = {
                            guildId: guild.id,
                            pollId,
                            userId: userData.user.id,
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