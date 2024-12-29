import express from "express";
import path from "path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import winston from "winston";
import { addAliases } from "module-alias";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import multer from "multer";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
// Load environment variables
dotenv.config();
// Create __dirname and __filename for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Add path aliases
addAliases({
    "@components": path.resolve(__dirname, "../script_folder/components"),
    "@styles": path.resolve(__dirname, "../styles"),
});
// Logger setup
const logger = winston.createLogger({
    level: "info",
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: "server.log" }),
    ],
});
// Database configuration
const DATABASE_PATH = path.resolve(__dirname, "../data_folder/shells_shop.db");
let db = null;
// Async function to connect to SQLite
const connectToDatabase = async () => {
    if (db)
        return db;
    try {
        db = await open({
            filename: DATABASE_PATH,
            driver: sqlite3.Database,
        });
        logger.info("Connected to SQLite database.");
        return db;
    }
    catch (error) {
        logger.error("Failed to connect to SQLite database", { error });
        throw error;
    }
};
// Initialize Express App
const app = express();
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.resolve(__dirname, "../htmls_folder")));
app.use('/htmls', express.static(path.resolve(__dirname, '../htmls_folder')));
app.use('/styles', express.static(path.resolve(__dirname, "../styles")));
app.use('/images', express.static(path.resolve(__dirname, '../images')));
// Rate Limiting Middleware
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { error: "Too many requests, please try again later." },
});
app.use("/api", apiLimiter);
// JWT Authentication Middleware
const authenticateJWT = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    try {
        const user = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
        req.user = user; // Attach user to request object
        next();
    }
    catch (err) {
        res.status(403).json({ error: "Forbidden" });
    }
};
// File Upload Configuration
const upload = multer({ dest: "uploads/" });
app.post("/api/upload", upload.single("file"), (req, res) => {
    res.json({ message: "File uploaded successfully", file: req.file });
});
// Swagger API Documentation
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Shells Shop API",
            version: "1.0.0",
            description: "API documentation for the Shells Shop",
        },
    },
    apis: ["./script_folder/**/*.ts"], // Specify your endpoint files
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
// Products API Endpoint with Pagination
app.get("/api/products", async (req, res) => {
    try {
        const db = await connectToDatabase();
        // Fetch all products without pagination
        const products = await db.all("SELECT * FROM products WHERE stock > 0");
        res.status(200).json(products);
    }
    catch (error) {
        logger.error("Error fetching products", { error });
        res.status(500).json({ error: "Failed to fetch products" });
    }
});
// Health Check Endpoint
app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "OK", message: "Server is running" });
});
// Error Handling Middleware
app.use((err, req, res, next) => {
    logger.error("Unhandled error", { error: err.message });
    res.status(500).json({
        error: "Internal server error",
        message: err.message,
    });
});
// 404 Fallback for Unknown Routes
app.use((req, res) => {
    res.status(404).json({ error: "Page not found" });
});
// Start Server
const PORT = process.env.PORT || 3000;
const startServer = async () => {
    try {
        await connectToDatabase();
        app.listen(PORT, () => {
            logger.info(`Server is running at http://localhost:${PORT}`);
        });
    }
    catch (error) {
        logger.error("Failed to start server", { error });
        process.exit(1);
    }
};
// Graceful Shutdown
const shutdown = async () => {
    logger.info("Initiating server shutdown...");
    if (db) {
        try {
            await db.close();
            logger.info("Database connection closed.");
        }
        catch (error) {
            logger.error("Error closing database connection", { error });
        }
    }
    process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
startServer();