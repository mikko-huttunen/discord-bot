import { FETCH_ERR, UPDATE_ERR, UPDATE_SUCCESS } from "../variables/constants.js";

export const insertDocument = (document, data) => {
    return new document(data).save();
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
    //Return changed document
    const options = {
        new: true,
        upsert: true,
        rawResult: true
    };

    return document.findOneAndUpdate(
        filter,
        update,
        options
    )
    .then(result => {
        console.log(UPDATE_SUCCESS, JSON.stringify(result))
        return result;
    })
    .catch(err => console.error(UPDATE_ERR, err))
};

export const deleteDocument = (collection, query) => {
    return collection.findOneAndDelete(query);
};