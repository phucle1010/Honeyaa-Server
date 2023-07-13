const mysql = require('mysql');
require('dotenv').config();

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    port: '3306',

    // host: 'sql10.freesqldatabase.com',
    // user: 'sql10632404',
    // password: 'FbJ5c1mu1s',
    // database: 'sql10632404',
    // port: '3306',
});

module.exports = db;
