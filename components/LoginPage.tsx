import React, { useState, useEffect } from 'react';
import { Branch } from '../types';
import { login, getAppSetting, register } from '../services/apiService';
import { Logo } from './Logo';

interface LoginPageProps {
  onLoginSuccess: (branch: Branch, token: string, role: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [view, setView] = useState<'login' | 'register'>('login');
  
  // Form fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [branch, setBranch] = useState<Branch>(Branch.MAHASARAKHAM);

  // State management
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [appLogo, setAppLogo] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogo = async () => {
        try {
            const { value } = await getAppSetting('app_logo');
            setAppLogo(value);
        } catch (err) {
            console.log("App logo not found or couldn't be fetched for login page.");
            setAppLogo(null);
        }
    };
    fetchLogo();
  }, []);

  const clearFormState = () => {
    setUsername('');
    setPassword('');
    setNickname('');
    setError('');
  };

  const handleViewChange = (newView: 'login' | 'register') => {
    clearFormState();
    setSuccessMessage('');
    setView(newView);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);
    try {
      const { token, role } = await login(username, password);
      onLoginSuccess(branch, token, role);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !nickname) {
        setError('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
    }
    setError('');
    setSuccessMessage('');
    setIsLoading(true);
    try {
        const response = await register(username, password, nickname);
        setSuccessMessage(response.message || 'ลงทะเบียนสำเร็จ! บัญชีของคุณจะพร้อมใช้งานหลังได้รับการอนุมัติ');
        handleViewChange('login');
    } catch (err: any) {
        setError(err.message || 'เกิดข้อผิดพลาดในการลงทะเบียน');
    } finally {
        setIsLoading(false);
    }
  };

  const BranchButton = ({ value, label }: { value: Branch, label: string }) => (
    <button
      type="button"
      onClick={() => setBranch(value)}
      disabled={isLoading}
      className={`w-full p-3 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
        branch === value
          ? 'text-white shadow'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      } disabled:opacity-50`}
      style={{
        backgroundColor: branch === value ? '#98B6D7' : undefined,
      }}
    >
      {label}
    </button>
  );
  
  const renderLoginForm = () => (
    <form className="space-y-4" onSubmit={handleLoginSubmit}>
        {error && <p className="bg-red-100 text-red-700 p-3 rounded-md text-center text-sm">{error}</p>}
        {successMessage && <p className="bg-green-100 text-green-700 p-3 rounded-md text-center text-sm">{successMessage}</p>}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">เลือกสาขา</label>
            <div className="grid grid-cols-2 gap-3">
                <BranchButton value={Branch.MAHASARAKHAM} label={Branch.MAHASARAKHAM} />
                <BranchButton value={Branch.KALASIN} label={Branch.KALASIN} />
            </div>
        </div>
        <div>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500" placeholder="ชื่อผู้ใช้" disabled={isLoading} aria-label="ชื่อผู้ใช้" />
        </div>
        <div>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500" placeholder="รหัสผ่าน" disabled={isLoading} aria-label="รหัสผ่าน" />
        </div>
        <div>
            <button type="submit" style={{ backgroundColor: '#98B6D7' }} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400" disabled={isLoading}>
                {isLoading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
            </button>
        </div>
        <div className="text-center text-sm">
            <span className="text-gray-600">ยังไม่มีบัญชี? </span>
            <button type="button" onClick={() => handleViewChange('register')} className="font-medium hover:underline" style={{ color: '#7D9AB9' }}>ลงทะเบียน</button>
        </div>
    </form>
  );

  const renderRegisterForm = () => (
    <form className="space-y-4" onSubmit={handleRegisterSubmit}>
        {error && <p className="bg-red-100 text-red-700 p-3 rounded-md text-center text-sm">{error}</p>}
         <div>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500" placeholder="ชื่อผู้ใช้" disabled={isLoading} aria-label="ชื่อผู้ใช้" />
        </div>
        <div>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500" placeholder="รหัสผ่าน" disabled={isLoading} aria-label="รหัสผ่าน" />
        </div>
        <div>
            <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} required className="block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500" placeholder="ชื่อผู้สมัคร (ชื่อเล่น)" disabled={isLoading} aria-label="ชื่อผู้สมัคร (ชื่อเล่น)" />
        </div>
        <div>
            <button type="submit" style={{ backgroundColor: '#98B6D7' }} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400" disabled={isLoading}>
                {isLoading ? 'กำลังลงทะเบียน...' : 'ลงทะเบียน'}
            </button>
        </div>
        <div className="text-center text-sm">
            <span className="text-gray-600">มีบัญชีแล้ว? </span>
            <button type="button" onClick={() => handleViewChange('login')} className="font-medium hover:underline" style={{ color: '#7D9AB9' }}>เข้าสู่ระบบ</button>
        </div>
    </form>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <Logo className="w-48 h-16 mx-auto mb-4" logoSrc={appLogo} />
          <h1 className="text-3xl font-bold text-gray-800">
            {view === 'login' ? 'Test Drive Booker' : 'สร้างบัญชีใหม่'}
          </h1>
          <p className="mt-2 text-gray-600">
            {view === 'login' ? 'ระบบจองคิวทดลองขับ' : 'กรอกข้อมูลเพื่อลงทะเบียน'}
          </p>
        </div>
        
        {view === 'login' ? renderLoginForm() : renderRegisterForm()}
        
        <p className="text-center text-xs text-gray-400 pt-4">
          © 2025 PRIDE AUTO Test Drive application.<br />
          All rights reserved. Version 1.1.4
        </p>
      </div>
    </div>
  );
};

export default LoginPage;