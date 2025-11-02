import { createServer, IncomingMessage, ServerResponse } from 'http';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import { Branch } from '../types';

// Initialize the connection pool using the environment variable
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-for-dev';

// Helper function to parse JSON body
async function parseJSONBody(req: IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                if (body) {
                    resolve(JSON.parse(body));
                } else {
                    resolve({}); // Resolve with empty object for requests with no body
                }
            } catch (e) {
                reject(new Error('Invalid JSON body'));
            }
        });
        req.on('error', (err) => reject(err));
    });
}

// Helper to handle responses
function sendResponse(res: ServerResponse, statusCode: number, data: any) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify(data));
}

// Helper to verify JWT token
function verifyToken(req: IncomingMessage): { userId: string } | null {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return null;
    try {
        return jwt.verify(token, JWT_SECRET) as { userId: string };
    } catch (e) {
        return null;
    }
}

// Main server handler
const handler = async (req: IncomingMessage, res: ServerResponse) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        });
        res.end();
        return;
    }

    const url = new URL(req.url || '', `http://${req.headers.host}`);

    try {
        // --- LOGIN ENDPOINT ---
        if (url.pathname.endsWith('/login')) {
            if (req.method === 'POST') {
                const { username, password } = await parseJSONBody(req);
                if (!username || !password) {
                    return sendResponse(res, 400, { message: 'Username and password are required' });
                }

                const client = await pool.connect();
                try {
                    // Using public.users as confirmed table name
                    const userResult = await client.query('SELECT id, password_hash FROM public.users WHERE username = $1', [username]);
                    if (userResult.rows.length === 0) {
                        return sendResponse(res, 401, { message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
                    }
                    const user = userResult.rows[0];

                    // --- PLAIN TEXT PASSWORD CHECK (as requested) ---
                    // WARNING: In a real production environment, use bcrypt.compare()
                    if (password === user.password_hash) {
                        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '8h' });
                        sendResponse(res, 200, { token });
                    } else {
                        sendResponse(res, 401, { message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
                    }
                } finally {
                    client.release();
                }
            }
        } 
        // --- BOOKINGS ENDPOINT ---
        else if (url.pathname.endsWith('/bookings')) {
             const userData = verifyToken(req);
             if (!userData) {
                 return sendResponse(res, 401, { message: 'Authentication required' });
             }

            const client = await pool.connect();
            try {
                if (req.method === 'GET') {
                    const branch = url.searchParams.get('branch') as Branch;
                    if (!branch) {
                        return sendResponse(res, 400, { message: 'Branch is required' });
                    }
                    // Corrected table names to plural
                    const result = await client.query(`
                        SELECT 
                            b.id, 
                            c.name as "customerName", 
                            c.phone_number as "phoneNumber",
                            b.booking_date as "date",
                            to_char(b.booking_time, 'HH24:MI') as "timeSlot",
                            cr.model_name as "carModel",
                            b.notes,
                            s.name as "salesperson",
                            br.name as "branch"
                        FROM public.bookings b
                        JOIN public.customers c ON b.customer_id = c.id
                        JOIN public.cars cr ON b.car_id = cr.id
                        JOIN public.salespeople s ON b.salesperson_id = s.id
                        JOIN public.branches br ON b.branch_id = br.id
                        WHERE br.name = $1
                        ORDER BY b.booking_date, b.booking_time
                    `, [branch]);
                    
                    // Format date to YYYY-MM-DD
                    const formattedRows = result.rows.map(row => ({
                        ...row,
                        date: new Date(row.date).toISOString().split('T')[0]
                    }));

                    sendResponse(res, 200, formattedRows);
                } else if (req.method === 'POST') {
                    const { customerName, phoneNumber, date, timeSlot, carModel, notes, salesperson, branch } = await parseJSONBody(req);
                    
                    // Get IDs for foreign keys and validate inputs
                    const branchResult = await client.query('SELECT id FROM public.branches WHERE name = $1', [branch]);
                    if (branchResult.rows.length === 0) {
                        return sendResponse(res, 400, { message: 'Invalid branch' });
                    }
                    const branchId = branchResult.rows[0].id;

                    const carResult = await client.query('SELECT id FROM public.cars WHERE model_name = $1', [carModel]);
                    if (carResult.rows.length === 0) {
                        return sendResponse(res, 400, { message: 'Invalid car model' });
                    }
                    const carId = carResult.rows[0].id;
                    
                    // Check for conflicting bookings
                    const conflictCheckResult = await client.query(
                        'SELECT id FROM public.bookings WHERE car_id = $1 AND booking_date = $2 AND booking_time = $3 AND branch_id = $4',
                        [carId, date, timeSlot, branchId]
                    );
                
                    if (conflictCheckResult.rows.length > 0) {
                        return sendResponse(res, 409, { message: `รถรุ่นนี้ถูกจองในช่วงเวลา ${timeSlot} แล้ว` });
                    }

                    await client.query('BEGIN');

                    // Find or create customer
                    let customerResult = await client.query('SELECT id FROM public.customers WHERE name = $1 AND phone_number = $2', [customerName, phoneNumber || null]);
                    let customerId;
                    if (customerResult.rows.length > 0) {
                        customerId = customerResult.rows[0].id;
                    } else {
                        customerResult = await client.query('INSERT INTO public.customers (name, phone_number) VALUES ($1, $2) RETURNING id', [customerName, phoneNumber || null]);
                        customerId = customerResult.rows[0].id;
                    }
                    
                    // Find or create salesperson
                    let salespersonResult = await client.query('SELECT id FROM public.salespeople WHERE name = $1 AND branch_id = $2', [salesperson, branchId]);
                     let salespersonId;
                    if (salespersonResult.rows.length > 0) {
                        salespersonId = salespersonResult.rows[0].id;
                    } else {
                        salespersonResult = await client.query('INSERT INTO public.salespeople (name, branch_id) VALUES ($1, $2) RETURNING id', [salesperson, branchId]);
                        salespersonId = salespersonResult.rows[0].id;
                    }

                    const newBookingResult = await client.query(
                        'INSERT INTO public.bookings (customer_id, car_id, salesperson_id, branch_id, booking_date, booking_time, notes, created_by_user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
                        [customerId, carId, salespersonId, branchId, date, timeSlot, notes || null, userData.userId]
                    );

                    await client.query('COMMIT');
                    sendResponse(res, 201, newBookingResult.rows[0]);
                } else if (req.method === 'DELETE') {
                    const { id } = await parseJSONBody(req);
                    if (!id) {
                        return sendResponse(res, 400, { message: 'Booking ID is required' });
                    }
                    const deleteResult = await client.query('DELETE FROM public.bookings WHERE id = $1', [id]);
                    if (deleteResult.rowCount === 0) {
                        return sendResponse(res, 404, { message: 'Booking not found' });
                    }
                    sendResponse(res, 200, { message: 'Booking deleted successfully' });
                }
            } catch (err) {
                 await client.query('ROLLBACK');
                 console.error('Database Error:', err);
                 sendResponse(res, 500, { message: 'Internal Server Error' });
            } finally {
                client.release();
            }
        }
        // --- SETTINGS ENDPOINT ---
        else if (url.pathname.endsWith('/settings')) {
            const client = await pool.connect();
            try {
                if (req.method === 'GET') {
                    const key = url.searchParams.get('key');
                    if (!key) return sendResponse(res, 400, { message: 'Setting key is required' });

                    // Allow public access for 'app_logo'
                    if (key !== 'app_logo') {
                        const userData = verifyToken(req);
                        if (!userData) {
                            return sendResponse(res, 401, { message: 'Authentication required' });
                        }
                    }
                    
                    const result = await client.query('SELECT value FROM public.app_settings WHERE key = $1', [key]);
                    if (result.rows.length > 0) {
                        sendResponse(res, 200, result.rows[0]);
                    } else {
                        sendResponse(res, 404, { message: 'Setting not found' });
                    }
                } else if (req.method === 'POST') {
                    // POST requests (updating settings) must be authenticated
                    const userData = verifyToken(req);
                    if (!userData) {
                        return sendResponse(res, 401, { message: 'Authentication required' });
                    }

                    const { key, value } = await parseJSONBody(req);
                    if (!key || value === undefined) {
                        return sendResponse(res, 400, { message: 'Key and value are required' });
                    }
                    // UPSERT operation
                    await client.query(
                        `INSERT INTO public.app_settings (key, value) VALUES ($1, $2)
                         ON CONFLICT (key) DO UPDATE SET value = $2`,
                        [key, value]
                    );
                    sendResponse(res, 200, { key, value });
                }
            } catch (err) {
                console.error('Settings DB Error:', err);
                sendResponse(res, 500, { message: 'Internal Server Error' });
            } finally {
                client.release();
            }
        }
        // FIX: Add /sql endpoint for the SQL Editor view.
        else if (url.pathname.endsWith('/sql')) {
            const userData = verifyToken(req);
            if (!userData) {
                return sendResponse(res, 401, { message: 'Authentication required' });
            }

            if (req.method === 'POST') {
                const { query } = await parseJSONBody(req);
                if (!query || typeof query !== 'string') {
                    return sendResponse(res, 400, { message: 'A "query" string is required in the request body.' });
                }

                const client = await pool.connect();
                try {
                    const result = await client.query(query);
                    // Return the result in a format expected by the frontend
                    sendResponse(res, 200, {
                        command: result.command,
                        rowCount: result.rowCount,
                        rows: result.rows,
                    });
                } catch (err: any) {
                    // Forward database errors to the client for display in the UI
                    console.error('SQL Execution Error:', err);
                    sendResponse(res, 400, { message: err.message });
                } finally {
                    client.release();
                }
            } else {
                sendResponse(res, 405, { message: 'Method Not Allowed' });
            }
        }
        else {
            sendResponse(res, 404, { message: 'Not Found' });
        }
    } catch (err: any) {
        console.error('Request Error:', err);
        sendResponse(res, 500, { message: err.message || 'An unknown error occurred' });
    }
};

export default handler;