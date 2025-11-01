import React from 'react';

// A simple, rectangular placeholder logo component.
export const Logo = ({ className }: { className?: string }) => (
    <div className={`bg-white border-2 border-blue-200 rounded-md flex items-center justify-center p-2 ${className}`} style={{ borderColor: '#98B6D7' }}>
        <span className="font-bold text-lg" style={{ color: '#98B6D7' }}>PRIDE AUTO</span>
    </div>
);