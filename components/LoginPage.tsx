import React, { useState } from 'react';
import { Branch } from '../types';
import { login } from '../services/apiService';

interface LoginPageProps {
  onLoginSuccess: (branch: Branch, token: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password');
  const [branch, setBranch] = useState<Branch>(Branch.MAHASARAKHAM);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const { token } = await login(username, password);
      onLoginSuccess(branch, token);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">Test Drive Booker</h1>
          <p className="mt-2 text-gray-600">กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && <p className="bg-red-100 text-red-700 p-3 rounded-md text-center text-sm">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">เลือกสาขา</label>
            <div className="grid grid-cols-2 gap-3">
              <BranchButton value={Branch.MAHASARAKHAM} label={Branch.MAHASARAKHAM} />
              <BranchButton value={Branch.KALASIN} label={Branch.KALASIN} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ชื่อผู้ใช้</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
              placeholder="admin"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">รหัสผ่าน</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
              placeholder="password"
              disabled={isLoading}
            />
          </div>
          <div>
            <button
              type="submit"
              style={{ backgroundColor: '#98B6D7' }}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
              disabled={isLoading}
            >
              {isLoading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
