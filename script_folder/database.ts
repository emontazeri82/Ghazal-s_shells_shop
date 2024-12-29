import * as sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as dotenv from 'dotenv';


// Load environment variables
dotenv.config();

// Create __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export { __filename, __dirname };

// Database file path from environment or default
const dbFilePath = path.resolve(__dirname, process.env.DATABASE_PATH || '../data_folder/shells_shop.db');
console.log('Database file path:', dbFilePath);

// Function to connect to the database
async function connectToDatabase(): Promise<Database> {
    const db = await open({
        filename: dbFilePath, // Database file location
        driver: sqlite3.Database,
    });
    console.log('Connected to SQLite database.');
    return db;
}

// Function to create tables
async function createProductsTable(db: Database): Promise<void> {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            price REAL NOT NULL CHECK (price >= 0),
            stock INTEGER NOT NULL CHECK (stock >= 0),
            image_url TEXT
        );
    `);
    console.log('Products table created.');
}

async function createCartTable(db: Database): Promise<void> {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS cart (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER,
            session_id TEXT,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL CHECK (quantity > 0),
            added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        );
    `);
    console.log('Cart table created.');
}

async function createCustomerPaymentsTable(db: Database): Promise<void> {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS customer_payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER,
            session_id TEXT,
            cart_id INTEGER NOT NULL,
            total_price REAL NOT NULL,
            payment_status TEXT DEFAULT 'Pending',
            shipping_address TEXT NOT NULL,
            billing_address TEXT NOT NULL,
            payment_method TEXT DEFAULT 'Card',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (cart_id) REFERENCES cart(id) ON DELETE CASCADE
        );
    `);
    console.log('Customer payments table created.');
}

async function createShippingDetailsTable(db: Database): Promise<void> {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS shipping_details (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            payment_id INTEGER NOT NULL,
            tracking_number TEXT,
            carrier TEXT,
            shipping_status TEXT DEFAULT 'Pending',
            shipped_at TIMESTAMP,
            delivered_at TIMESTAMP,
            FOREIGN KEY (payment_id) REFERENCES customer_payments(id) ON DELETE CASCADE
        );
    `);
    console.log('Shipping details table created.');
}

// Wrapper for creating all tables
async function setupDatabase(db: Database): Promise<void> {
    await createProductsTable(db);
    await createCartTable(db);
    await createCustomerPaymentsTable(db);
    await createShippingDetailsTable(db);
    console.log('All tables created successfully.');
}

// Function to insert sample data
async function populateDatabase(db: Database): Promise<void> {
    try {
        await db.exec(`
            INSERT INTO products (name, description, price, stock, image_url) VALUES
            ('Butterfly Shell', 'Beautiful handmade shell decorative', 24.95, 1, '/images/image1.jpg'),
            ('Floral Shell', 'Beautiful handmade shell decorative', 24.95, 1, '/images/image2.jpg'),
            ('Butterfly & Rose Shell', 'Beautiful handmade shell decorative', 24.95, 1, '/images/image3.jpg'),
            ('Floral Shell Set', 'Beautiful handmade shell decorative', 24.95, 1, '/images/image4.jpg'),
            ('Hummingbird Shell', 'Beautiful handmade shell decorative', 24.95, 1, '/images/image5.jpg'),
            ('Hummingbird & Lavender Shell', 'Beautiful handmade shell decorative', 24.95, 1, '/images/image6.jpg'),
            ('Hummingbird with Blue Florals Shell', 'Beautiful handmade shell decorative', 24.95, 1, '/images/image7.jpg'),
            ('Purple Floral Shell', 'Beautiful handmade shell decorative', 24.95, 1, '/images/image8.jpg'),
            ('Hummingbird Shell Set', 'Beautiful handmade shell decorative', 24.95, 1, '/images/image9.jpg'),
            ('Golden Flight', 'Beautiful handmade shell decorative', 24.95, 1, '/images/image10.jpg'),
            ('Vibrant Hummingbird Shell', 'Beautiful handmade shell decorative', 24.95, 1, '/images/image11.jpg'),
            ('Purple Bloom Shell', 'Beautiful handmade shell decorative', 24.95, 1, '/images/image12.jpg'),
            ('Personalized Butterfly Shell', 'Beautiful handmade shell decorative', 24.95, 1, '/images/image13.jpg'),
            ('Watercolor Floral Shell', 'Beautiful handmade shell decorative', 24.95, 1, '/images/image14.jpg'),
            ('Hummingbird Shell2', 'Beautiful handmade shell decorative', 24.95, 1, '/images/image15.jpg');
        `);
        console.log('Sample data added to the database.');
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error populating database:', error.message);
        } else {
            console.error('An unknown error occurred while populating the database:', error);
        }
    }
}

async function main(populate: boolean = false): Promise<void> {
    let db: Database | null = null;
    try {
        db = await connectToDatabase();
        await setupDatabase(db);
        if (populate) {
            await populateDatabase(db);
        }
        console.log('Database setup and population complete.');
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error during database setup and population:', error.message);
        } else {
            console.error('An unknown error occurred:', error);
        }
    } finally {
        if (db) {
            try {
                await db.close();
                console.log('Database connection closed.');
            } catch (closeError) {
                if (closeError instanceof Error) {
                    console.error('Error closing the database connection:', closeError.message);
                } else {
                    console.error('An unknown error occurred while closing the database:', closeError);
                }
            }
        }
    }
}

// Run the script
main(true); // Set to `false` to skip sample data




