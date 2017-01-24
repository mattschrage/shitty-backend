import express from 'express';
import bodyParser from 'body-parser';
let pgp = require('pg-promise')();
import Fuse from 'fuse';
import buildings from './buildings.json';
import config from './config';

let db = pgp(config.dbUrl);
let app = express();

let fuse = new Fuse(buildings, {
  caseSensitive: false,
  keys: ['name']
});

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

app.post('/event', (req, res) => {
  let {name, icon, startDate, endDate, details, hostName, locationBuilding, locationRoom} = req.body;
  let locationName = `${locationBuilding} ${locationRoom}`;

  // let location = req.body.location;
  let rgb = hexToRgb(req.body.color);
  let color = `${rgb.r / 255} ${rgb.g / 255} ${rgb.b / 255} 1.0`;
  let location = searchBuildings(locationBuilding);

  console.log({name, icon, startDate, endDate, details, hostName, locationName, location, color});

  let query = `INSERT INTO events(name, icon, startDate, endDate, details, hostName, locationName, location, color)
                  values($1, $2, $3, $4, $5, $6, $7, $8, $9)`;
  let arrayParams = [name, icon, startDate, endDate, details, hostName, locationName, location, color];

  db.any(query, arrayParams)
      .then(() => {
        res.send('Inserted into DB');
      }).catch(err => {
        console.error(err);
        res.send(`Error ${err}`);
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

app.get('/hits', (req, res) => {
  res.send({count: config.hitCount});
});

app.get('/feed', (req, res) => {
  let today = db.any('SELECT * FROM events WHERE startDate > TIMESTAMP \'today\' AND startDate < TIMESTAMP \'tomorrow\' + interval \'4 hours\'');
  let tomorrow = db.any('SELECT * FROM events WHERE startDate >= TIMESTAMP \'tomorrow\' AND startDate < TIMESTAMP \'tomorrow\' + interval \'1 day\'');
  let upcoming = db.any('SELECT * FROM events WHERE startDate >= TIMESTAMP \'tomorrow\' + interval \'1 day\' AND startDate < TIMESTAMP \'tomorrow\' + interval \'7 day\'');

  Promise
    .all([today, tomorrow, upcoming])
    .then(sections => {
      console.log(sections);

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

app.listen(process.env.PORT || 8000);
