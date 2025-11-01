// api/index.ts
// This file acts as the backend server (Vercel Serverless Function)

import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { Booking, Branch } from '../types';

// Initialize PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-for-dev';

// Helper to parse JSON body from request
async function parseJSONBody(req: IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch (error) {
                reject(error);
            }
        });
    });
}

// Main request handler
const handler = async (req: IncomingMessage, res: ServerResponse) => {
    // Set CORS headers to allow requests from the frontend
    res.setHeader('Access-Control-Allow-Origin', '*'); // Adjust in production
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204).end();
        return;
    }
    
    const url = new URL(req.url || '', `http://${req.headers.host}`);

    try {
        // --- LOGIN ENDPOINT ---
        if (url.pathname.endsWith('/login')) {
            if (req.method === 'POST') {
                const { username, password } = await parseJSONBody(req);

                const client = await pool.connect();
                try {
                    const userResult = await client.query('SELECT id, password_hash FROM Users WHERE username = $1', [username]);
                    const user = userResult.rows[0];

                    if (user && user.password_hash === password) { // Plain text comparison
                        const token = jwt.sign({ userId: user.id, username: username }, JWT_SECRET, { expiresIn: '8h' });
                        res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ token }));
                    } else {
                        res.writeHead(401, { 'Content-Type': 'application/json' }).end(JSON.stringify({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }));
                    }
                } finally {
                    client.release();
                }
            }
        }
        // --- BOOKINGS ENDPOINT ---
        else if (url.pathname.endsWith('/bookings')) {
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];

            if (!token) {
                return res.writeHead(401, { 'Content-Type': 'application/json' }).end(JSON.stringify({ message: 'Unauthorized' }));
            }

            try {
                jwt.verify(token, JWT_SECRET);
            } catch (err) {
                 return res.writeHead(403, { 'Content-Type': 'application/json' }).end(JSON.stringify({ message: 'Invalid token' }));
            }
            
            const client = await pool.connect();
            try {
                 if (req.method === 'GET') {
                    const branch = url.searchParams.get('branch');
                    if (!branch) {
                        return res.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({ message: 'Branch is required' }));
                    }
                    
                    const bookingsResult = await client.query(`
                        SELECT 
                            b.id, b.date, b.time_slot as "timeSlot", b.notes,
                            c.name as "customerName", c.phone_number as "phoneNumber",
                            cr.model_name as "carModel",
                            s.name as "salesperson",
                            br.name as "branch"
                        FROM Bookings b
                        JOIN Customers c ON b.customer_id = c.id
                        JOIN Cars cr ON b.car_id = cr.id
                        JOIN Salespeople s ON b.salesperson_id = s.id
                        JOIN Branches br ON b.branch_id = br.id
                        WHERE br.name = $1
                    `, [branch]);

                    // Convert date to YYYY-MM-DD format
                    const formattedBookings = bookingsResult.rows.map(b => ({
                        ...b,
                        date: new Date(b.date).toISOString().split('T')[0]
                    }))

                    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(formattedBookings));
                }
                else if (req.method === 'POST') {
                    const { bookingData, branch } = await parseJSONBody(req);

                    await client.query('BEGIN');

                    // Find or create customer
                    let customerResult = await client.query('SELECT id FROM Customers WHERE name = $1 AND phone_number = $2', [bookingData.customerName, bookingData.phoneNumber || null]);
                    let customerId;
                    if (customerResult.rows.length > 0) {
                        customerId = customerResult.rows[0].id;
                    } else {
                        customerResult = await client.query('INSERT INTO Customers (name, phone_number) VALUES ($1, $2) RETURNING id', [bookingData.customerName, bookingData.phoneNumber || null]);
                        customerId = customerResult.rows[0].id;
                    }

                    // Get IDs for car, salesperson, branch
                    const carResult = await client.query('SELECT id FROM Cars WHERE model_name = $1', [bookingData.carModel]);
                    const branchResult = await client.query('SELECT id FROM Branches WHERE name = $1', [branch]);
                    
                    // Simple salesperson lookup by name and branch
                    const salespersonResult = await client.query('SELECT id FROM Salespeople WHERE name = $1 AND branch_id = $2', [bookingData.salesperson, branchResult.rows[0].id]);

                    if (carResult.rows.length === 0 || salespersonResult.rows.length === 0 || branchResult.rows.length === 0) {
                         await client.query('ROLLBACK');
                         return res.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({ message: 'Invalid car, salesperson, or branch' }));
                    }

                    const carId = carResult.rows[0].id;
                    const salespersonId = salespersonResult.rows[0].id;
                    const branchId = branchResult.rows[0].id;

                    const decodedToken = jwt.verify(token, JWT_SECRET) as { userId: number };
                    
                    const insertResult = await client.query(
                        `INSERT INTO Bookings (customer_id, car_id, salesperson_id, branch_id, booking_date, booking_time, notes, created_by_user_id)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
                        [customerId, carId, salespersonId, branchId, bookingData.date, bookingData.timeSlot, bookingData.notes || null, decodedToken.userId]
                    );
                    
                    await client.query('COMMIT');
                    res.writeHead(201, { 'Content-Type': 'application/json' }).end(JSON.stringify(insertResult.rows[0]));
                }
            } finally {
                client.release();
            }
        }
        else {
            res.writeHead(404, { 'Content-Type': 'application/json' }).end(JSON.stringify({ message: 'Not Found' }));
        }
    } catch (error) {
        console.error('Server Error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' }).end(JSON.stringify({ message: 'Internal Server Error' }));
    }
};

// Vercel exports the handler
export default createServer(handler);
