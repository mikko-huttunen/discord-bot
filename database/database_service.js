import { DELETE_ERR, DELETE_SUCCESS, FETCH_ERR, INSERT_FAILURE, INSERT_SUCCESS, UPDATE_ERR, UPDATE_SUCCESS } from "../variables/constants.js";

export const insertDocuments = (collection, data) => {
    return collection.insertMany(data).then(result => {
        console.log(INSERT_SUCCESS, JSON.stringify(result));
        return result;
    }).catch(err => {
        console.error(INSERT_FAILURE, err);
    });
};

export const getDocuments = (collection, query) => {
    return collection.find(query)
    .lean()
    .catch(err => {
        console.error(FETCH_ERR, err);
    });
};

export const findOneDocument = (collection, query) => {
    return collection.findOne(query)
    .lean()
    .catch(err => {
        console.error(FETCH_ERR, err);
    });
};

export const updateDocument = async (document, filter, update) => {
    const options = {
        new: true,
        upsert: true,
        rawResult: true
    };

    return document.findOneAndUpdate(filter, update, options).then(result => {
        console.log(UPDATE_SUCCESS, JSON.stringify(result));
        return result;
    }).catch(err => console.error(UPDATE_ERR, err))
};

export const deleteDocuments = (collection, query) => {
    return collection.deleteMany(query).then(result => {
        console.log(DELETE_SUCCESS, JSON.stringify(result))
        return result
    }).catch(err => console.error(DELETE_ERR, err));
};

export const bulkTransaction = async (collection, transactions) => {
    collection.bulkWrite(transactions).then(result => {
        console.log(UPDATE_SUCCESS, JSON.stringify(result));
        return result;
    }).catch(err => console.error(UPDATE_ERR, err));
};