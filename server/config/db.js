const mongoose = require('mongoose');

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected Successfully");

    } catch (error) {
        console.log("MongoDB Connection Failed", { message: error.message });
        process.exit(1);
    }
};

module.exports = connectDB;