"use client"

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/utils/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/AuthContext";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const navigate = useNavigate();
  const { loginWithPassword } = useAuth();

  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setNotification(null);
    try {
      await loginWithPassword(email, password);
      setNotification({ message: "Login successful!", type: 'success' });
      // On success, navigate to the admin dashboard
      navigate('/admin/inventory');
    } catch (error) {
      console.error("Login failed", error);
      setNotification({ message: "Login Failed: Please check your email and password and try again.", type: 'error' });
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex justify-center items-center h-full", className)} {...props}>
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
          <CardDescription>Enter your credentials to access the admin dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          {notification && (
            <Alert variant={notification.type === 'error' ? 'destructive' : 'default'} className="mb-4">
              <AlertDescription>{notification.message}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="admin@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                autoComplete="current-password"
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Spinner className="mr-2 h-4 w-4" />
                  <span>Logging In...</span>
                </div>
              ) : (
                "Login"
              )}
            </Button>
            
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
