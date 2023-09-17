import moment from "moment";
import { canSendMessageToChannel, isValidDateAndRepetition } from "./helpers/checks.js";
import { canCreateNew, generateId, getChannelName, getMemberData, getNumberEmojis, getUnicodeEmoji } from "./helpers/helpers.js";
import { CHANNEL, DAILY, DATE, DAY_MONTH_YEAR_24, EMPTY, ERROR_REPLY, ID, ISO_8601_24, MAX_POLLS, MONTHLY, MSG_DELETION_ERR, MSG_FETCH_ERR, NEVER, NO_CHANNEL, NO_RECORDS, REPEAT, SEND_PERMISSION_ERR, TOPIC, WEEKLY, YEARLY } from "../variables/constants.js";
import { bulkTransaction, deleteDocument, deleteManyDocuments, findOneDocument, getDocuments, insertDocuments, updateDocument } from "../database/database_service.js";
import { poll } from "../database/schemas/poll_schema.js";
import { vote } from "../database/schemas/vote_schema.js";

const numberEmojis = getNumberEmojis();
const barChartEmoji = getUnicodeEmoji("1F4CA");

export const createPoll = async (interaction) => {
    const userDateTime = interaction.options.getString(DATE);
    const userRepeat = interaction.options.getString(REPEAT).toLowerCase();
    const guild = interaction.guild;
    const channel = interaction.options.getChannel(CHANNEL);

    if (!await canCreateNew(poll, interaction.user.id, guild.id)) {
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
        voteOptions: interaction.options._hoistedOptions
            .filter(option => option.name.includes("option"))
            .map(option => option.value)
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

    pollData.voteOptions.forEach((_option, index) => {
        pollMsg.react(numberEmojis[index]);
    });
};

export const listPolls = async (interaction) => {
    const query = {
        guildId: interaction.guild.id
    };
    const polls = await getDocuments(poll, query);
    
    if (polls === "error") {
        interaction.reply({ content: ERROR_REPLY, ephemeral: true });
        return;
    } else if (polls.length == 0) {
        interaction.reply({ content: NO_RECORDS, ephemeral: true });
        return;
    }

    const pollsSorted = polls.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

    const pollsData = await Promise.all(pollsSorted.map(async p => {
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
        color: 0x32cd32,
        title: `${barChartEmoji} Polls`,
        fields: pollsData
    };

    interaction.reply({ embeds: [pollEmbed], ephemeral: true }); 
};

export const deletePoll = async (interaction) => {
    const pollId = interaction.options.getString(ID);
    const author = interaction.user.id;
    const deleted = await deleteDocument(poll, { pollId, author });

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

    await deleteManyDocuments(vote, { pollId: deleted.pollId });

    interaction.reply({
        content: "Poll deleted successfully! " + getUnicodeEmoji("1F44D"),
        ephemeral: true 
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
    };

    const voteData = pollData.voteOptions.map((option, index) => ({
        name: `${pollOption(index, option)}: ${numberOfVotes(index)}`,
        value: voters(index),
        inline: true
    }));

    const totalVotes = {
        name: EMPTY,
        value: `Votes: ${pollVotes ? pollVotes.length : 0}`
    };

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
    if (!pollMsg) pollMsg = await channel.send({ embeds: [pollEmbed] });
    else await pollMsg.edit({ embeds: [pollEmbed] });

    return pollMsg;
};

export const handlePollReaction = async (reaction, user, action) => {
    const pollData = await findOneDocument(poll, { msgId: reaction.message.id });
    if (!pollData) return;

    const userVote = numberEmojis.indexOf(reaction.emoji.name) + 1;
    //Check if number emoji is a valid voting number
    if (userVote > pollData.voteOptions.length) return;

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
        await deleteDocument(vote, filter);
    }

    const pollVotes = await getDocuments(vote, { pollId: pollData.pollId });

    createPollMessage(pollData, reaction.message.guild, pollVotes);
};

export const postPollResults = async (client) => {
    const findQuery = {
        dateTime: {
            $lte: moment.utc()
        }
    };
    const activePolls = await getDocuments(poll, findQuery);

    if (activePolls.length == 0) return;
    
    for (const pollData of activePolls) {
        const { pollId, msgId, author, topic, dateTime, repeat, guildId, channelId, voteOptions } = pollData;
        const guild = await client.guilds.cache.get(guildId);
        const channel = await guild.channels.cache.get(channelId);

        if (!channel) {
            console.log(NO_CHANNEL + pollId);
            await deleteDocument(poll, { pollId });
            await deleteManyDocuments(vote, { pollId });
            continue;
        }

        if (!canSendMessageToChannel(guild, channel)) {
            console.log("Cannot send poll results of " + pollId + " to channel: " + channelId);
            await deleteDocument(poll, { pollId });
            await deleteManyDocuments(vote, { pollId });
            continue;
        }

        const votes = await getDocuments(vote, { pollId });
        let totalVotes = 0;
        
        const numberOfVotes = (index) => {
            if (!votes) return 0;
            const number = votes.filter(v => v.vote === index + 1).length;
            totalVotes += number;
            return number;
        };
    
        const voters = (index) => {
            if (!votes) return EMPTY;
            return votes.filter(v => v.vote === index + 1).map(v => v.name).join(", ");
        };

        const results = voteOptions.map((option, index) => ({
            option: `**${option}: ${numberOfVotes(index)}**`,
            voters: voters(index)
        })).sort((a, b) => b.voters.length - a.voters.length);

        const pollTopicAndVotes = {
            name: topic,
            value: results.map(v => v.voters ? `${v.option}\n${v.voters}` : v.option).join("\n")
        };

        const getTotalVotes = {
            name: `Votes: ${totalVotes}`,
            value: EMPTY
        };
        
        const authorData = await getMemberData(author, guild);
        const pollEmbed = {
            color: 0x32cd32,
            author: {
                name: authorData.nickname ? authorData.nickname : authorData.user.username,
                icon_url: authorData.user.avatarURL()
            },
            title: `${barChartEmoji} Poll Results`,
            fields: [pollTopicAndVotes, getTotalVotes]
        };

        await channel.send({ embeds: [pollEmbed] });
        console.log("Poll results posted", JSON.stringify(pollData));

        if (repeat === NEVER) {
            const deleteQuery = {
                pollId,
                author
            };

            await deleteDocument(poll, deleteQuery);
            await deleteManyDocuments(vote, { pollId: pollId });
                
            try {
                const pollMsg = await channel.messages.fetch(msgId);
                await pollMsg.delete();
            } catch (err) {
                console.error(MSG_DELETION_ERR, err);
            }

            continue;
        } else {
            //Poll is set to repeat so update it's data and reset votes
            let newDate;

            if (repeat === DAILY) {
                newDate = moment(dateTime).add(1, "d");
            } else if (repeat === WEEKLY) {
                newDate = moment(dateTime). add(1, "w");
            } else if (repeat === MONTHLY) {
                newDate = moment(dateTime). add(1, "M");
            } else if (repeat === YEARLY) {
                newDate = moment(dateTime). add(1, "y");
            }

            try {
                const pollMsg = await channel.messages.fetch(msgId);
                pollMsg.delete();
            } catch (err) {
                console.error(MSG_DELETION_ERR, err);
            }

            pollData.dateTime = newDate;
            pollData.msgId = null;

            await deleteManyDocuments(vote, { pollId });
            const newPollMsg = await createPollMessage(pollData, guild);
            const update = {
                msgId: newPollMsg.id,
                dateTime: newDate
            };

            await updateDocument(poll, { pollId }, update);

            voteOptions.forEach((_option, index) => {
                newPollMsg.react(numberEmojis[index]);
            });
        }
    }
};

export const syncPollVotes = async (client) => {
    const activePolls = await getDocuments(poll);

    for (const pollData of activePolls) {
        const validVoteNumbers = numberEmojis.slice(0, pollData.voteOptions.length);
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
                pollId: pollData.pollId,
                repeat: NEVER
            };

            await deleteDocument(poll, query);
            await deleteManyDocuments(vote, { pollId: pollData.pollId });

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