import React from 'react';
import { useAuth } from '@/context/AuthContext';

const AdminHomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <>
      <h1 className="text-3xl font-bold text-[var(--text-primary)]">Admin Dashboard</h1>
      <p className="text-[var(--text-primary)] mt-2">
        Welcome, {user?.first_name || user?.email}.
      </p>
      
      <div className="mt-8 text-[var(--text-secondary)]">
        <p>This is the main admin dashboard page.</p>
      </div>
    </>
  );
};

export default AdminHomePage;
