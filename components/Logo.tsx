import React, { useRef } from 'react';

interface LogoProps {
    className?: string;
    logoSrc?: string | null;
    onUpload?: (base64String: string) => void;
}

export const Logo: React.FC<LogoProps> = ({ className, logoSrc, onUpload }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleLogoClick = () => {
        if (onUpload) {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && onUpload) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                alert("ไฟล์รูปภาพต้องมีขนาดไม่เกิน 2MB");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                onUpload(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const isClickable = !!onUpload;

    return (
        <div 
            className={`flex items-center justify-center overflow-hidden group relative ${className} ${isClickable ? 'cursor-pointer' : ''} rounded-lg`}
            onClick={handleLogoClick}
            title={isClickable ? "คลิกเพื่อเปลี่ยนโลโก้" : ""}
        >
            {logoSrc ? (
                 <img src={logoSrc} alt="Company Logo" className="h-full w-full object-contain" />
            ) : (
                <div className={`w-full h-full bg-white border-2 border-blue-200 rounded-lg flex items-center justify-center p-2`} style={{ borderColor: '#98B6D7' }}>
                    <span className="font-bold text-lg whitespace-nowrap" style={{ color: '#98B6D7' }}>PRIDE AUTO</span>
                </div>
            )}
            
            {isClickable && (
                <>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center rounded-lg">
                        <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">เปลี่ยนโลโก้</span>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/png, image/jpeg, image/gif, image/svg+xml"
                    />
                </>
            )}
        </div>
    );
};