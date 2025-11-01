// api/index.ts
// Mock implementation of the API for the Test Drive Booker application.

import type { IncomingMessage, ServerResponse } from 'http';
import { Booking, Branch, CarModel } from '../types';

// In-memory store for bookings.
// Using some initial data for demonstration purposes.
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

// Helper to parse the body of a request
async function parseJSONBody(req: IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                resolve(JSON.parse(body || '{}'));
            } catch (e) {
                resolve({});
            }
        });
        req.on('error', err => reject(err));
    });
}

// Main handler for all API requests
export default async function handler(req: IncomingMessage, res: ServerResponse) {
    // Set CORS headers to allow requests from the frontend
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
                if (username === 'admin' && password === 'password') {
                    res.writeHead(200).end(JSON.stringify({ token: 'fake-jwt-token' }));
                } else {
                    res.writeHead(401).end(JSON.stringify({ message: 'Invalid credentials' }));
                }
            } else {
                res.writeHead(405).end(JSON.stringify({ message: 'Method Not Allowed' }));
            }
        } else if (url.pathname.endsWith('/bookings')) {
            const token = req.headers.authorization?.split(' ')[1];
            if (token !== 'fake-jwt-token') {
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
