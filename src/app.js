import express from 'express';
import cors from "cors";
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv'
dotenv.config()

const server = express();
server.use(express.json())
server.use(cors());

const mongoClient = new MongoClient(process.env.MONGO_URI)
let db
mongoClient.connect(() => {
    db = mongoClient.db('api-uol')
})

/*
let participantes = [
    {
    name: "Pedro", 
    lastStatus: 12313123
    }
]
*/

let historico = [
    /*
    {
    from: 'João',
    to: 'Todos',
    text: 'oi galera',
    type: 'message',
    time: '20:04:37'
    } */
    1,2,3,4,5,6,7,8
]
server.get('/teste', function (req, res){
    console.log(db)
    res.send("ok")
})

server.post('/participants', function (req, res){   
    if (req.body.name === "") return res.status(422).send({erro: "nome invalido"})

    if (!(participantes.find(nomes => nomes.name === req.body.name))){

        //participantes.push(req.body)

        db.collection('participantes').insertOne({
            name: req.body.name
        }).then(r => {
            res.status(201).send({message: "participante inserido com sucesso", id: r.insertedId})
        })

        
        
    } else return res.status(409).send({erro: "nome ja cadastrado"})
       
})

server.get('/participants', function (req, res){

    db.collection('participantes').find().toArray().then(data => {
        res.send(data)
    })
    
})

server.post('/messages', function (req, res){
    const {to, text, type} = req.body
    const {user} = req.headers

    if (to === "" || text === "") return res.status(422).send({erro: "destinatario ou mensagem invalida"})
    if (!(participantes.find(nomes => nomes.name === user))) return res.status(422).send({erro: "usuario invalido"})

    if (type === "message" || type === "private_message"){

        historico.push({
            from: user,
            to: to,
            text: text,
            type: type,
            time: "XX:XX:XX"
        })

        return res.sendStatus(201)
    } else return res.status(422).send({erro: "tipo de mensagem invalida"})
})

server.get('/messages', function (req, res){
    let size = (historico.length - 1)
    let arr = []
    let {limit} = req.query
    let {user} = req.headers

    if (!limit) limit = 100

    for (let i = size; (i > size - limit) && (i >= 0); i--){
        arr.push(historico[i])
    }

    res.send(arr)
})

server.post('/status', function (req, res){
    const {user} = req.headers
    if (!(participantes.find(nomes => nomes.name === user))) return res.status(404).send({erro: "usuario invalido"})
    //atualizar status
    res.sendStatus(200)
})

server.listen(5000, function () {
    console.log("oi console")
});