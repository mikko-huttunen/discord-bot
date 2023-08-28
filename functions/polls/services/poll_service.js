import { INSERT_SUCCESS, DELETE_ERR, INSERT_FAILURE, MSG_DELETION_ERR, NEVER, UPDATE_ERR, ERROR_REPLY } from "../../../variables/constants.js";
import { poll } from "../../../database/schemas/poll_schema.js";

export const createPoll = (interaction, pollId, msgId, author, topic, date, repeat, channelId, options) => {
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
        console.log(INSERT_SUCCESS, JSON.stringify(response));
        interaction.reply({ content: "Successfully created new poll!", ephemeral: true });
    })
    .catch(err => {
        console.error(INSERT_FAILURE, err);
        interaction.reply({ content: ERROR_REPLY, ephemeral: true });
        return;
    });
};

export const getPolls = async () => {
    return poll.find().lean();
};

export const getPollsByUser = async (user) => {
    return poll.find({ author: user.id }).lean();
};

export const getPollByMsg = async (msg) => {
    return poll.findOne({ msgId: msg.id }).lean();
};

export const getPollsByQuery = async (query) => {
    return poll.find(query).lean();
};

export const updatePollData = async (pollId, msgId, newDate) => {
    poll.findOneAndUpdate(
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
        console.error(UPDATE_ERR, err);
    });
};

export const updatePollVotes = async (pollData, entries) => {
    poll.findOneAndUpdate(
        { pollId: pollData.pollId },
        { 
            "votes.number": entries.length,
            "votes.entries": entries
        }
    )
    .then(console.log("Poll " + pollData.pollId + " votes updated"))
    .catch(err => {
        console.log(UPDATE_ERR, err);
    });
};

export const deletePollById = async (pollId, author, interaction) => {
    poll.findOneAndDelete({ 
        pollId,
        author
    }).then(async (response) => {
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

            console.log("Poll " + pollId + " deleted");
            interaction?.reply({ content: "Successfully deleted poll!", ephemeral: true });
        } else {
            interaction?.reply({ content: "Cannot delete poll **" + pollId + "**, or given ID is wrong!", ephemeral: true });
        }
    }).catch(err => {
        console.error(DELETE_ERR, err);
        interaction?.reply({ content: ERROR_REPLY, ephemeral: true });
    });
};

export const deletePollByMsg = async (msgId) => {
    poll.findOneAndDelete({ 
        msgId,
        repeat: NEVER
    }).then(response => {
        if (response) {
            console.log("Poll " + response.pollId + " deleted");
        }
    }).catch(err => {
        console.error(DELETE_ERR, err);
    });
};