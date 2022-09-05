import express from 'express';
import cors from "cors";
import { MongoClient } from 'mongodb';
import joi from 'joi';
import dotenv from 'dotenv'
import dayjs from 'dayjs'


dotenv.config()

const server = express();
server.use(express.json())
server.use(cors());

let db
const mongoClient = new MongoClient(process.env.MONGO_URI)
mongoClient.connect(() => {
    db = mongoClient.db('api-uol')
})

const participantesSchema = joi.object({
    name: joi.string().required(),
})
const messagesSchema = joi.object({
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().required()  
})

server.get('/teste', async function (req, res) {
    
    try {
        const data = dayjs().locale('pt-br').format('HH:mm:ss')
        res.send(await db.collection('messages').find().toArray())
    } catch (error) {
        res.send("deu nao")
    }
})
server.post('/participants', async function (req, res){   

    const validation = participantesSchema.validate(req.body)
    if (validation.error){
        return res.sendStatus(422)
    }

    const arrayParticipantes = await db.collection('participantes').find().toArray()
    if(arrayParticipantes.find(e => e.name === req.body.name)) return res.sendStatus(409)

    const response = await db.collection('participantes').insertOne({
        name: req.body.name,
        lastStatus: Date.now()
    })

    await db.collection('messages').insertOne({
        from: req.body.name,
        to: 'Todos',
        text: 'entra na sala...',
        type: 'status',
        time: dayjs().locale('pt-br').format('HH:mm:ss'),
    })

    res.status(201).send({message: "participante inserido com sucesso", id: response.insertedId})
  
})

server.get('/participants', async function (req, res){
    try {
        const response = await db.collection('participantes').find().toArray()
        res.send(response.map(value => ({
        ...value,
        _id: undefined
        })))
    } catch (error) {
        res.sendStatus(500)
    }
})

server.post('/messages', function (req, res){

    const validation = messagesSchema.validate(req.body, {abortEarly: false})
    if(validation.error){
        const erros = validation.error.details.map(e => e.message)
        res.status(422).send(erros)
        return
    }
   

    const {to, text, type} = req.body
    const {user} = req.headers

    //if (to === "" || text === "") return res.status(422).send({erro: "destinatario ou mensagem invalida"})
    //if (!(participantes.find(nomes => nomes.name === user))) return res.status(422).send({erro: "usuario invalido"})

    //if (type === "message" || type === "private_message"){

        historico.push({
            from: user,
            to: to,
            text: text,
            type: type,
            time: "XX:XX:XX"
        })

        return res.sendStatus(201)
    //} else return res.status(422).send({erro: "tipo de mensagem invalida"})
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