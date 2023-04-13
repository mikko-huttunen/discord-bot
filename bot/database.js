import mongoose from "mongoose";
import { CONNECTED_DB, CONNECTING_DB, CONNECTION_FAILURE_DB, NO_DB } from "../variables/constants.js";

const database = process.env.DATABASE;

export const setDatabase = async () => {
     if (!database) {
        console.log(NO_DB);
        return;
    }

    mongoose.connection.on("connecting", () => {
        console.log(CONNECTING_DB);
    });

    mongoose.set('strictQuery', true);
    await mongoose.connect(database, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }).then(() => {
        console.clear();
        console.log(CONNECTED_DB);
    }).catch((err) => {
        console.clear();
        console.error(CONNECTION_FAILURE_DB, err);
    })
};