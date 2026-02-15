const express = require('express');
//const pool = require('./db.js');
const port = 5001;

const app = express();
const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});