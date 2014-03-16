Eventshuffle REST API Readme
*******************************

Author: Cihan Bebek
GitHub: https://github.com/Keksike/Eventshuffle

*******************************

Requirements:
*************

  Must be installed:
  - Node.js - http://nodejs.org/
  - MongoDB - https://www.mongodb.org/

  Uses Node modules:
  - express  - http://expressjs.com/
  - mongoose - http://mongoosejs.com/
  - mongoose-auto-increment - https://github.com/codetunnel/mongoose-auto-increment
  - async - https://github.com/caolan/async
  - underscore - http://underscorejs.org/

  If you have the package.json, simply use "npm install" to get all the required Node modules

Usage
*****
  
  - Creates and uses a (mongo)database called "eventsdb". This can be changed on the line
  "mongoose.connect('mongodb://localhost/eventsdb');"

  - Default port is 3000. Can be changed from the line 
  app.set('port', process.env.PORT || 3000);

  1. Make sure you have MongoDB installed and running (run Mongodb by navigating to .../mongodb/bin and running mongod.exe)
  2. Make sure you have Node.js installed
  3. Get repo from GitHub https://github.com/Keksike/Eventshuffle
  4. Run cmdprompt and navigate to files
  5. Run "npm install", wait for it to finish
  6. Run "node Eventshuffle.js"

Available functions:
********************

  Available POSTs:

    POST: Create new event to DB

      - Endpoint: /events/
      - Requires:

        - Name of event
          Name: name
          Type: String

        - Dates available for event
          Name: dates
          Type: String[]

    POST: Vote suitable dates for a event

      - Endpoint: /events/:id/vote
      - Requires:

        - Name of voter
          Name: name
          Type: String

        - Dates suitable for voter
          Name: dates
          Type: String[]

  Available GETs:

    GET: List the information of all the events

      - Endpoint: /events/list

    GET: Show the information of a single event

      - Endpoint: /events/:id

    GET: Show the dates which are suitable for all voters of a single event

      - Endpoint: /events/:id/results






