const express = require('express');
const bp = require('body-parser');
const ejs = require('ejs');
const engine = require('ejs-mate');
const morgan = require('morgan');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('express-flash');
const cp = require('cookie-parser');
const MongoStore = require('connect-mongo')(session);
const path = require('path');
mongoose.Promise = require('bluebird');
const moment = require('moment');
var restclient = require('node-restclient');



const userRouter = require('./routes/user');
const config = require('./config/config');
const passport = require('./config/passport');

let Story = require('./models/stories');

mongoose.connect(config.database, {useMongoClient: true}).then(function (db) {
    console.log("Database Connected!");
}).catch(function (err) {
    console.log(err.message);
});

const app = express();

app.use('/',express.static(path.join(__dirname,"public")));

app.use(morgan('dev'));
app.use(bp.json());
app.use(bp.urlencoded({extended : true}));

app.use(cp(config.secretKey));
app.use(session({
    resave : true,
    saveUninitialized : true,
    secret : config.secretKey,
    store : new MongoStore({url : config.database, autoReconnect: true})
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use(function (req, res, next) {
    res.locals.user = req.user;
    next();
});

app.engine('ejs',engine);
app.set('view engine','ejs');
app.use(userRouter);

let PORT = process.env.PORT || config.port;

app.listen(PORT,function(){
    console.log("Server started on http://localhost:"+PORT);
});

setInterval(function() {
    try {
        restclient.get(
            "http://api.forismatic.com/api/1.0/?method=getQuote&format=text&lang=en&key="+Math.floor(Math.random() * Math.floor(1000000)),
            function(data) {
                 let story = new Story();
                 story.text = data;
                 story.created_at = moment().format("MMM Do YYYY");
                 story.save(function (err) {
                    if(err)
                        console.log(err);
                 });
            });
    }
    catch (e) {
        console.log(e);
    }
},60000*30);