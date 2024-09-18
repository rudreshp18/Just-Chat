const mongoose = require("mongoose")

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

        .then(() => console.log('Connected to MongoDB Database'))
        .catch(err => console.error('Could not connect to MongoDB Database', err));
}

module.exports = DbConnect