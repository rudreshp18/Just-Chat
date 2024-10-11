const mongoose = require("mongoose")
const User = require('./models/userSchema')
// const { broadcastUserList } = require('./index')

function DbConnect() {
    const dbkey = process.env.MONGO_DB_API

    mongoose.connect(dbkey, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })

        // const db = mongoose.connection

        // db.on("error", console.error.bind("Database Plugin Error"))

        // db.once("open", () => {
        //     console.log("Database Plugged IN")
        // })

        .then(() => {
            console.log('Connected to MongoDB Database')
            // const userChangeStream = User.watch();

            // userChangeStream.on('change', async (change) => {
            //     console.log('User change detected:', change);
            //     await broadcastUserList(); // Broadcast the updated user list
            // });
        })
        .catch(err => console.error('Could not connect to MongoDB Database', err));
}

module.exports = DbConnect