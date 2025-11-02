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
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';

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
function verifyToken(req: IncomingMessage): { userId: number; username: string } | null {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return null;
    try {
        return jwt.verify(token, JWT_SECRET) as { userId: number, username: string };
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
                    const userResult = await client.query('SELECT id, password_hash FROM public.users WHERE username = $1', [username]);
                    if (userResult.rows.length === 0) {
                        return sendResponse(res, 401, { message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
                    }
                    const user = userResult.rows[0];

                    if (password === user.password_hash) {
                        const isAdmin = username === ADMIN_USERNAME;
                        const token = jwt.sign({ userId: user.id, username: username }, JWT_SECRET, { expiresIn: '8h' });
                        sendResponse(res, 200, { token, isAdmin });
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
                    const result = await client.query(`
                        SELECT 
                            b.id, 
                            c.name as "customerName", 
                            c.phone_number as "phoneNumber",
                            b.booking_date as "date",
                            to_char(b.booking_time, 'HH24:MI') as "timeSlot",
                            cr.model_name as "carModel",
                            cr.id as "carId",
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
                    
                    const formattedRows = result.rows.map(row => ({
                        ...row,
                        date: new Date(row.date).toISOString().split('T')[0]
                    }));

                    sendResponse(res, 200, formattedRows);
                } else if (req.method === 'POST') {
                    const { customerName, phoneNumber, date, timeSlot, carModel, notes, salesperson, branch } = await parseJSONBody(req);
                    
                    const branchResult = await client.query('SELECT id FROM public.branches WHERE name = $1', [branch]);
                    if (branchResult.rows.length === 0) return sendResponse(res, 400, { message: 'Invalid branch' });
                    const branchId = branchResult.rows[0].id;

                    const carResult = await client.query('SELECT id FROM public.cars WHERE model_name = $1', [carModel]);
                    if (carResult.rows.length === 0) return sendResponse(res, 400, { message: 'Invalid car model' });
                    const carId = carResult.rows[0].id;
                    
                    // --- CONFLICT CHECK ---
                    const bookingConflict = await client.query(
                        'SELECT id FROM public.bookings WHERE car_id = $1 AND booking_date = $2 AND booking_time = $3 AND branch_id = $4',
                        [carId, date, timeSlot, branchId]
                    );
                    if (bookingConflict.rows.length > 0) {
                        return sendResponse(res, 409, { message: `รถรุ่นนี้ถูกจองในช่วงเวลา ${timeSlot} แล้ว` });
                    }

                    const unavailabilityConflict = await client.query(
                        `SELECT id FROM public.car_unavailability 
                         WHERE car_id = $1 AND unavailability_date = $2 AND branch_id = $3
                         AND ($4::time, $4::time + '29 minutes'::interval) OVERLAPS (start_time, end_time)`,
                         [carId, date, branchId, timeSlot]
                    );
                    if (unavailabilityConflict.rows.length > 0) {
                        return sendResponse(res, 409, { message: `รถรุ่นนี้ไม่พร้อมใช้งานในช่วงเวลา ${timeSlot}` });
                    }

                    await client.query('BEGIN');

                    let customerResult = await client.query('SELECT id FROM public.customers WHERE name = $1 AND phone_number = $2', [customerName, phoneNumber || null]);
                    let customerId = customerResult.rows.length > 0 ? customerResult.rows[0].id : (await client.query('INSERT INTO public.customers (name, phone_number) VALUES ($1, $2) RETURNING id', [customerName, phoneNumber || null])).rows[0].id;
                    
                    let salespersonResult = await client.query('SELECT id FROM public.salespeople WHERE name = $1 AND branch_id = $2', [salesperson, branchId]);
                    let salespersonId = salespersonResult.rows.length > 0 ? salespersonResult.rows[0].id : (await client.query('INSERT INTO public.salespeople (name, branch_id) VALUES ($1, $2) RETURNING id', [salesperson, branchId])).rows[0].id;

                    const newBookingResult = await client.query(
                        'INSERT INTO public.bookings (customer_id, car_id, salesperson_id, branch_id, booking_date, booking_time, notes, created_by_user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
                        [customerId, carId, salespersonId, branchId, date, timeSlot, notes || null, userData.userId]
                    );

                    await client.query('COMMIT');
                    sendResponse(res, 201, newBookingResult.rows[0]);
                } else if (req.method === 'DELETE') {
                    const { id } = await parseJSONBody(req);
                    if (!id) return sendResponse(res, 400, { message: 'Booking ID is required' });
                    const deleteResult = await client.query('DELETE FROM public.bookings WHERE id = $1', [id]);
                    if (deleteResult.rowCount === 0) return sendResponse(res, 404, { message: 'Booking not found' });
                    sendResponse(res, 200, { message: 'Booking deleted successfully' });
                }
            } catch (err) {
                 await client.query('ROLLBACK');
                 console.error('Bookings DB Error:', err);
                 sendResponse(res, 500, { message: 'Internal Server Error' });
            } finally {
                client.release();
            }
        }
        // --- UNAVAILABILITY ENDPOINT ---
        else if (url.pathname.endsWith('/unavailability')) {
            const userData = verifyToken(req);
            if (!userData) return sendResponse(res, 401, { message: 'Authentication required' });

            const client = await pool.connect();
            try {
                if (req.method === 'GET') {
                    const branch = url.searchParams.get('branch') as Branch;
                    if (!branch) return sendResponse(res, 400, { message: 'Branch is required' });
                    
                    const result = await client.query(`
                        SELECT u.id, c.model_name as "carModel", c.id as "carId", u.unavailability_date as "date", 
                               to_char(u.start_time, 'HH24:MI') as "startTime", 
                               to_char(u.end_time, 'HH24:MI') as "endTime", u.reason
                        FROM public.car_unavailability u
                        JOIN public.cars c ON u.car_id = c.id
                        JOIN public.branches b ON u.branch_id = b.id
                        WHERE b.name = $1
                        ORDER BY u.unavailability_date, u.start_time
                    `, [branch]);

                    const formattedRows = result.rows.map(row => ({
                        ...row,
                        date: new Date(row.date).toISOString().split('T')[0]
                    }));

                    sendResponse(res, 200, formattedRows);

                } else if (req.method === 'POST') {
                    const { carModel, date, period, reason, branch } = await parseJSONBody(req);
                    
                    const carResult = await client.query('SELECT id FROM public.cars WHERE model_name = $1', [carModel]);
                    if (carResult.rows.length === 0) return sendResponse(res, 400, { message: 'Invalid car model' });
                    const carId = carResult.rows[0].id;

                    const branchResult = await client.query('SELECT id FROM public.branches WHERE name = $1', [branch]);
                    if (branchResult.rows.length === 0) return sendResponse(res, 400, { message: 'Invalid branch' });
                    const branchId = branchResult.rows[0].id;
                    
                    let startTime, endTime;
                    if (period === 'morning') {
                        startTime = '08:00'; endTime = '13:00';
                    } else if (period === 'afternoon') {
                        startTime = '13:00'; endTime = '17:00';
                    } else if (period === 'all-day') {
                        startTime = '08:00'; endTime = '17:00';
                    } else {
                        return sendResponse(res, 400, { message: 'Invalid period specified.' });
                    }
                    
                    const newUnavailability = await client.query(
                        `INSERT INTO public.car_unavailability (car_id, branch_id, unavailability_date, start_time, end_time, reason, created_by_user_id)
                         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                         [carId, branchId, date, startTime, endTime, reason, userData.userId]
                    );
                    sendResponse(res, 201, newUnavailability.rows[0]);

                } else if (req.method === 'DELETE') {
                    const { id } = await parseJSONBody(req);
                    if (!id) return sendResponse(res, 400, { message: 'ID is required' });
                    const deleteResult = await client.query('DELETE FROM public.car_unavailability WHERE id = $1', [id]);
                    if (deleteResult.rowCount === 0) return sendResponse(res, 404, { message: 'Record not found' });
                    sendResponse(res, 200, { message: 'Record deleted successfully' });
                }

            } catch(err) {
                 console.error('Unavailability DB Error:', err);
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

                    if (key !== 'app_logo') {
                        const userData = verifyToken(req);
                        if (!userData) return sendResponse(res, 401, { message: 'Authentication required' });
                    }
                    
                    const result = await client.query('SELECT value FROM public.app_settings WHERE key = $1', [key]);
                    if (result.rows.length > 0) {
                        sendResponse(res, 200, result.rows[0]);
                    } else {
                        sendResponse(res, 404, { message: 'Setting not found' });
                    }
                } else if (req.method === 'POST') {
                    const userData = verifyToken(req);
                    if (!userData) return sendResponse(res, 401, { message: 'Authentication required' });
                    const { key, value } = await parseJSONBody(req);
                    if (!key || value === undefined) return sendResponse(res, 400, { message: 'Key and value are required' });
                    
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
        // --- SQL ENDPOINT ---
        else if (url.pathname.endsWith('/sql')) {
            const userData = verifyToken(req);
            if (!userData || userData.username !== ADMIN_USERNAME) {
                return sendResponse(res, 403, { message: 'Forbidden: Admin access required' });
            }

            if (req.method === 'POST') {
                const { query } = await parseJSONBody(req);
                if (!query || typeof query !== 'string') {
                    return sendResponse(res, 400, { message: 'A "query" string is required.' });
                }

                const client = await pool.connect();
                try {
                    const result = await client.query(query);
                    sendResponse(res, 200, {
                        command: result.command,
                        rowCount: result.rowCount,
                        rows: result.rows,
                    });
                } catch (err: any) {
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
