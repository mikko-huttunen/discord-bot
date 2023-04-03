import moment from "moment";
import { handlePollReaction, postPollResults } from "../functions/polls.js";
import { getNumberEmotes } from "./emotes.js";
import { postTimedMessages } from "../functions/timed_message.js";
import { PermissionsBitField } from "discord.js";
import { getBotGuild } from "./bot_data.js";
import { eventReminderPost, eventSummaryPost } from "../functions/events.js";

export const checkForTimedActions = async (client) => {
    await postTimedMessages(client);
    await postPollResults(client);
    await eventSummaryPost(client);

    if (moment().format("HH:mm") === "12:00") {
        await eventReminderPost(client);
    }

    setTimeout( function(){ checkForTimedActions(client); }, 60 * 1000);
}

export const checkReaction = async (reaction, user) => {
    const numberEmojis = getNumberEmotes();

    if (numberEmojis.includes(reaction._emoji.name)) {
        await handlePollReaction(reaction, user);
    }
}

export const canSendMessageToChannel = async (channel) => {
    const guild = getBotGuild();

    if (!guild.members.me.permissionsIn(channel).has(PermissionsBitField.Flags.SendMessages)) {
        return false;
    }

    return true
}

export const isValidDateAndRepetition = (interaction, dateTime, repeat) => {
    if (!moment(dateTime, "YYYY/MM/DD").isValid()) {
        interaction.reply({ content: "Anna päivämäärä oikeassa muodossa: dd.mm.yyyy _hh:mm_", ephemeral: true });
        return false;
    }

    const currentDateTime = moment().format("YYYY-MM-DD HH:mm");
    if (moment(dateTime).isSameOrBefore(currentDateTime)) {
        interaction.reply({ content: "Antamasi päivämäärä tai kellonaika on jo mennyt!", ephemeral: true });
        return false;
    } else if (moment(dateTime).isAfter(moment(currentDateTime).add(1, "years"))) {
        interaction.reply({ content: "Päivämäärää ei voi asettaa yli 1 vuoden päähän!", ephemeral: true });
        return false;
    }

    if (repeat !== "" && repeat !== "never" && repeat !== "daily" && repeat !== "weekly" && repeat !== "monthly" && repeat !== "yearly") {
        interaction.reply({ 
            content: "Antamasi viestin toisto on virheellinen! Hyväksyttyjä muotoja ovat:\n" +
                "daily = Toista joka päivä\n" +
                "weekly = Toista joka viikko\n" +
                "monthly = Toista joka kuukausi\n" +
                "yearly = Toista joka vuosi",
            ephemeral: true
        });
        return false;
    }

    return true;
}