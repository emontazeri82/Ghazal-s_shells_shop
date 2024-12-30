import express, { Request, Response, NextFunction } from "express";
import path from "path";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import winston from "winston";
import fs from "fs";
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
let db: Database | null = null;

// Async function to connect to SQLite
const connectToDatabase = async (): Promise<Database> => {
  if (db) return db;
  try {
    db = await open({
      filename: DATABASE_PATH,
      driver: sqlite3.Database,
    });
    logger.info("Connected to SQLite database.");
    return db;
  } catch (error) {
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
app.use('/dist', express.static(path.resolve(__dirname, '../dist')));


// Rate Limiting Middleware
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api", apiLimiter);

// JWT Authentication Middleware
const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
    (req as any).user = user; // Attach user to request object
    next();
  } catch (err) {
    res.status(403).json({ error: "Forbidden" });
  }
};

// File Upload Configuration
const upload = multer({ dest: "uploads/" });
app.post("/api/upload", upload.single("file"), (req: Request, res: Response) => {
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
app.get("/api/products", async (req: Request, res: Response) => {
  try {
      const db = await connectToDatabase();

      // Fetch all products without pagination
      const products = await db.all("SELECT * FROM products WHERE stock > 0");

      res.status(200).json(products);
  } catch (error) {
      logger.error("Error fetching products", { error });
      res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Sync Cart Endpoint
app.post("/api/sync-cart", async (req: Request, res: Response): Promise<void> => {
  const { customerId, sessionId, cart }: { customerId: string; sessionId: string; cart: { id: number; quantity: number }[] } = req.body;

  if (!customerId || !sessionId || !Array.isArray(cart)) {
    res.status(400).json({ message: "Invalid data format" });
    return;
  }

  try {
    const db = await connectToDatabase();

    for (const item of cart) {
      await db.run(
        `INSERT INTO cart (customer_id, session_id, product_id, quantity, timestamp) 
         VALUES (?, ?, ?, ?, ?)`,
        [customerId, sessionId, item.id, item.quantity, new Date().toISOString()]
      );
    }

    res.status(200).json({ message: "Cart synced successfully" });
  } catch (error) {
    logger.error("Error syncing cart", { error });
    res.status(500).json({ error: "Failed to sync cart" });
  }
});
// Save Payment and Shipping Details Endpoint
app.post("/api/save-payment", async (req: Request, res: Response): Promise<void> => {
  const {
    customer_id,
    session_id,
    cart_id,
    total_price,
    payment_status,
    shipping_address,
    billing_address,
    payment_method,
  }: {
    customer_id: number;
    session_id: string;
    cart_id: number;
    total_price: number;
    payment_status: string;
    shipping_address: string;
    billing_address: string;
    payment_method: string;
  } = req.body;

  if (!customer_id || !session_id || !cart_id || !total_price || !shipping_address || !billing_address) {
    // return res.status(400).json({ error: "Invalid request data" });
    return;
  }

  try {
    const db = await connectToDatabase();

    // Insert into customer_payments table
    const result = await db.run(
      `INSERT INTO customer_payments 
      (customer_id, session_id, cart_id, total_price, payment_status, shipping_address, billing_address, payment_method) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customer_id,
        session_id,
        cart_id,
        total_price,
        payment_status || "Pending",
        shipping_address,
        billing_address,
        payment_method || "PayPal",
      ]
    );

    const paymentId = result.lastID; // Get the ID of the inserted payment

    // Optionally insert into shipping_details table if shipping_address is provided
    await db.run(
      `INSERT INTO shipping_details (payment_id, shipping_status) VALUES (?, ?)`,
      [paymentId, "Pending"]
    );

    res.status(200).json({ success: true, payment_id: paymentId });
  } catch (error) {
    logger.error("Error saving payment", { error });
    res.status(500).json({ error: "Failed to save payment data" });
  }
});


// Health Check Endpoint
app.get("/api/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

// Error Handling Middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error("Unhandled error", { error: err.message });
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

// 404 Fallback for Unknown Routes
app.use((req: Request, res: Response) => {
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
  } catch (error) {
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
    } catch (error) {
      logger.error("Error closing database connection", { error });
    }
  }
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

startServer();




