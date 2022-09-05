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
    type: joi.string().valid('message','private_message').required()  
})

server.get('/teste', async function (req, res) {
    
    try {
        const data = dayjs().locale('pt-br').format('HH:mm:ss')
        res.send(await db.collection('message').find().toArray())
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

    await db.collection('participantes').insertOne({
        name: req.body.name,
        lastStatus: Date.now()
    })

    await db.collection('message').insertOne({
        from: req.body.name,
        to: 'Todos',
        text: 'entra na sala...',
        type: 'status',
        time: dayjs().locale('pt-br').format('HH:mm:ss'),
    })

    res.sendStatus(201)//.send({message: "participante inserido com sucesso", id: response.insertedId})
  
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

server.post('/messages', async function (req, res){

    const {to, text, type} = req.body
    const {user} = req.headers

    const validation = messagesSchema.validate(req.body, {abortEarly: false})
    if(validation.error){
        const erros = validation.error.details.map(e => e.message)
        return res.status(422).send(erros)
    }
   
    const arrayParticipantes = await db.collection('participantes').find().toArray()
    if(!(arrayParticipantes.find(e => e.name === user))) return res.sendStatus(422)

    await db.collection('message').insertOne({
        from: user,
        to: to,
        text: text,
        type: type,
        time: dayjs().locale('pt-br').format('HH:mm:ss')
    })
    
    return res.sendStatus(201)  
})

server.get('/messages', async function (req, res){

    const arrayMessage = await db.collection('message').find().toArray()
    
    let size = (arrayMessage.length - 1)
    let arr = []
    let {limit} = req.query
    let {user} = req.headers

    if (!limit) limit = 100

    for (let i = size; (i > size - limit) && (i >= 0); i--){
        if (arrayMessage[i].type === "private_message"){

            if(user === arrayMessage[i].to || user === arrayMessage[i].from) arr.push(arrayMessage[i])
            else (limit++)
            
        } else arr.push({...arrayMessage[i], _id: undefined})
    }
    
    res.send(arr.reverse())
})

server.post('/status', async function (req, res){

    const {user} = req.headers

    const arrayParticipantes = await db.collection('participantes').find().toArray()
    if(!(arrayParticipantes.find(e => e.name === user))) return res.sendStatus(404)

    db.collection('participantes').deleteOne({ name: user})
    //atualizar status
    const response = await db.collection('participantes').insertOne({
        name: user,
        lastStatus: Date.now()
    })
    res.sendStatus(200)
})

setInterval(async function () {
    const arrayParticipantes = await db.collection('participantes').find().toArray()
    const time = Date.now() - (10*1000)
    console.log("executei")
    console.log(time)

    
    arrayParticipantes.map((e) => {
        if (e.lastStatus <= time){ 
            
            db.collection('message').insertOne({
                from: e.name,
                to: 'Todos',
                text: 'sai da sala...',
                type: 'status',
                time: dayjs().locale('pt-br').format('HH:mm:ss')
            })
            
            db.collection('participantes').deleteOne({ _id: e._id })
        }
    })
}, 15000);



server.listen(5000, function () {
    console.log("oi console")
});