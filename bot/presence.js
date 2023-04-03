import { ActivityType } from "discord.js";

export const setBotPresence = (client) => {
    const activities = [
        {
            name: "Super Monkey Ball",
            type: ActivityType.Playing
        }, {
            name: "Ape Escape",
            type: ActivityType.Playing
        }, {
            name: "Donkey Kong",
            type: ActivityType.Playing
        }, {
            name: "Bloons Tower Defence",
            type: ActivityType.Playing
        }, {
            name: "King Kong",
            type: ActivityType.Watching
        }, {
            name: "Planet of The Apes",
            type: ActivityType.Watching
        }, {
            name: "The Jungle Book",
            type: ActivityType.Watching
        }, {
            name: "you 🐒", 
            type: ActivityType.Watching
        }, {
            name: "Monkey ASMR", 
            type: ActivityType.Listening
        }, {
            name: "Monke podcast", 
            type: ActivityType.Listening
        },
    ];

    const activity = activities[Math.floor(Math.random() * activities.length)];

    client.user.setPresence({
        status: "online",
        activities: [{
            name: activity.name,
            type: activity.type
        }]
    });

    console.log("Bot activity changed:", client.user.presence.activities[0].type, client.user.presence.activities[0].name);

    setTimeout( function(){ setBotPresence(client); }, 1000 * 60 * 60);
};