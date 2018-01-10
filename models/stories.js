const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let StoriesSchema = new Schema({
    author : {type : Schema.Types.ObjectId, ref:'User'},
    text : {type: String , default : ""},
    media : {
        video : String,
        photo : String
    },
    created_at : String
});

module.exports = mongoose.model('Story',StoriesSchema);