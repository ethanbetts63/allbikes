"use client";

import { LoginForm } from "@/forms/LoginForm";

const LoginPage = () => {
  return (
    <div className="bg-background flex h-full flex-col items-center justify-center py-12">
      <LoginForm className="w-full max-w-lg" />
    </div>
  );
};

export default LoginPage;
