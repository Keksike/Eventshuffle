/*
* 
* REST API for scheduling events with friends
* 
* https://github.com/Keksike/Eventshuffle
*/

var express         = require('express'),
    app             = express(),                          //take express into use
    path            = require('path'),
    http            = require('http'),
    mongoose        = require('mongoose'),                //for handling mongodb, creating Schemas etc.
    autoIncrement   = require('mongoose-auto-increment'), //for autoassigning id's to events
    async           = require('async'),                   //for iterating through vote-dates
    _               = require('underscore'),              //for findWhere in voting and other little things
    passport        = require('passport'),                //for authentication system

    morgan          = require('morgan'),
    cookieParser    = require('cookie-parser'),
    bodyParser      = require('body-parser'),
    session         = require('express-session'),
    flash           = require('connect-flash');


var LocalStrategy = require('passport-local').Strategy;
var configDB = require('./config/database.js');

/*Lets take mongoose-auto-increment into use*/
var connection = mongoose.createConnection("mongodb://localhost/myDatabase");
autoIncrement.initialize(connection);

//take passport config into use
require('./config/passport')(passport);


app.configure(function () {
    app.use(morgan('dev')); // log every request to the console
    app.use(cookieParser()); // read cookies (needed for auth)
    app.use(bodyParser()); // get information from html forms

    /*Passport stuff*/
    app.use(session({ secret: 'lol' })); // session secret
    app.use(passport.initialize());
    app.use(flash()); // use connect-flash for flash messages stored in session

    /*port*/
    app.set('port', process.env.PORT || 3000);

    app.set('view engine', 'ejs'); // set up ejs for templating

    app.use(passport.session());

    app.use(express.bodyParser()),
    app.use(express.static(path.join(__dirname, './views')));
    mongoose.connect('mongodb://localhost/eventsdb');


    require('./config/passport')(passport);
    require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport
});

/* Authentication system code begins here
 *
 *
 */

/*User info schema*/
/*var UserSchema = mongoose.Schema;
var UserDetail = new UserSchema({
        username: String,
        password: String
    }, {
        collection: 'userInfo'
    }
);

var UserDetails = mongoose.model('userInfo', UserDetail);*/

/*Login screen*/
/*app.get('/login', function(req, res) {
    res.sendfile('views/login.html');
});*/

/*Receive login-info*/
/*app.post('/login',
    passport.authenticate('local', {
        successRedirect: '/loginSuccess',
        failureRedirect: '/loginFailed',
  })
);*/

/*Login failed*/
/*app.get('/loginFailed', function(req, res, next) {
    res.sendfile('views/loginFailed.html');
    setTimeout(res.redirect('/login'), 2000);
});*/
 
/*Login successful*/
/*app.get('/loginSuccess', function(req, res, next) {
    res.send('Successfully authenticated');
});*/

/*(De)Serialization*/
/*passport.serializeUser(function(user, done) {
    done(null, user);
});
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});*/


/*Local authentication strategy*/
/*passport.use(new LocalStrategy(function(username, password, done) {
    process.nextTick(function() {
        UserDetails.findOne({
            'username': username,
        }, function(err, user) {
            if (err) {
                return done(err);
            }
 
            if (!user) {
                return done(null, false, { message: 'Incorrect username!'});
            }
 
            if (user.password != password) {
                return done(null, false, { message: 'Incorrect username!'});
            }
 
            return done(null, user);
        });
    });
}));
*/
/* Authentication system code ends
 *
 *
 */

/* Eventshuffle code begins here
 *
 *
 */

/*Schema for events*/
var eventSchema = new mongoose.Schema({
    //name of the event
    eventId: {
        type: Number
    },
    name: {
        type: String,
        required: true
    },
    dates: {
        //Gotta find a better object for date, so we can get rid of time at end
        //we could use String but thats not cool
        type: [String],
        default: []
    },
    votes: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vote' }],
        default: []
    }
}, {
    toJSON: { //mongoids or mongoversion doesnt need to be shown
        transform: function(doc, ret, options) {
            return _.omit(ret, ['_id', '__v']);
        }
    }
});
var Event = mongoose.model('Event', eventSchema);
eventSchema.plugin(autoIncrement.plugin, {model: 'Event', field: 'eventId'});

