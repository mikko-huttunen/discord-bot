import { PermissionsBitField } from "discord.js";
import moment from "moment";
import { bot } from "../../bot/bot.js";
import { eventReminderPost, eventSummaryPost } from "../events/events.js";
import { handlePollReaction, postPollResults } from "../polls/polls.js";
import { postTimedMessages } from "../timed_messages/timed_message.js";
import { getNumberEmotes } from "./emotes.js";

export const checkForTimedActions = async (client) => {
    await postTimedMessages(client);
    await postPollResults(client);
    await eventSummaryPost(client);

    if (moment().format("HH:mm") === "00:00") {
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
    if (!bot.guild.members.me.permissionsIn(channel).has(PermissionsBitField.Flags.SendMessages)) {
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