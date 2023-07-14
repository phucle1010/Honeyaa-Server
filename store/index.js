const mysql = require('mysql');
require('dotenv').config();

const db = mysql.createPool({
    // host: 'localhost',
    // user: 'root',
    // password: process.env.DATABASE_PASSWORD,
    // database: process.env.DATABASE_NAME,
    // port: '3306',

    // host: 'sql10.freesqldatabase.com',
    // user: 'sql10632404',
    // password: 'FbJ5c1mu1s',
    // database: 'sql10632404',
    // port: '3306',
    host: 'gateway01.us-east-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: '8fQiJvi8jQBZMD3.root',
    password: 'VhRD4nDFPlVlT3hs',
    database: 'honeyaa',
    ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true,
    },
    connectTimeout: 20000,
});

module.exports = db;
