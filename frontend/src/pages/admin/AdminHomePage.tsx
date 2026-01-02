import React from 'react';
import { useAuth } from '@/context/AuthContext';

const AdminHomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <>
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <p className="text-muted-foreground mt-2">
        Welcome, {user?.first_name || user?.email}.
      </p>
      
      <div className="mt-8">
        {/* Dashboard content will go here */}
        <p>This is the main admin dashboard page.</p>
      </div>
    </>
  );
};

export default AdminHomePage;