/*Schema for votes*/
var voteSchema = new mongoose.Schema({
    date: {
        type: String,
        required: true
    },
    people: {
        type: [String],
        default: []
    }
}, {
    toJSON: { //mongoids or mongoversion doesnt need to be shown
        transform: function(doc, ret, options) {
            return _.omit(ret, ['_id', '__v']);
        }
    }
});
var Vote = mongoose.model('Vote', voteSchema);

/*Posts new event to db*/
/*Requires a "name" and "dates[]"*/
app.post('/events/', function(req, res) {
    //Create new instance of Event-model, with the sent data (req.body)
    var event = new Event(req.body);

    //Save it
    event.save(function(err, event) {
        res.send(201, _.pick(event, 'eventId'));
    });
});

/*
* Posts new vote into event with its Id
* Requires a "name", and "dates[]""
*/
app.post('/events/:id/vote', function(req, res){
    
    Event.findOne({ eventId: req.params.id }).populate('votes').exec(function(err, event){

        if(err != null){
            return res.send(500, err);
        } 
        
        if(event === null){ //make sure event of given id exists
            return res.send(404, 'Event not found!');
        } 
        
        if(req.body.dates == null || !_.isArray(req.body.dates)){ //make sure we were given an array of dates
            return res.send(400, '"dates" - field is required and it should be an array!');
        }

        if(req.body.name == null){ //make sure we were given a name
            return res.send(400, '"name" - field is required!');
        }

        //lets iterate through the given dates
        async.map(req.body.dates, function(date, done) { 

            var vote = _.findWhere(event.votes, { date: date });
            if (vote != null){ // If vote already exists...
                // Lets push the name if it name isnt already there
                if(vote.people.indexOf(req.body.name) === -1){
                    vote.people.push(req.body.name);
                    return vote.save(done);
                }
                // Lets return vote coz we dont need to do anything to it
                return done(null, vote);
            }
            // If existing vote wasnt found, lets create it
            // Lets also check that it has a valid date.
            if(event.dates.indexOf(date) > -1){
                var vote = new Vote({
                    date: date,
                    people: [req.body.name]
                });
                return vote.save(done);
            }
            done('Invalid date');

        }, function(err, results){
            if(err != null){
                return res.send(400, err);
            }
            // Lets combine the votes of the results and the votes which were already there.
            // Lets also change the list to be only mongoids
            event.votes = event.votes.filter(function(vote){
                _.findWhere(results, {_id: vote._id}) === null;
            }).concat(results);

            event.save(function(err, event){
                if(err != null){
                    return res.send(400, err);
                }
                event.populate('votes', function(err, event){
                    res.send(201, event);
                });
            });
        });
    });
});

/*Lists all events in db*/
app.get('/events/list', function(req, res) {
    //shows only id and name of events
    Event.find({}, 'eventId name', function(err, events) {
        res.send(events);
    });
});

/*Gets a single event with its Id*/
app.get('/events/:id', function(req, res) {
    Event.findOne({ eventId: req.params.id }, function(err, event) {
        if(event == null) {
             return res.send(404, 'Event not found!');
        }
        event.populate('votes', function(err, event){
            res.send(event);
        });
    });
});

/*Gets the results of an event with its ID*/
app.get('/events/:id/results', function(req, res) {
    Event.findOne({eventId: req.params.id}).populate('votes').exec(function(err, event){
        if(event == null){
            return res.send(404, 'Event not found!');
        }
        
        //names variable will include all the names of all the votes of this event
        //plucks all the people of all the votes, flattens structure, then removes duplicates
        //underscore is awesome
        var names = _.uniq(_.flatten(_.pluck(event.votes, 'people')));

        //logic for checking the suitableDates
        //aka dates that suit everyone who have voted so far
        var suitableDates = event.votes.filter(function(vote){

            //lets check if the list of all the names and the list of people in vote are the same
            //im sure theres a faster way to do this but this one looks nice
            if(names.length == vote.people.length){ //makes sure lengths are same
                //if intersection doesnt change length, the arrays have the same names in them
                return _.intersection(names, vote.people).length == names.length;
            }
            return false;
        });

        //lets put the suitable dates into event
        event = event.toObject();
        event.suitableDates = suitableDates;
        //we dont want to shot dates and votes
        event = _.omit(event, ['dates', 'votes', '__v', '_id']);

        res.send(event);
    });
});

/* Eventshuffle code ends here
 *
 *
 */

http.createServer(app).listen(app.get('port'), function () {
    console.log("Listening on port " + app.get('port'));
})
