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
const JWT_SECRET = process.env.JWT_SECRET || 'default-super-secret-key-for-development';

// Helper to parse JSON body from request
async function parseJSONBody(req: IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                if (body === '') return resolve({});
                resolve(JSON.parse(body));
            } catch (error) {
                reject(new Error('Invalid JSON body'));
            }
        });
        req.on('error', (err) => reject(err));
    });
}

// Helper to get user from token
function getUserFromToken(req: IncomingMessage): { userId: number; username: string } | null {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return null;

    try {
        return jwt.verify(token, JWT_SECRET) as { userId: number; username: string };
    } catch (err) {
        return null;
    }
}


// Main request handler
const handler = async (req: IncomingMessage, res: ServerResponse) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Target-Path');

    if (req.method === 'OPTIONS') {
        res.writeHead(204).end();
        return;
    }

    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const targetPath = req.headers['x-target-path'] || '';

    let client;
    try {
        client = await pool.connect();
        try {
            // --- LOGIN ENDPOINT ---
            if (targetPath === 'login' && req.method === 'POST') {
                const { username, password } = await parseJSONBody(req);
                if (!username || !password) {
                    res.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({ message: 'Username and password are required' }));
                    return;
                }
                
                const userResult = await client.query('SELECT id, password_hash FROM public.users WHERE username = $1', [username]);
                const user = userResult.rows[0];

                if (user && user.password_hash === password) {
                    const token = jwt.sign({ userId: user.id, username: username }, JWT_SECRET, { expiresIn: '8h' });
                    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ token }));
                } else {
                    res.writeHead(401, { 'Content-Type': 'application/json' }).end(JSON.stringify({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }));
                }
                return;
            }
            
            // --- BOOKINGS ENDPOINT ---
            if (targetPath === 'bookings') {
                 const userData = getUserFromToken(req);
                 if (!userData) {
                    res.writeHead(401, { 'Content-Type': 'application/json' }).end(JSON.stringify({ message: 'Unauthorized: No token provided' }));
                    return;
                 }

                if (req.method === 'GET') {
                    const branch = url.searchParams.get('branch');
                    if (!branch) {
                        res.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({ message: 'Branch query parameter is required' }));
                        return;
                    }
                    
                    const bookingsResult = await client.query(`
                        SELECT 
                            b.id, b.booking_date as "date", b.booking_time as "timeSlot", b.notes,
                            c.name as "customerName", c.phone_number as "phoneNumber",
                            cr.model_name as "carModel",
                            s.name as "salesperson",
                            br.name as "branch"
                        FROM public.bookings b
                        INNER JOIN public.customers c ON b.customer_id = c.id
                        INNER JOIN public.cars cr ON b.car_id = cr.id
                        INNER JOIN public.salespeople s ON b.salesperson_id = s.id
                        INNER JOIN public.branches br ON b.branch_id = br.id
                        WHERE br.name = $1
                        ORDER BY b.booking_date, b.booking_time
                    `, [branch]);

                    const formattedBookings = bookingsResult.rows.map(b => ({
                        ...b,
                        id: String(b.id),
                        date: new Date(b.date).toISOString().split('T')[0]
                    }));

                    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(formattedBookings));
                    return;
                }
                else if (req.method === 'POST') {
                    const { bookingData, branch } = await parseJSONBody(req);
                    const { customerName, phoneNumber, date, timeSlot, carModel, notes, salesperson } = bookingData;
                    
                    await client.query('BEGIN');

                    let customerResult = await client.query('SELECT id FROM public.customers WHERE name = $1 AND (phone_number = $2 OR ($2 IS NULL AND phone_number IS NULL))', [customerName, phoneNumber || null]);
                    let customerId;
                    if (customerResult.rows.length > 0) {
                        customerId = customerResult.rows[0].id;
                    } else {
                        const newCustomerResult = await client.query('INSERT INTO public.customers (name, phone_number) VALUES ($1, $2) RETURNING id', [customerName, phoneNumber || null]);
                        customerId = newCustomerResult.rows[0].id;
                    }

                    const carResult = await client.query('SELECT id FROM public.cars WHERE model_name = $1', [carModel]);
                    const branchResult = await client.query('SELECT id FROM public.branches WHERE name = $1', [branch]);
                    const salespersonResult = await client.query('SELECT id FROM public.salespeople WHERE name = $1 AND branch_id = $2', [salesperson, branchResult.rows[0]?.id]);

                    if (!carResult.rows[0] || !branchResult.rows[0] || !salespersonResult.rows[0]) {
                        await client.query('ROLLBACK');
                        res.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({ message: 'ข้อมูลรถ, เซลล์, หรือสาขาไม่ถูกต้อง' }));
                        return;
                    }

                    const insertResult = await client.query(
                        `INSERT INTO public.bookings (customer_id, car_id, salesperson_id, branch_id, booking_date, booking_time, notes, created_by_user_id)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
                        [customerId, carResult.rows[0].id, salespersonResult.rows[0].id, branchResult.rows[0].id, date, timeSlot, notes || null, userData.userId]
                    );

                    await client.query('COMMIT');
                    
                    const newBooking = {
                        id: String(insertResult.rows[0].id),
                        customerName, phoneNumber, date, timeSlot, carModel, notes, salesperson, branch
                    };
                    
                    res.writeHead(201, { 'Content-Type': 'application/json' }).end(JSON.stringify(newBooking));
                    return;
                }
            }
            
            res.writeHead(404, { 'Content-Type': 'application/json' }).end(JSON.stringify({ message: `Route Not Found for path: ${targetPath}` }));

        } finally {
            if (client) {
                client.release();
            }
        }
    } catch (error: any) {
        console.error('SERVER ERROR:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' }).end(JSON.stringify({ message: 'Internal Server Error', error: error.message }));
    }
};

export default createServer(handler);
