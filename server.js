const express = require('express');
const app = express();
const route = require('./routes')

app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));

const PORT = 8000;

route(app);

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
})