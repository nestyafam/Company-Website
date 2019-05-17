var express = require('express');
var ejs = require ('ejs');
var cookieparser = require ('cookie-parser');
var bodyparser = require ('body-parser');
var validator = require ('express-validator');
var engine = require ('ejs-mate');
var session = require ('express-session');
var mongoose = require ('mongoose');
var MongoStore = require('connect-mongo')(session);
var app = express();
var passport = require ('passport');
var flash = require ('connect-flash');
var _ = require ('underscore');
var moment = require('moment')

require('./configuration/passport');
require('./secret/secret');

mongoose.promise = global.promise;
mongoose.connect('mongodb://localhost/website1');

app.use (express.static('public'));
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.use(cookieparser());
app.use (bodyparser.urlencoded({extended: true}));
app.use (bodyparser.json());

app.use (validator());

app.use (session({
    secret :'testkey',
    resave: false,
    saveUninitialized: false, 
    store:new MongoStore({mongooseConnection: mongoose.connection})
}));

app.use (flash());
app.use(passport.initialize());
app.use(passport.session());

app.locals._ = _;
app.locals.moment = moment;



require ('./router/user') (app, passport);
require ('./router/company') (app)
require ('./router/review') (app)
require ('./router/message') (app)

app.listen (1234, function(){
    console.log('current execution port is 1234')
});