const router = require('express').Router();
const passport = require('../config/passport');
const speakeasy = require("speakeasy");
const config = require('../config/config');
const User = require('../models/users');
const Event = require('../models/event');
const Story = require('../models/stories');
const moment = require('moment');

function checkLoggedIn(req, res, next) {
    if (req.user) {
        next();
    } else {
        res.redirect('/login');
    }
}

router.get('/privacypolicy', function (req, res, next) {
    res.render('mains/privacy');
});

router.get('/login',function (req, res) {
    if(req.user) return res.redirect('/');
    res.render('accounts/login',{message : req.flash('loginMessage')});
});

router.post('/login', passport.authenticate('local-login', {
    successRedirect: '/profile',
    failureRedirect: '/login',
    failureFlash: true
}));

router.get('/signup', function (req, res, next) {
    if(req.user) return res.redirect('/');
    res.render('accounts/signup',{
        errors : req.flash('errors')
    });
});

router.get('/profile',checkLoggedIn,function (req,res) {
    User.findOne({ _id: req.user._id }, function(err, user) {
        if (err) return next(err);
        res.render('accounts/profile', { user: user });
    });
});

router.post('/profile', function (req, res, next) {
    User.findOne({ _id: req.user._id }, function(err, user) {
        if (err) return next(err);
        user.profile.dob = req.body.dob;
        user.profile.mobile = req.body.mobile;
        user.profile.gender = req.body.gender;
        user.profile.Bio = req.body.bio;
        user.save(function (err) {
           if(err) return next(err);
            res.render('accounts/profile', { user: user });
        });
    });
});

router.post('/signup', function (req, res, next) {
    let user = new User();


    user.profile.name = req.body.name;
    user.password = req.body.password;
    user.email = req.body.email;
    user.profile.picture = user.gravatar();

    User.findOne({email : req.body.email}, function (err, existingUser) {
        if(err) return next(err);
        if(existingUser) {
            if(existingUser.otp.validate){
                req.flash('errors', 'Email Address already exists.');
                return res.redirect('/signup');
            }
            else{
                User.remove({email : req.body.email},function (err) {
                    if(err) return next(err);
                    var secret = speakeasy.generateSecret({length: 20});

                    let token = speakeasy.totp({
                        secret: secret.base32,
                        encoding: 'base32',
                        time: 11000
                    });

                    user.otp.secret = secret;

                    user.save(function (err) {
                        if(err){
                            return next(err);
                        }
                        var send = require('gmail-send')({
                            user: config.mailing.from,
                            pass: config.mailing.password,
                            to:   user.email,
                            subject: 'Your OTP from Anti-Addict to signup',
                            html:    'Your OTP is <b>'+token+'</b>. Use this to verify your account. This is valid only for <b>3 hours</b>.'
                        });
                        send();
                        return res.render('accounts/otp', { user: user });
                    });
                });
            }
        }
        else {
            var secret = speakeasy.generateSecret({length: 20});

            let token = speakeasy.totp({
                secret: secret.base32,
                encoding: 'base32',
                time: 11000
            });

            user.otp.secret = secret;

            user.save(function (err) {
                if(err){
                    return next(err);
                }
                var send = require('gmail-send')({
                    user: config.mailing.from,
                    pass: config.mailing.password,
                    to:   user.email,
                    subject: 'Your OTP from Anti-Addict to signup',
                    html:    'Your OTP is <b>'+token+'</b>. Use this to verify your account. This is valid only for <b>3 hours</b>.'
                });
                send();
                return res.render('accounts/otp', { user: user });
            });
        }
    });
});

router.post('/otp',function (req, res, next) {
    var token = parseInt(req.body.otp);
    console.log(token);
    User.findOne({email : req.body.email}, function (err, user) {
        if(err) return next(err);
        var tokenValidates = speakeasy.totp.verify({
            secret: user.otp.secret.base32,
            encoding: 'base32',
            token: token,
            time: 11000
        });
        console.log(tokenValidates);
        if(tokenValidates){
            user.otp.validate = true;
            user.save(function (err) {
                if(err) return next(err);
                req.logIn(user,function (err) {
                    if(err) return next(err);
                    res.redirect('/profile');
                });
            })
        }
        else {
            req.flash('errors', 'OTP verification unsuccessful.');
            return res.redirect('/signup');
        }
    });
});

router.get('/auth/facebook', passport.authenticate('facebook', {scope:'email'}));

router.get('/auth/facebook/callback', passport.authenticate('facebook', { successRedirect: '/profile',
    failureRedirect: '/login' }));

router.get('/auth/google', passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login','profile','email'] }));


router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
        res.redirect('/profile');
    });

router.get('/events', function (req, res) {

    Event.find({}, function (err, events) {
        if(req.user){
            return res.render('mains/events', {
                month : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
                user : req.user,
                events : events
            });
        }
        return res.render('mains/events', {
            month : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
            events : events
        });
    });
});

router.get('/', function (req, res) {
    if(req.user){
        return res.render('mains/home', {
            user : req.user
        });
    }
    return res.render('mains/home');
});

router.get('/feed',checkLoggedIn, function (req, res) {
    Story.find({}).populate('author').exec(function (err, result) {
        if(err) return next(err);
        User.findById(req.user._id, function (err, user) {
            if(err) return next(err);
            res.render('mains/feeds',{
                stories : result,
                user : user
            });
        })
    });
});

router.post('/feed', function (req, res, next) {
    let story = new Story();
    if(req.body.checkbox!=="yes"){
        story.author = req.user._id;
    }
    story.text = req.body.text;
    story.created_at = moment().format("MMM Do YY");
    if(req.body.picture)
        story.media.photo = req.body.picture;
    story.save(function (err) {
        if(err){
            return next(err);
        }
        res.redirect('/feed');
    });
});

router.get('/',checkLoggedIn, function (req, res) {
    if(req.user){
        return res.render('mains/home', {
            user : req.user
        });
    }
    return res.redirect('mains/home');
});

router.get('/addevents', function (req, res) {
    if(req.user && req.user.email=="deepanshu.bagri98@gmail.com"){
        return res.render('mains/addevent', {
            user : req.user
        });
    }
    return res.send("Not Authorised!");
});

router.post('/addevents', function (req, res) {
    let event = new Event();

    event.name = req.body.name;
    event.location = req.body.location;
    event.date = req.body.date;
    event.time = req.body.time;
    event.website = req.body.website;
    event.facebook = req.body.facebook;
    event.twitter = req.body.twitter;

    event.save(function (err) {
        if(err)
            return next(err);
        res.render('mains/addevent');
    });
});

router.get('/help', function (req, res, next) {
    if(req.user){
        res.render('mains/help', {
            user : req.user
        });
    }
    res.render('mains/help');
});

router.get('/logout', function(req, res){
    req.logout();
    res.redirect('/login');
});

module.exports = router;