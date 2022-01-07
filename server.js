//importing
import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js';
import Pusher from "pusher";
import cors from 'cors';


//app config
const app = express();
const port = process.env.PORT || 9000

const pusher = new Pusher({
    appId: "1327839",
    key: "f694a9fcf4a7011bc16d",
    secret: "9959f1458f0164aed8c7",
    cluster: "ap2",
    useTLS: true
  });

//db config

const connection_url = 'mongodb+srv://admin:ROjy7ekoJljlbcwM@cluster0.vjba3.mongodb.net/whatsappdb?retryWrites=true&w=majority'
mongoose.connect(connection_url);

const db = mongoose.connection

db.once('open',()=>{
    console.log('db is connected');

    const msgCollection = db.collection('messagecontents')
    const changeStream = msgCollection.watch();

    changeStream.on('change', (change) =>{
        console.log("A changed occured", change);

        if(change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages','inserted',
            {
                name : messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received
            }
            );
        }else{
            console.log('error triggering pusher')
        }
    });
});


//middleware
app.use(express.json());

app.use(cors());


//api routes
app.get('/',(req,res)=>res.status(200).send('hello world'));

app.get('/messages/sync', (req,res)=>{
    Messages.find((err, data)=>{
        if(err){
            res.status(500).send(err)
        }else{
            res.status(200).send(data)
        }
    })
})

app.post('/messages/new',(req, res)=>{
    const dbMessage = req.body;

    Messages.create(dbMessage, (err, data)=>{
        if(err){
            res.status(500).send(err)
        }else{
            res.status(201).send(data)
        }
    })
})

//listen
app.listen(port, ()=>console.log(`listening on localhost:${port}`));