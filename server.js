const express = require('express');

const app = express();

const PORT = 8080;

app.get('/api', (req, res) => {
    res.send({
        message: "Access API Successfully"
    })
})


// Get data from /api/user
// Get data from /api/signin
// Get data from /api/signup

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
})