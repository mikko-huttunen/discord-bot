import mongoose from "mongoose";

const database = process.env.DATABASE;

export const setDatabase = async () => {
     if (!database) {
        console.log("No database set!");
        return;
    }

    mongoose.set('strictQuery', true);
    mongoose.connect(database, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }).then(() => {
        console.log("Connected to database!");
    }).catch((err) => {
        console.log(err);
    })
};