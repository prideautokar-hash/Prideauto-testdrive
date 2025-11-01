// api/index.ts
// Mock API implementation with simple, non-secure password handling for convenience.
// WARNING: This method is INSECURE and MUST NOT be used in a real production application.

import type { IncomingMessage, ServerResponse } from 'http';
import { Booking, Branch, CarModel } from '../types';

// In-memory store for bookings.
let bookings: Booking[] = [
    {
        id: '1',
        customerName: 'John Doe',
        phoneNumber: '1234567890',
        date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0], // tomorrow
        timeSlot: '10:00',
        carModel: CarModel.SEAL_PERF,
        notes: 'Wants to test acceleration.',
        salesperson: 'Alice',
        branch: Branch.MAHASARAKHAM,
    },
    {
        id: '2',
        customerName: 'Jane Smith',
        phoneNumber: '0987654321',
        date: new Date().toISOString().split('T')[0], // today
        timeSlot: '14:00',
        carModel: CarModel.ATTO3,
        notes: '',
        salesperson: 'Bob',
        branch: Branch.KALASIN,
    },
     {
        id: '3',
        customerName: 'Peter Jones',
        phoneNumber: '5555555555',
        date: new Date().toISOString().split('T')[0], // today
        timeSlot: '10:00',
        carModel: CarModel.DOLPHIN,
        notes: 'Interested in city driving.',
        salesperson: 'Alice',
        branch: Branch.MAHASARAKHAM,
    },
];
let nextId = 4;

async function parseJSONBody(req: IncomingMessage): Promise<any> {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => resolve(JSON.parse(body || '{}')));
    });
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

    if (req.method === 'OPTIONS') {
        res.writeHead(204).end();
        return;
    }

    const url = new URL(req.url!, `http://${req.headers.host}`);
    res.setHeader('Content-Type', 'application/json');

    try {
        if (url.pathname.endsWith('/login')) {
            if (req.method === 'POST') {
                const { username, password } = await parseJSONBody(req);
                
                // WARNING: INSECURE plaintext password check for demonstration purposes ONLY.
                // In a real application, you MUST hash passwords using a library like bcrypt.
                if (username === 'admin' && password === 'password') {
                    res.writeHead(200).end(JSON.stringify({ token: 'fake-jwt-token-plaintext-verified' }));
                } else {
                    res.writeHead(401).end(JSON.stringify({ message: 'Invalid credentials' }));
                }
            } else {
                 res.writeHead(405).end(JSON.stringify({ message: 'Method Not Allowed' }));
            }
        } else if (url.pathname.endsWith('/bookings')) {
            const token = req.headers.authorization?.split(' ')[1];
            // Check for the new token from the insecure login
            if (!token || !token.startsWith('fake-jwt-token')) {
                res.writeHead(401).end(JSON.stringify({ message: 'Unauthorized' }));
                return;
            }

            if (req.method === 'GET') {
                const branch = url.searchParams.get('branch') as Branch;
                if (!branch || !Object.values(Branch).includes(branch)) {
                     res.writeHead(400).end(JSON.stringify({ message: 'Valid branch query parameter is required' }));
                     return;
                }
                const branchBookings = bookings.filter(b => b.branch === branch);
                res.writeHead(200).end(JSON.stringify(branchBookings));
            } else if (req.method === 'POST') {
                const newBookingData = await parseJSONBody(req);
                const newBooking: Booking = { ...newBookingData, id: String(nextId++) };
                bookings.push(newBooking);
                res.writeHead(201).end(JSON.stringify(newBooking));
            } else {
                res.writeHead(405).end(JSON.stringify({ message: 'Method Not Allowed' }));
            }
        } else {
            res.writeHead(404).end(JSON.stringify({ message: 'Not Found' }));
        }
    } catch (error) {
        console.error(error);
        res.writeHead(500).end(JSON.stringify({ message: 'Internal Server Error' }));
    }
}
