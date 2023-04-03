import { bot } from "../../../../bot/bot.js";
import { poll } from "../models/poll_schema.js";

export const createPoll = async (interaction, pollId, msgId, author, topic, date, repeat, channelId, options) => {
    const pollData = {
        pollId,
        msgId,
        author,
        topic,
        date,
        repeat,
        channelId,
        options,
        votes: {
            number: 0,
            entries: []
        }
    };

    new poll(pollData)
    .save()
    .then(response => {
        console.log("New poll created:");
        console.log(response);
        interaction.reply({ content: "New poll created successfully!", ephemeral: true });
    })
    .catch(err => {
        console.error(err);
        interaction.reply({ content: "Something went wrong! :(", ephemeral: true });
        return;
    });
};

export const getPolls = async () => {
    return await poll.find(
        {},
        {}
    )
    .lean()
    // .then(response => {
    //     if (response.length > 0) {
    //         console.log("Fetched all polls:");
    //         console.log(response);
    //     }
    // })
    // .catch(err => {
    //     console.error(err);
    //     interaction?.reply({ content: "Something went wrong! :(", ephemeral: true });
    // });
};

export const getPollsByUser = async (interaction) => {
    return await poll.find(
        { author: interaction.user.id },
        {}
    )
    .lean()
    // .then(response => {
    //     console.log("Fetched polls of user " + interaction.user.id + ":");
    //     console.log(response);
    // })
    // .catch(err => {
    //     console.error(err);
    //     interaction.reply({ content: "Something went wrong! :(", ephemeral: true });
    // });
};

export const getPollByMsg = async (msg) => {
    return await poll.findOne(
        { msgId: msg.id },
        {}
    )
    .lean()
    // .then(response => {
    //     console.log("Fetched polls by msg " + msg.id + ":");
    //     console.log(response);
    // })
    // .catch(err => {
    //     console.error(err);
    // });
};

export const getPollsByQuery = async (query) => {
    return poll.find(
        { query },
        {}
    )
    .lean()
    // .then(response => {
    //     if (response.length > 0) {
    //         console.log("Fetched polls by query " + JSON.stringify(query) + ":");
    //         console.log(response);
    //     }
    // })
    // .catch(err => {
    //     console.error(err);
    // });
};

export const updatePollData = async (pollId, msgId, newDate) => {
    await poll.findOneAndUpdate(
        { pollId },
        {
            msgId,
            date: newDate,
            "votes.number": 0,
            "votes.entries": [] 
        },
        { returnDocument: "after" }
    )
    .then(console.log("Poll " + pollId + " updated!"))
    .catch(err => {
        console.error(err);
    });
};

export const updatePollVotes = async (pollData, entries) => {
    poll.findOneAndUpdate(
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
};

export const deletePollById = async (pollId, author, interaction) => {
    let channel;
    let msgId;

    await poll.findOneAndDelete({ 
        pollId,
        author
    })
    .then(response => {
        if (response) {
            channel = bot.guild.channels.cache.get(response.channelId);
            msgId = response.msgId;
            console.log("Poll " + response.eventId + " deleted:");
            console.log(response);
            interaction?.reply({ content: "Poll deleted successfully!", ephemeral: true });
        } else {
            interaction?.reply({ content: "Et voi poistaa kyselyä **" + pollId + "**, tai antamasi id on väärä!", ephemeral: true });
        }
    }).catch(err => {
        console.error(err);
        interaction?.reply({ content: "Something went wrong! :(", ephemeral: true });
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
            console.log("Poll " + response.pollId + " deleted:");
            console.log(response);
        }
    }).catch(err => {
        console.error(err);
    });
};