import { getUnicodeEmoji } from "../functions/helpers/helpers.js";

//Commands
export const CMD_ERR = "There was an error while executing this command!";
export const CMD_REGISTER_SUCCESS = "Successfully registered application commands!"

//Discord API
export const MSG_FETCH_ERR = "Something went wrong when fetching the message!";
export const USER_FETCH_ERR = "Something went wrong when fetching user!";

//Database
export const NO_DB = "No database set!"
export const CONNECTING_DB = "Connecting to database...";
export const CONNECTED_DB = "Connected to database!";
export const CONNECTION_FAILURE_DB = "Cannot connect to database!";
export const NO_RECORDS = "Nothing to see here...";
export const ERROR_REPLY = "Something went wrong! " + getUnicodeEmoji("1F648");
export const INSERT_SUCCESS = "New entity inserted successfully!";
export const INSERT_FAILURE = "Failed to insert new entity!";
export const FETCH_ERR = "Error fetching data from database!";
export const UPDATE_SUCCESS = "Entity updated successfully!";
export const UPDATE_ERR = "Error updating entity!";
export const DELETE_SUCCESS = "Entity deleted successfully!";
export const DELETE_ERR = "Error deleting entity!";

//Parameters
export const ID = "id";
export const TOPIC = "topic";
export const CHANNEL = "channel";
export const DATE = "date";
export const REPEAT = "repeat";
export const ROLE = "role";
export const NEVER = "never";
export const DAILY = "daily";
export const WEEKLY = "weekly";
export const MONTHLY = "monthly";
export const YEARLY = "yearly";

//Channel
export const NO_GUILD = "No guild to post ";
export const NO_CHANNEL = "No channel to post ";

//Permissions
export const SEND_PERMISSION_ERR = "Cannot send messages to channel ";

//Date
export const DAY_MONTH_YEAR_24 = "DD.MM.YYYY HH:mm";
export const ISO_8601_24 = "YYYY-MM-DD HH:mm";
export const INVALID_DATE = "Given date and time is invalid. Required format is dd.mm.yyyy _hh:mm_";
export const EXPIRED_DATE = "Given date or time has already passed!";
export const DISTANT_DATE = "Date cannot be set over a year from now!";
export const INVALID_REPEAT = "Given repeat interval is invalid! Accepted values are:\n" +
    "daily = Repeat every day\n" +
    "weekly = Repeat every week\n" +
    "monthly = Repeat every month\n" +
    "yearly = Repeat every year";

//Formatting
export const EMPTY = " ";
export const NO_DATA = "-";

//Messages
export const MSG_DELETION_ERR = "Message does not exist!";

//Events
export const MAX_EVENTS = "Maximum of 5 events allowed!\n" +
    "Check your events with **/listevents** command, and delete events with **/deleteevents** command.";

//Polls
export const MAX_POLLS = "Maximum of 5 polls allowed!\n" +
    "Check your polls with **/listpolls** command, and delete polls with **/deletepolls** command.";

//Scheduled messages
export const MAX_SCHEDULED_MESSAGES = "Maximum of 5 scheduled messages allowed!\n" +
    "Check your scheduled messages with **/listscheduledmessages** command, and delete scheduled messages with **/deletescheduledmessage** command.";

//IDs
export const EVENT_MODAL = "event-modal";
export const EVENT_BUTTON = "event-button";
export const SCHEDULED_MESSAGE_MODAL = "scheduled-message-modal";

//Members
export const MEMBER_FETCH_ERR = "Error fetching guild members!";

//Roles
export const NO_ROLES = "You have no roles!";

//Media
export const SEARCH_SUCCESS = "Search success!";
export const SEARCH_ERR = "Search failed. Please try again!";
export const NO_RESULTS = "No results with search terms:";