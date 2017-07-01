<<<<<<< HEAD
var express = require('express');
var app = express();
var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

app.use(express.static('public'))

var buildings = require('./buildings.json');

var pg = require('pg');
var pgp = require('pg-promise')();
var database_url = process.env.DATABASE_URL || 'postgres://MattSchrage@localhost:5432/peekbackend';

var db = pgp(database_url);
var moment = require('moment');

//var bodyParser = require('body-parser')

//app.use(bodyParser.json())
//query for get; body for post

// ////////SMS NOTIFICATIONS/////////////////
// setInterval(function() {
//   // check db for reminders
// }, 1000 * 60);
// ///
=======
let express = require('express');
let bodyParser = require('body-parser');
let pgp = require('pg-promise')();
let Fuse = require('fuse.js');

let buildings = require('./buildings.json');
let config = require('./config');

let db = pgp(config.dbUrl);
let app = express();

let fuse = new Fuse(buildings, {
  caseSensitive: false,
  keys: ['name']
});
>>>>>>> 5799b42377dca20d1d551572a16fa4261d181808

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.post('/loc', (req, res) => {
  let locations = req.body.locations;
  let userId = req.body.userId;

  for (let data of locations) {
    let {lat, lon, timestamp} = data;
    let location = `${lat},${lon}`;

    let query = 'INSERT INTO locations(location, startDate, userId) values($1, $2, $3)';

    // TODO: Move out of loop and into bulk insert to speed up
    db.any(query, [location, timestamp, userId])
      .then(() => {
        res.send('Inserted location into DB');
      }).catch(err => {
        console.error(err);
        res.send(`Error ${err}`);
      });
  }
});

