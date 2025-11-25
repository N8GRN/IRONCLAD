const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Endpoint to handle file update requests
app.post('/api/update-file', (req, res) => {
    const fileContent = req.body.content;
    const filePath = path.join(__dirname, 'my-file.txt'); // Path to the file to update

    fs.writeFile(filePath, fileContent, (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error writing to file');
        }
        res.status(200).send('File updated successfully');
    });
});

// Serve a static HTML file for the client
app.use(express.static('public'));

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});