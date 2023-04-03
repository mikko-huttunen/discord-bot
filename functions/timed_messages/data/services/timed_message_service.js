import { timedMessage } from "../models/timed_message_schema.js";

export const createTimedMessage = async (interaction, author, message, date, repeat, channel) => {
    const id = Math.random().toString(16).slice(9);

    await new timedMessage({
        id,
        user: author,
        message,
        date,
        repeat,
        channelId: channel.id
    })
    .save()
    .then(response => {
        console.log("Timed message created: " + response);
        interaction.reply({ content: "New timed message created successfully!", ephemeral: true });
    })
    .catch(err => {
        console.error(err);
        interaction.reply({ content: "Jotain meni pieleen!", ephemeral: true });
    });
};

export const getTimedMessagesByUser = async (interaction) => {
    return await timedMessage.find(
        { author: interaction.user.id },
        {}
    )
    .lean()
    .then(response => {
        console.log("Fetched timed messages of user " + interaction.user.id + ":");
        console.log(response);
    })
    .catch(err => {
        console.error(err);
        interaction.reply({ content: "Something went wrong! :(", ephemeral: true });
    });
};

export const getTimedMessagesByQuery = async (query) => {
    return timedMessage.find(
        { query },
        {}
    )
    .lean()
    .then(response => {
        if (response.length > 0) {
            console.log("Fetched timed messages by query " + JSON.stringify(query) + ":");
            console.log(response);
        }
    })
    .catch(err => {
        console.error(err);
    });
};

export const updateTimedMessage = async (id, newDate) => {
    await timedMessage.findOneAndUpdate(
        { id: id },
        { date: newDate },
        { returnDocument: "after" }
    )
    .then(response => {
        console.log("Timed message updated: " + response);
    })
    .catch(err => {
        console.error(err);
    });
};

export const deleteTimedMessageById = async (id, user, interaction) => {
    await timedMessage.findOneAndDelete({ 
        id, 
        user 
    })
    .then(response => {
        if (response) {
            console.log("Timed message deleted: " + response);
            interaction?.reply({ content: "Timed message deleted successfully!", ephemeral: true });
        } else {
            interaction?.reply({ content: "Et voi poistaa ajastettua viestiä **" + id + "**, tai antamasi id on väärä!", ephemeral: true });
        }
    })
    .catch(err => {
        console.error(err);
        interaction?.reply({ content: "Something went wrong! :(", ephemeral: true });
    });
};