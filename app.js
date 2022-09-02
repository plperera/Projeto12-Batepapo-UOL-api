import express from 'express';
import cors from "cors";

const server = express();

server.use(express.json())
server.use(cors());

server.get('/tweets', function (req, res) {

    let arr = [1, 2]

    res.send("arr")
})


server.listen(5000, function () {
    console.log("oi console")
});