function hexToRgb (hex) {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function searchBuildings (name) {
  let building = fuse.search(name)[0];
  if (building) {
    console.log(building);
    return `${building.lat} , ${building.lng}`;
  } else {
    console.log(`NO BUILDING FOUND FOR "${name}"`);
  }
}

<<<<<<< HEAD
function toTimeZone(time, zone) {
    var format = 'YYYY/MM/DD HH:mm:ss ZZ';
    return moment(time, format).tz(zone).format(format);
}

app.post('/log', function(req, res) {
  var type = req.body.type,
      value = req.body.value,
      userId = req.body.userId;
  console.log(type, value, userId);
  //res.send(type, value, userId)
  if (type === "AppClosed") {
    res.send('Rejected');
    return;
  }
  pg.connect(process.env.DATABASE_URL || database_url , function(err, client, done) {
    client.query('INSERT INTO logs(EventType, value, userId, timestamp) values($1, $2, $3, CURRENT_TIMESTAMP)',[type, value, userId], function(err, result) {
      done();
      if (err)
       { console.error(err); res.send("Error " + err); }
      else
       {
          res.send('Inserted into DB');
         //res.redirect("http://heypeek.com");
       }
    });
  });
  //Add to analytics Database
});

app.get('/event', function(req, res) {
  var id = req.body.id;
  pg.connect(process.env.DATABASE_URL || database_url , function(err, client, done) {
    client.query('SELECT * FROM events WHERE id = $1',[id], function(err, result) {
      done();
      if (err)
       { console.error(err); res.send("Error " + err); }
      else
       {
         res.send(result["rows"]);
       }    //; }
    });
  });


}


app.post('/event', function(req, res) {
    var name = req.body.name,
        icon = req.body.icon,
        startDate = req.body.startDate,
        endDate = req.body.endDate,
        details = req.body.details,
        hostName = req.body.hostName,
        locationBuilding = req.body.locationBuilding,
        locationRoom = req.body.locationRoom,
        locationName = locationBuilding + " " + locationRoom;
        location = req.body.location,
        email = req.body.email;
        //convert hex to rgb
        var rgb = hexToRgb(req.body.color);
        var color  = "" + rgb.r / 255 + " " + rgb.g / 255 + " " + rgb.b / 255 + " " + 1.0;

        //startDate = toTimeZone(startDate, "EST");
        console.log(startDate);
=======
app.post('/event', (req, res) => {
  let {name, icon, startDate, endDate, details, hostName, locationBuilding, locationRoom} = req.body;
  let locationName = `${locationBuilding} ${locationRoom}`;

  // let location = req.body.location;
  let rgb = hexToRgb(req.body.color);
  let color = `${rgb.r / 255} ${rgb.g / 255} ${rgb.b / 255} 1.0`;
  let location = searchBuildings(locationBuilding);
>>>>>>> 5799b42377dca20d1d551572a16fa4261d181808

  console.log({name, icon, startDate, endDate, details, hostName, locationName, location, color});

<<<<<<< HEAD
    //do some post processing ei. match up Location Name with actual geopoint
      //location = searchBuildings(locationBuilding);
      console.log(req.body.latitude,req.body.longitude);
      location = ""+ req.body.latitude+" , " + req.body.longitude;



    //set geopoint depending on location
    // switch (locationBuilding) {
    //   case "Thayer":
    //     location = ""
    //     break;
    //   case "Straus":
    //     location = ""
    //     break;
    //   default:
    //
    // }

    console.log(name, icon, startDate, endDate, details, hostName, locationName, location, color);
    pg.connect(process.env.DATABASE_URL || database_url , function(err, client, done) {
      client.query('INSERT INTO events(name, icon, startDate, endDate, details, hostName, locationName, location, color, verified, email) values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',[name, icon, startDate, endDate, details, hostName, locationName, location, color, false, email], function(err, result) {
        done();
        if (err)
         { console.error(err); res.send("Error " + err); }
        else
         {
           res.redirect("http://heypeek.com");
         }    //res.send('Inserted into DB'); }
=======
  let query = `INSERT INTO events(name, icon, startDate, endDate, details, hostName, locationName, location, color)
                  values($1, $2, $3, $4, $5, $6, $7, $8, $9)`;
  let arrayParams = [name, icon, startDate, endDate, details, hostName, locationName, location, color];

  db.any(query, arrayParams)
      .then(() => {
        res.send('Inserted into DB');
      }).catch(err => {
        console.error(err);
        res.send(`Error ${err}`);
>>>>>>> 5799b42377dca20d1d551572a16fa4261d181808
      });
});

app.get('/init', (req, res) => {
  db.any('CREATE TABLE locations ( id SERIAL PRIMARY KEY, startDate timestamptz, location POINT, userId TEXT)')
    .then(result => {
      res.send('Database (events) Initialized!');
    }).catch(err => {
      console.error(err);
      res.send(`Error ${err}`);
    });
});

<<<<<<< HEAD
app.get('/hits', function(req, res) {
  res.send({"count":"171"});
});

app.get('/tz', function(req, res) {
  pg.connect(database_url, function(err, client, done) {
    client.query('show timezone', function(err, result) {
      done();
      if (err)
       { console.error(err); res.send("Error " + err); }
      else
       {     res.send(result); }
    });
  });
});

app.get('/est', function(req, res) {
  pg.connect(database_url, function(err, client, done) {
    client.query('SET TIME ZONE \'EST\'', function(err, result) {
      done();
      if (err)
       { console.error(err); res.send("Error " + err); }
      else
       {     res.send(result); }
    });
  });
});

app.get('/now', function(req, res) {
  pg.connect(database_url, function(err, client, done) {
    client.query('SELECT '+req.query.q, function(err, result) {
      done();
      if (err)
       { console.error(err); res.send("Error " + err); }
      else
       {     res.send(result); }
    });
  });
=======
app.get('/hits', (req, res) => {
  res.send({count: config.hitCount});
>>>>>>> 5799b42377dca20d1d551572a16fa4261d181808
});

app.get('/feed', (req, res) => {
  let today = db.any('SELECT * FROM events WHERE startDate > TIMESTAMP \'today\' AND startDate < TIMESTAMP \'tomorrow\' + interval \'4 hours\'');
  let tomorrow = db.any('SELECT * FROM events WHERE startDate >= TIMESTAMP \'tomorrow\' AND startDate < TIMESTAMP \'tomorrow\' + interval \'1 day\'');
  let upcoming = db.any('SELECT * FROM events WHERE startDate >= TIMESTAMP \'tomorrow\' + interval \'1 day\' AND startDate < TIMESTAMP \'tomorrow\' + interval \'7 day\'');

<<<<<<< HEAD
app.get('/feed', function(req, res) {
  console.log("FEED");
  var today = db.query('SELECT * FROM events WHERE startDate > now() AT TIME ZONE \'EST\' - interval \'3 hours\' AND startDate < TIMESTAMP \'tomorrow\' AT TIME ZONE \'EST\' ORDER BY startDate ASC');
  var tomorrow = db.query('SELECT * FROM events WHERE startDate >= TIMESTAMP \'tomorrow\' AT TIME ZONE \'EST\' AND startDate < TIMESTAMP \'tomorrow\' AT TIME ZONE \'EST\' + interval \'1 day\' ORDER BY startDate ASC');
  var upcoming = db.query('SELECT * FROM events WHERE startDate >= TIMESTAMP \'tomorrow\' AT TIME ZONE \'EST\' + interval \'1 day\' AND startDate < TIMESTAMP \'tomorrow\' AT TIME ZONE \'EST\' + interval \'7 day\' ORDER BY startDate ASC');
  Promise.all([today,tomorrow,upcoming])
  .then(function(sections){
    console.log(sections);
    // connection already disposed here
    var payload = {"sectionTitles":["Today","Tomorrow","This Week"],"sections":sections}
    res.send(payload);
  })
  .catch(function(err){
    console.log("err",err);
  });
=======
  Promise
    .all([today, tomorrow, upcoming])
    .then(sections => {
      console.log(sections);
>>>>>>> 5799b42377dca20d1d551572a16fa4261d181808

      let payload = {
        'sectionTitles': ['Today', 'Tomorrow', 'This Week'],
        'sections': sections
      };

      res.send(payload);
    }).catch(err => {
      console.log('err', err);
    });
});

app.get('/db', (req, res) => {
  // THIS IS A HORRIBLE SQL VULNERABILITY, BUT I'M SURE YOU KNOW
  db.any(`SELECT * FROM ${req.query.name}`)
  .then(result => {
    console.log(result['rows']);
    res.send(result.rows);
  }).catch(err => {
    console.error(err);
    res.send(`Error ${err}`);
  });
});

app.get('/drop', (req, res) => {
  // THIS IS A HORRIBLE SQL VULNERABILITY, BUT I'M SURE YOU KNOW
  db.any(`TRUNCATE ${req.query.name}`)
    .then(result => {
      console.log(result['rows']);
      res.send(result.rows);
    }).catch(err => {
      console.error(err);
      res.send(`Error ${err}`);
    });
});

app.get('/delete', (req, res) => {
  db.any(`DELETE FROM ${req.query.name} WHERE id = ${req.query.id}`)
    .then(result => {
      console.log(result['rows']);
      res.send(result.rows);
    }).catch(err => {
      console.error(err);
      res.send(`Error ${err}`);
    });
});

app.get('/analytics_this-is-a-dangerous-hack', function (req, res) {

  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  pg.connect(process.env.DATABASE_URL || database_url, function(err, client, done) {

    client.query(req.query.dbquery, function(err, result) {
      done();
      if (err)
       { console.error(err); res.send("Error " + err); }
      else
       { console.log(result["rows"]);
         res.send(result.rows);}
    });
  });
});

app.listen(process.env.PORT || 8000);
