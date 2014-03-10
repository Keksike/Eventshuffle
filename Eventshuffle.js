var express = require('express'),
    path = require('path'),
    http = require('http'),
    mongoose = require('mongoose');

var app = express();

app.configure(function () {
    app.set('port', process.env.PORT || 3000);
    app.use(express.logger('dev'));
    app.use(express.bodyParser()),
    app.use(express.static(path.join(__dirname, 'public')));
    mongoose.connect('mongodb://localhost/eventsdb');
});

var eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  dates: {
    type: [Date],
    default: []
  }
});

var Event = mongoose.model('Event', eventSchema);

app.get('/events/list', function(req, res) {
  Event.find({}, function(err, events) {
    res.send(events);
  });
});

app.get('/events/:id', function(req, res) {
  Event.findOne({ _id: req.params.id }, function(err, event) {
    if(event == null) {
      return res.send(404, 'Event not found!');
    }
    res.send(event);
  });
});

app.post('/events/', function(req, res) {
  // Luodaan uusi Event modelin instanssi lähetetystä datasta (req.body)
  var event = new Event(req.body);

  // Tallennetaan
  event.save(function(err, event) {
    res.send(201, event);
  });
});

// app.post('/events/:id/vote', events.vote);
// app.get('events/:id/results', events.getResults);


http.createServer(app).listen(app.get('port'), function () {
    console.log("Listening on port " + app.get('port'));
})