import { FETCH_ERR, UPDATE_ERR, UPDATE_SUCCESS } from "../variables/constants.js";

export const insertDocument = (document, data) => {
    return new document(data).save();
};

export const findDocuments = (collection, query) => {
    return collection.find(query)
    .lean()
    .catch(err => {
        console.error(FETCH_ERR, err);
    });
};

export const updateDocument = (document, filter, update) => {
    //Return changed document
    const options = { new: true };

    document.findOneAndUpdate(
        filter,
        update,
        options
    )
    .then(result => console.log(UPDATE_SUCCESS, JSON.stringify(result)))
    .catch(err => console.error(UPDATE_ERR, err))
};

export const deleteDocument = (collection, query) => {
    return collection.findOneAndDelete(query);
};