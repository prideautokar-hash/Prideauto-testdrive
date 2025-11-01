// api/index.ts
// This file acts as the backend server (Vercel Serverless Function)

import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import { createServer, IncomingMessage, ServerResponse } from 'http';

// Initialize PostgreSQL connection pool
// It automatically uses the DATABASE_URL environment variable on Vercel
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

// Use a secret key from environment variables for security
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key-for-local-dev';

// Helper function to parse JSON body from a request
const parseJSONBody = (req: IncomingMessage): Promise<any> => {
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
};

// Middleware to verify JWT
const verifyToken = (req: IncomingMessage): { userId: number } | null => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return null;
        return jwt.verify(token, JWT_SECRET) as { userId: number };
    } catch (error) {
        return null;
    }
};

// Main request handler
const handler = async (req: IncomingMessage, res: ServerResponse) => {
    // Set CORS headers to allow requests from any origin
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Target-Path');

    // Handle OPTIONS preflight request
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }
    
    const targetPath = req.headers['x-target-path'];

    try {
        if (targetPath === 'login' && req.method === 'POST') {
            const { username, password } = await parseJSONBody(req);
            
            const client = await pool.connect();
            try {
                // IMPORTANT: Querying the correct plural table name `public.users`
                const userResult = await client.query('SELECT id, password_hash FROM public.users WHERE username = $1', [username]);
                const user = userResult.rows[0];

                // Using plain text password check as requested
                if (user && user.password_hash === password) {
                    const token = jwt.sign({ userId: user.id, username: username }, JWT_SECRET, { expiresIn: '1d' });
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ token }));
                } else {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }));
                }
            } finally {
                client.release();
            }

        } else if (targetPath === 'bookings') {
            const decoded = verifyToken(req);
            if (!decoded) {
                res.writeHead(403, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Authentication failed' }));
                return;
            }

            const client = await pool.connect();
            try {
                if (req.method === 'GET') {
                    const url = new URL(req.url!, `http://${req.headers.host}`);
                    const branch = url.searchParams.get('branch');

                    const query = `
                        SELECT 
                            b.id, 
                            c.name as "customerName", 
                            c.phone_number as "phoneNumber", 
                            TO_CHAR(b.booking_date, 'YYYY-MM-DD') as date, 
                            b.booking_time as "timeSlot", 
                            cr.model_name as "carModel", 
                            b.notes, 
                            s.name as salesperson, 
                            br.name as branch 
                        FROM public.bookings b
                        JOIN public.customers c ON b.customer_id = c.id
                        JOIN public.cars cr ON b.car_id = cr.id
                        JOIN public.salespeople s ON b.salesperson_id = s.id
                        JOIN public.branches br ON b.branch_id = br.id
                        WHERE br.name = $1
                        ORDER BY b.booking_date, b.booking_time;
                    `;
                    const result = await client.query(query, [branch]);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result.rows));
                } else if (req.method === 'POST') {
                     const { bookingData, branch } = await parseJSONBody(req);
                     const { customerName, phoneNumber, date, timeSlot, carModel, notes, salesperson } = bookingData;
                     const { userId } = decoded;

                     await client.query('BEGIN');

                     // Find branch_id
                     const branchRes = await client.query('SELECT id FROM public.branches WHERE name = $1', [branch]);
                     if (branchRes.rows.length === 0) throw new Error('Branch not found');
                     const branchId = branchRes.rows[0].id;
                    
                     // Find or create customer
                     let customerRes = await client.query('SELECT id FROM public.customers WHERE name = $1', [customerName]);
                     let customerId;
                     if(customerRes.rows.length > 0) {
                         customerId = customerRes.rows[0].id;
                         // Optionally update phone number
                         if(phoneNumber) {
                            await client.query('UPDATE public.customers SET phone_number = $1 WHERE id = $2', [phoneNumber, customerId]);
                         }
                     } else {
                         customerRes = await client.query('INSERT INTO public.customers (name, phone_number) VALUES ($1, $2) RETURNING id', [customerName, phoneNumber]);
                         customerId = customerRes.rows[0].id;
                     }
                    
                     // Find car_id
                     const carRes = await client.query('SELECT id FROM public.cars WHERE model_name = $1', [carModel]);
                     if (carRes.rows.length === 0) throw new Error('Car model not found');
                     const carId = carRes.rows[0].id;

                     // Find or create salesperson
                     let salespersonRes = await client.query('SELECT id FROM public.salespeople WHERE name = $1 AND branch_id = $2', [salesperson, branchId]);
                     let salespersonId;
                     if(salespersonRes.rows.length > 0) {
                         salespersonId = salespersonRes.rows[0].id;
                     } else {
                         salespersonRes = await client.query('INSERT INTO public.salespeople (name, branch_id) VALUES ($1, $2) RETURNING id', [salesperson, branchId]);
                         salespersonId = salespersonRes.rows[0].id;
                     }
                     
                     // Insert booking
                     const newBookingRes = await client.query(
                       `INSERT INTO public.bookings (customer_id, car_id, salesperson_id, branch_id, booking_date, booking_time, notes, created_by_user_id)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
                        [customerId, carId, salespersonId, branchId, date, timeSlot, notes, userId]
                     );

                     await client.query('COMMIT');

                     res.writeHead(201, { 'Content-Type': 'application/json' });
                     res.end(JSON.stringify(newBookingRes.rows[0]));
                }
            } finally {
                client.release();
            }

        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Route not found' }));
        }
    } catch (error) {
        console.error('Server Error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Internal Server Error' }));
    }
};

// Vercel exports the handler
export default createServer(handler);
