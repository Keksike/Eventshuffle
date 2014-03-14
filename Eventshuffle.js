/*
* Dunno if I should comment in finnish or english, I chose the latter.
* 
* 
*/

var express = require('express'),
    path = require('path'),
    http = require('http'),
    mongoose = require('mongoose'),
    autoIncrement = require('mongoose-auto-increment'), //for autoassigning id's to events and votes
    async = require('async'),//for iterating through vote-dates
    _ = require('underscore'); //for findWhere in voting

var app = express();

/*We need these to use mongoose-auto-increment*/
var connection = mongoose.createConnection("mongodb://localhost/myDatabase");
autoIncrement.initialize(connection);

app.configure(function () {
    app.set('port', process.env.PORT || 3000);
    app.use(express.logger('dev'));
    app.use(express.bodyParser()),
    app.use(express.static(path.join(__dirname, 'public')));
    mongoose.connect('mongodb://localhost/eventsdb');
});

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
});
var Event = mongoose.model('Event', eventSchema);
eventSchema.plugin(autoIncrement.plugin, {model: 'Event', field: 'eventId'});

/*Schema for votes*/
var voteSchema = new mongoose.Schema({
    voteId: {
        type: Number
    },
    date: {
        type: String,
        required: true
    },
    people: {
        type: [String],
        default: []
    }
});
var Vote = mongoose.model('Vote', voteSchema);
voteSchema.plugin(autoIncrement.plugin, {model: 'Vote', field: 'voteId'});


/*Posts new event to db*/
app.post('/events/', function(req, res) {
    //Create new instance of Event-model, with the sent data (req.body)
    var event = new Event(req.body);

    //Save it
    event.save(function(err, event) {
        res.send(201, event);
    });
});

/*Posts new vote into event with its Id
* Requires a "name", and an array of "dates"
*/
app.post('/events/:id/vote', function(req, res){
    console.log('0');
    
    Event.findOne({ eventId: req.params.id }).populate('votes').exec(function(err, event){
        console.log('1');

        if(err != null){
            return res.send(500, err);
        } 
        
        if(event === null){
            return res.send(404, new Error('Event not found!'));
        } 
        
        if(req.body.dates == null || !_.isArray(req.body.dates)){
            return res.send(400, new Error('"dates" - field is required and it should be an array!'));
        }

        if(req.body.name == null){
            return res.send(400, new Error('"name" - field is required!'));
        }

        console.log('3');
        //lets iterate through the given dates
        async.map(req.body.dates, function(date, done) { 
            console.log('4');
            var vote = _.findWhere(event.votes, { date: date });
            console.log('5');
            if (vote != null){ // If vote already exists...
                // Lets push the name if it doesnt exist
                console.log('5.5');
                if(vote.people.indexOf(req.body.name) === -1){
                    vote.people.push(req.body.name);
                    return vote.save(done);
                    console.log('6');
                }

                // Lets return vote coz we dont need to do anything to it
                return done(null, vote);
                console.log('7');
            }
            // If existing vote wasnt found, lets create it
            // Lets also check that it has a valid date.
            if(event.dates.indexOf(date) > -1){
                console.log('8');
                var vote = new Vote({
                    date: req.body.date,
                    people: [req.body.name]
                });
                console.log('9');
                return vote.save(done);
            }
            console.log('10');
            done(new Error('Invalid date'));

        }, function(err, results){
            console.log('11');
            console.log(event.votes, results);
            console.log(err);
            if(err != null){
                return res.send(400, err);
            }
            // Lets combine the votes of the results and the votes which were already there.
            // Lets also change the list to be only mongoids
            event.votes = event.votes.concat(results).map(function(vote){
                return vote._id;
                console.log('13');
            });

            event.save(function(err, event){
                console.log('14');
                if(err != null){
                    return res.send(400, err);
                }
                res.send(201, event);        
            });
        });
    });
});

/*Lists all events in db*/
app.get('/events/list', function(req, res) {
    Event.find({}, function(err, events) {
        res.send(events);
    });
});

/*Gets a single event with its Id*/
app.get('/events/:id', function(req, res) {
    //Uses the autoincremented eventId to find event, _not mongoId_
    Event.findOne({ eventId: req.params.id }, function(err, event) {
        if(event == null) {
             return res.send(404, 'Event not found!');
        }
        res.send(event);
    });
});

/*Gets the results of an event with its ID*/
app.get('/events/:id/results', function(req, res) {
    Event.findOne({eventId: req.params.id}).populate('votes').exec(function(err, event){
        if(event == null){
            return res.send(404, 'Event not found!');
        }
        res.send(event);
    });
});

http.createServer(app).listen(app.get('port'), function () {
    console.log("Listening on port " + app.get('port'));
})