import React, { useState } from 'react';
import { executeSql } from '../services/apiService';

interface SqlEditorViewProps {
    authToken: string;
}

const DEFAULT_QUERY = `-- This script creates the 'car_unavailability' table.
-- This feature allows blocking cars for periods like maintenance or other reasons.
-- Press 'Execute' to run it.

-- Drop the table if it exists to allow for re-running the script
DROP TABLE IF EXISTS car_unavailability;

CREATE TABLE car_unavailability (
    id SERIAL PRIMARY KEY,
    car_id INT NOT NULL,
    branch_id INT NOT NULL,
    unavailability_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    reason TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by_user_id INT NULL,

    FOREIGN KEY (car_id) REFERENCES Cars(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES Branches(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_user_id) REFERENCES Users(id) ON DELETE SET NULL
);

-- Optional: Add an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_car_unavailability_date_branch ON car_unavailability (unavailability_date, branch_id);

-- This query creates the table needed to store app settings like the logo.
DROP TABLE IF EXISTS app_settings;
CREATE TABLE app_settings (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT
);
`;

const SqlEditorView: React.FC<SqlEditorViewProps> = ({ authToken }) => {
    const [query, setQuery] = useState(DEFAULT_QUERY);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleExecute = async () => {
        setIsLoading(true);
        setError(null);
        setResult(null);
        try {
            const data = await executeSql(query, authToken);
            setResult(data);
        } catch (err: any) {
            setError(err.message || "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    const renderResult = () => {
        if (isLoading) {
            return <p className="text-gray-500">Executing query...</p>;
        }
        if (error) {
            return (
                <div>
                    <h3 className="font-bold text-red-600 mb-2">Error</h3>
                    <pre className="bg-red-50 text-red-800 p-4 rounded-md text-sm whitespace-pre-wrap break-all">{error}</pre>
                </div>
            );
        }
        if (result) {
            if (result.rows && result.rows.length > 0) {
                const headers = Object.keys(result.rows[0]);
                return (
                    <div className="overflow-x-auto">
                        <p className="text-sm text-green-700 mb-2">{result.command} completed. {result.rowCount} row(s) returned.</p>
                        <table className="min-w-full divide-y divide-gray-200 border">
                            <thead className="bg-gray-50">
                                <tr>
                                    {headers.map(header => (
                                        <th key={header} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{header}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {result.rows.map((row: any, rowIndex: number) => (
                                    <tr key={rowIndex}>
                                        {headers.map(header => (
                                            <td key={`${rowIndex}-${header}`} className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{JSON.stringify(row[header])}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            }
            return (
                 <div className="bg-green-50 text-green-800 p-4 rounded-md">
                    <p className="font-bold">Success!</p>
                    <p>Command: {result.command}</p>
                    <p>Rows affected: {result.rowCount ?? 'N/A'}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="p-4 md:p-6 space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">SQL Editor</h1>
            <div className="bg-white p-6 rounded-lg shadow border">
                <p className="text-sm text-yellow-700 bg-yellow-50 p-3 rounded-md mb-4 border border-yellow-200">
                    <span className="font-bold">คำเตือน:</span> การดำเนินการในหน้านี้จะส่งผลต่อฐานข้อมูลโดยตรง โปรดใช้ความระมัดระวัง
                </p>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="sql-query" className="block text-sm font-medium text-gray-700 mb-1">SQL Query</label>
                        <textarea
                            id="sql-query"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            rows={15}
                            className="w-full border border-gray-300 rounded-md shadow-sm p-2 font-mono text-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter your SQL query here..."
                        />
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={handleExecute}
                            disabled={isLoading}
                            style={{ backgroundColor: '#7D9AB9' }}
                            className="text-white px-6 py-2 rounded-md hover:opacity-90 disabled:bg-gray-400"
                        >
                            {isLoading ? 'Executing...' : 'Execute'}
                        </button>
                    </div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border min-h-[100px]">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Results</h2>
                {renderResult()}
            </div>
        </div>
    );
};

export default SqlEditorView;
