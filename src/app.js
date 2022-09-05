import express from 'express';
import cors from "cors";

const server = express();

server.use(express.json())
server.use(cors());

//colocar do MongoDB 
let participantes = [
    {
    name: "Pedro", 
    lastStatus: 12313123
    }
]

let historico = [{
    from: 'João',
    to: 'Todos',
    text: 'oi galera',
    type: 'message',
    time: '20:04:37'
}]


server.post('/participants', function (req, res){
    
    if (req.body.name === "") return res.status(422).send({erro: "nome invalido"})

    if (!(participantes.find(nomes => nomes.name === req.body.name))){

        participantes.push(req.body)
        res.sendStatus(201)
        
    } else return res.status(409).send({erro: "nome ja cadastrado"})
       
})

server.get('/participants', function (req, res){
    res.send(participantes)
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
    res.send(historico)
})

server.listen(5000, function () {
    console.log("oi console")
});