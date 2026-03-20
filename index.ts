import express from 'express';

import { Server } from 'socket.io';

import {createServer} from "https";

const app = express();

const server = createServer(app);

const socketio = new Server(server, {
    cors:{origin:['http://localhost:3000']}
});

socketio.on('connection', (socket)=>{
    console.log(socket.data);
    socket.on("hello", (args)=>{
        console.log(args);
    });
})

server.listen(2137, ()=>{
    console.log("tuto bene !");
})

