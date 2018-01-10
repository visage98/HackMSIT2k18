const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let UserSchema = new Schema({
    name : String,
    date : String,
    time : String,
    location : String,
    website : String,
    facebook : String,
    twitter : String
});


module.exports = mongoose.model('Event',UserSchema);