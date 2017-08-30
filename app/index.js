// BASE SETUP
// ==============================================
const express                = require('express');
const app                    = express();
const path                   = require('path');
const exphbs                 = require('express-handlebars');
const bodyParser             = require('body-parser');
const routes                 = require('./routes');

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Configure express to use handlebars templates

//app.engine('handlebars', hbs.engine);
//app.set('view engine', 'handlebars');
app.use(express.static(__dirname + '/bower_components'));
app.set('views', path.join(__dirname, 'views/'));
app.use(express.static(path.join(__dirname, 'public')));

//displays our homepage
app.use(express.static(path.resolve(__dirname, 'views')));
app.get('/', function(req, res){
    res.sendFile(path.join(__dirname, 'pages'));
});
app.use('/iot',routes);

module.exports = app;