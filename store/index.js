const mysql = require('mysql');
require('dotenv').config()

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
});
// 
// 

module.exports = db;