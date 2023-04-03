import { bot } from "../../../../bot/bot.js";
import { event } from "../models/event_schema.js";

export const createEvent = (interaction, eventId, msgId, author, name, description, dateTime, repeat, thumbnail, channelId) => {
    const eventData = { 
        eventId,
        msgId,
        author,
        name,
        description,
        dateTime,
        repeat,
        thumbnail,
        channelId,
        attendees: {
            number: 0,
            entries: []
        }
    };

    new event(eventData)
    .save()
    .then(response => {
        console.log("Event created:");
        console.log(response);
        interaction.reply({ content: "New event created successfully!", ephemeral: true });
    })
    .catch(err => {
        console.error(err);
        interaction.reply({ content: "Something went wrong! :(", ephemeral: true });
    });
};

export const getEvents = async () => {
    return event.find(
        {},
        {}
    )
    .lean()
    // .then(response => {
    //     console.log("Fetched all events:");
    //     console.log(response);
    // })
    // .catch(err => {
    //     console.error(err);
    //     interaction.reply({ content: "Something went wrong! :(", ephemeral: true });
    // });
};

export const getEventsByUser = async (interaction) => {
    return event.find(
        { author: interaction.user.id },
        {}
    )
    .lean()
    // .then(response => {
    //     console.log("Fetched events of user " + interaction.user.id + ":");
    //     console.log(response);
    // })
    // .catch(err => {
    //     console.error(err);
    //     interaction.reply({ content: "Something went wrong! :(", ephemeral: true });
    // });
};

export const getEventByMsg = async (msg) => {
    return event.findOne(
        { msgId: msg.id },
        {}
    )
    .lean()
    // .then(response => {
    //     console.log("Fetched events by msg " + interaction.msg.id + ":");
    //     console.log(response);
    // })
    // .catch(err => {
    //     console.error(err);
    //     interaction.reply({ content: "Something went wrong! :(", ephemeral: true });
    // });
};

export const getEventsByQuery = async (query) => {
    return event.find(query).lean()
    // .then(response => {
    //     if (response.length > 0) {
    //         console.log("Fetched events by query " + JSON.stringify(query) + ":");
    //         console.log(response);
    //     }
    // })
    // .catch(err => {
    //     console.error(err);
    // });
};

export const updateEventData = async (eventId, msgId, newDate) => {
    //Event reminder update
    if (!newDate) {
        await event.findOneAndUpdate(
            { eventId },
            { msgId },
            { returnDocument: "after" }
        )
        .then(console.log("Event " + eventId + " msgId updated"))
        .catch(err => {
            console.error(err);
        });
    }
    
    //Event repost update
    if (newDate) {
        await event.findOneAndUpdate(
            { eventId },
            {
                msgId,
                dateTime: newDate,
                "attendees.number": 0,
                "attendees.entries": []
            },
            { returnDocument: "after" }
        )
        .then(console.log("Event " + eventId + " msgId and date updated"))
        .catch(err => {
            console.error(err);
        });
    }

    return;
};

export const updateEventAttendees = async (eventData, entries) => {
    event.findOneAndUpdate(
        { eventId: eventData.eventId },
        { 
            "attendees.number": entries.length,
            "attendees.entries": entries
        }
    )
    .then(console.log("Event " + eventData.eventId + " attendees updated"))
    .catch(err => {
        console.error(err);
    });
};

export const deleteEventById = async (eventId, author, interaction) => {
    let channel;
    let msgId;

    event.findOneAndDelete({ 
        eventId, 
        author 
    })
    .then(response => {
        if (response) {
            channel = bot.guild.channels.cache.get(response.channelId);
            msgId = response.msgId;
            console.log("Event " + response.eventId + " deleted:");
            console.log(response);
            interaction?.reply({ content: "Event deleted successfully!", ephemeral: true });
        } else {
            interaction?.reply({ 
                content: "Et voi poistaa tapahtumaa **" + eventId + "**, tai antamasi id on väärä!",
                ephemeral: true
            });
        }
    }).catch(err => {
        console.error(err);
        interaction?.reply({ content: "Something went wrong! :(", ephemeral: true });
    });

    try {
        const eventMsg = await channel.messages.fetch(msgId);
        eventMsg.delete();
    } catch (err) {
        console.error(err);
    }
};

export const deleteEventByMsg = async (msgId) => {
    event.findOneAndDelete({ 
        msgId,
        repeat: ""
    })
    .then(response => {
        if (response) {
            console.log("Event " + response.eventId + " deleted:");
            console.log(response);
        }
    })
    .catch(err => {
        console.error(err);
    });
};