// const WebSocket = require('ws');
// const jwt = require('jsonwebtoken')
// // Create a WebSocket server
// const wss = new WebSocket.Server({ port: 8080 });

// // Listen for connections
// wss.on('connection', (ws) => {
//     const token = new URL(req.url, `http://${req.headers.host}`).searchParams.get('token');

//     // console.log('New client connected');

//     // Listen for messages from clients
//     // ws.on('message', (message) => {
//     //     console.log(`Received message => ${message}`);

//     //     // Broadcast the message to all clients
//     //     wss.clients.forEach(client => {
//     //         if (client.readyState === WebSocket.OPEN) {
//     //             client.send(message);
//     //         }
//     //     });
//     // });

//     // // Handle connection close
//     // ws.on('close', () => {
//     //     console.log('Client disconnected');
//     // });
//     try {
//         const user = jwt.verify(token, process.send.JWT_SECRET);
//         ws.user = user; // Attach the user info to the WebSocket instance
//         console.log('User connected:', user);
//     } catch (error) {
//         ws.close(); // Close the connection if the token is invalid
//     }
// });

// console.log('WebSocket server is running on ws://localhost:8080');

// -----------------------WebSocketIo TRY 2-------------------------------//

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const DbConnect = require('./dbConnection');
require('dotenv').config();
const verify = require('./controllers/verify');
const PORT = process.env.PORT || 8080;
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const { getAllUsers } = require('./controllers/userControllers');
const jwtSecret = process.env.JWT_SECRET;
const User = require('./models/userSchema')
const Message = require('./models/messageSchema')
const Group = require('./models/groupSchema')
const app = express();
const server = http.createServer(app);
const activeConnections = new Map();

// WebSocket server
const wss = new WebSocket.Server({ server });

DbConnect();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send("<h1>WebSocket Chat Application</h1>");
});
app.use('/auth', authRoutes)
app.get('/users', verify, getAllUsers)
app.use('/chat', verify, chatRoutes)

// Authenticate WebSocket connection
const authenticateWebSocket = async (token) => {
    try {
        const decoded = jwt.verify(token, jwtSecret);
        const user = await User.findById(decoded.id).select('-password');
        console.log(`User ${user.nickname} connected`);
        return user.nickname;
    } catch (err) {
        return null;
    }
};

wss.on('connection', async (ws, req) => {
    // console.log(`WS Connected`);
    const token = req.url.split('=')?.[1]; // Assuming token is passed as a query parameter
    // const user = authenticateWebSocket(token);
    // if (!user) {
    //     ws.close(1008, 'Authentication failed');
    //     return;
    // }
    let user
    if (!token) {
        ws.close(1008, 'Authentication failed');
        return;
    }
    try {
        const decoded = jwt.verify(token, jwtSecret);
        user = await User.findById(decoded.id);
        // console.log(`User ${user.nickname} connected`);
        activeConnections.set(user._id.toString(), ws);
    }
    catch (error) {
        // console.log("Decode Error", error)
        // console.log("Authentication failed", error)
        ws.close(1008, 'Authentication failed');
        return;
    }

    await User.findByIdAndUpdate(user._id, { active: true, lastActive: new Date() });

    // Broadcasting to all
    broadcastUserList();
    // broadcastGroupList();

    ws.on('message', async (message) => {
        try {
            const parsedMessage = JSON.parse(message);
            const messageString = parsedMessage.content instanceof Buffer ? parsedMessage.content.toString('utf8') : parsedMessage.content;
            console.log(`${user._id}: ${parsedMessage.receiver}`)

            const receiver = await User.findOne({ nickname: parsedMessage.receiver })
            // const receiverZone = await Group.findOne({ zoneName: 'zonePenguin' })
            // console.log(receiver._id)
            const newMessage = new Message({
                sender: user._id,
                receiver: receiver._id,
                content: messageString
            });
            await newMessage.save();

            const receiverWs = activeConnections.get(receiver._id.toString());
            if (receiverWs) {
                receiverWs.send(JSON.stringify({
                    type: 'chat',
                    message: {
                        _id: newMessage._id,
                        sender: user._id,
                        content: messageString,
                        timestamp: newMessage.timestamp
                    }
                }));
            }
            // let arr = [];
            // receiverZone.members.forEach(eac => {
            //     arr.push(eac.toString());
            // });

            // arr.forEach(eac => {
            //     const receiverWs = activeConnections.get(eac);
            //     if (receiverWs) {
            //         receiverWs.send(JSON.stringify({
            //             type: 'chat',
            //             message: {
            //                 _id: newMessage._id,
            //                 sender: user._id,
            //                 content: messageString,
            //                 timestamp: newMessage.timestamp
            //             }
            //         }));
            //     }
            // });

            // if (parsedMessage.type === 'chat') {
            //     const { content } = parsedMessage;

            //     // Save message to database
            //     const newMessage = new Message({
            //         sender: user._id,
            //         receiver: receiver,
            //         content: parsedMessage
            //     });
            //     await newMessage.save();

            //     // Send to receiver if online
            //     const receiverWs = activeConnections.get(receiverId);
            //     if (receiverWs) {
            //         receiverWs.send(JSON.stringify({
            //             type: 'chat',
            //             message: {
            //                 _id: newMessage._id,
            //                 sender: user._id,
            //                 content: content,
            //                 timestamp: newMessage.timestamp
            //             }
            //         }));
            //     }

            //     // Confirm message sent to sender
            //     ws.send(JSON.stringify({
            //         type: 'message_sent',
            //         messageId: newMessage._id
            //     }));
            // }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    })

    // console.log(`User ${userId} connected`);
    // ws.userId = userId;

    // ws.on('message', (message) => {
    //     console.log(`Received message from user ${userId}: ${message}`);

    //     // Parse the message (assuming it's JSON)
    //     try {
    //         const parsedMessage = JSON.parse(message);

    //         // Broadcast the message to all clients or to specific client based on the recipient
    //         wss.clients.forEach(client => {
    //             if (client.readyState === WebSocket.OPEN &&
    //                 (parsedMessage.recipient === 'all' || client.userId === parsedMessage.recipient)) {
    //                 client.send(JSON.stringify({
    //                     sender: userId,
    //                     content: parsedMessage.content,
    //                     timestamp: new Date()
    //                 }));
    //             }
    //         });
    //     } catch (error) {
    //         console.error('Error parsing message:', error);
    //     }
    // });

    ws.on('close', async () => {
        await User.findByIdAndUpdate(user._id, { active: false, lastActive: new Date() });
        broadcastUserList();
        console.log(`Disconnected`);
    });
});

wss.on('listening', () => {
    console.log(`WebSocket server is listening on port ${PORT}`);
});

wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
});

async function broadcastUserList() {
    const users = await User.find();
    const groups = await Group.find();
    // const userList = JSON.stringify({ type: 'userList', users });
    const userGroupList = JSON.stringify({ users, groups });
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(userGroupList);
        }
    });
}

// async function broadcastGroupList() {
//     const groups = await Group.find();
//     const groupList = JSON.stringify({ type: 'groupList', groups });
//     wss.clients.forEach(client => {
//         if (client.readyState === WebSocket.OPEN) {
//             client.send(groupList);
//         }
//     });
// }

server.listen(0, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`WebSocket server integrated on ws://localhost:${PORT}`);
});
