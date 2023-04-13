import { CREATE_FAILURE, CREATE_SUCCESS, DELETE_ERR, FAILURE, SUCCESS, UPDATE_ERR } from "../../../variables/constants.js";
import { generateId } from "../../helpers/helpers.js";
import { timedMessage } from "../models/timed_message_schema.js";

export const createTimedMessage = (interaction, author, message, date, repeat, channel) => {
    const id = generateId();
    const timedMessageData = {
        id,
        author,
        message,
        date,
        repeat,
        channelId: channel.id
    };

    new timedMessage(timedMessageData)
    .save()
    .then(response => {
        console.log(CREATE_SUCCESS, JSON.stringify(response));
        interaction.reply({ content: SUCCESS, ephemeral: true });
    })
    .catch(err => {
        console.error(CREATE_FAILURE, err);
        interaction.reply({ content: FAILURE, ephemeral: true });
    });
};

export const getTimedMessagesByUser = async (user) => {
    return timedMessage.find({ author: user.id }).lean();
};

export const getTimedMessagesByQuery = async (query) => {
    return timedMessage.find(query).lean();
};

export const updateTimedMessage = async (id, newDate) => {
    timedMessage.findOneAndUpdate(
        { id },
        { date: newDate },
        { returnDocument: "after" }
    )
    .then(console.log("Timed message " + id + " updated"))
    .catch(err => {
        console.error(UPDATE_ERR, err);
    });
};

export const deleteTimedMessageById = async (id, author, interaction) => {
    timedMessage.findOneAndDelete({ 
        id, 
        author 
    })
    .then(response => {
        if (response) {
            console.log("Timed message " + id + " deleted");
            interaction?.reply({ content: SUCCESS, ephemeral: true });
        } else {
            interaction?.reply({ content: "Cannot delete timed message **" + id + "**, or given ID is wrong!", ephemeral: true });
        }
    })
    .catch(err => {
        console.error(DELETE_ERR, err);
        interaction?.reply({ content: FAILURE, ephemeral: true });
    });
};