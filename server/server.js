//imports
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const metaRoutes = require('./routes/metaRoutes');
const noteRoutes = require('./routes/noteRoutes');

const globalErrorHandler = require('./middleware/errorMiddleware');


//configs
const app = express();

//security & middleware
app.use(helmet()); // Sets security HTTP headers
app.use(express.json()); //parse json body requests
app.use(cors({
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE"]
}));


//MongoDB connection
connectDB();


//routes loader
app.use("/api", authRoutes);
app.use("/api", projectRoutes);
app.use("/api", taskRoutes);
app.use("/api", adminRoutes);
app.use("/api", userRoutes);
app.use('/api', metaRoutes);
app.use('/api/notes', noteRoutes);


//health-check
app.get("/", (req, res) => {
    res.send("API running...")
});


//handle 404 errors for undefined routes
app.use((req, res, next) => {
    res.status(404).json({ message: `Can't find ${req.originalUrl} on this server!` });
});


//error-handler
app.use(globalErrorHandler);


//listen - start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});