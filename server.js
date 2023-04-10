const express = require('express');
const mysql = require('mysql');
const app = express();

const PORT = 8080;

app.get('/api', (req, res) => {
    res.send({
        message: "Access API Successfully"
    })
})
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'Honeyaa'
  });
  
  // Kết nối cơ sở dữ liệu
  db.connect((err) => {
    if (err) {
      throw err;
    }
    console.log('MySQL connected');
  });
  
// Get data from /api/user
// Get data from /api/signin
// Get data from /api/signup

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
})