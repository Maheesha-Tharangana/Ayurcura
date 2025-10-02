import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Please enter a valid email"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("login");

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      // Redirect admin users to the admin dashboard
      if (user.role === "admin") {
        setLocation("/admin");
      } else {
        setLocation("/");
      }
    }
  }, [user, setLocation]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      fullName: "",
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data, {
      onSuccess: (userData) => {
        console.log('Login success in form handler:', userData);
        
        // Add a direct forced redirect after successful login
        if (userData && userData.role === 'admin') {
          console.log('Redirecting admin user to admin dashboard');
          // Only use the router approach to avoid page refreshes
          setLocation('/admin');
        } else {
          console.log('Redirecting regular user to home');
          // Only use the router approach to avoid page refreshes
          setLocation('/');
        }
      }
    });
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(data, {
      onSuccess: (userData) => {
        console.log('Registration success in form handler:', userData);
        
        // Force navigation to home page after successful registration
        console.log('Redirecting new user to home page');
        // Only use the router approach to avoid page refreshes
        setLocation('/');
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <Navbar />
      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left side: Auth forms */}
          <div className="flex items-center justify-center">
            <Card className="w-full max-w-md">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">Welcome to AyurCura</CardTitle>
                <CardDescription className="text-center">
                  Connect with Ayurvedic practitioners and discover natural treatments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="register">Register</TabsTrigger>
                  </TabsList>
                  
                  {/* Login Tab */}
                  <TabsContent value="login">
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-username">Username</Label>
                        <Input 
                          id="login-username" 
                          placeholder="Enter your username" 
                          {...loginForm.register("username")} 
                        />
                        {loginForm.formState.errors.username && (
                          <p className="text-sm text-red-500">{loginForm.formState.errors.username.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <Input 
                          id="login-password" 
                          type="password" 
                          placeholder="Enter your password" 
                          {...loginForm.register("password")}
                        />
                        {loginForm.formState.errors.password && (
                          <p className="text-sm text-red-500">{loginForm.formState.errors.password.message}</p>
                        )}
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Login
                      </Button>
                    </form>
                  </TabsContent>
                  
                  {/* Register Tab */}
                  <TabsContent value="register">
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-fullname">Full Name</Label>
                        <Input 
                          id="register-fullname" 
                          placeholder="Enter your full name" 
                          {...registerForm.register("fullName")} 
                        />
                        {registerForm.formState.errors.fullName && (
                          <p className="text-sm text-red-500">{registerForm.formState.errors.fullName.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-email">Email</Label>
                        <Input 
                          id="register-email" 
                          type="email" 
                          placeholder="Enter your email" 
                          {...registerForm.register("email")} 
                        />
                        {registerForm.formState.errors.email && (
                          <p className="text-sm text-red-500">{registerForm.formState.errors.email.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-username">Username</Label>
                        <Input 
                          id="register-username" 
                          placeholder="Choose a username" 
                          {...registerForm.register("username")} 
                        />
                        {registerForm.formState.errors.username && (
                          <p className="text-sm text-red-500">{registerForm.formState.errors.username.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-password">Password</Label>
                        <Input 
                          id="register-password" 
                          type="password" 
                          placeholder="Choose a password" 
                          {...registerForm.register("password")} 
                        />
                        {registerForm.formState.errors.password && (
                          <p className="text-sm text-red-500">{registerForm.formState.errors.password.message}</p>
                        )}
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Create Account
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="flex flex-col">
                <p className="text-sm text-center text-neutral-600 mt-2">
                  {activeTab === "login" ? (
                    <>
                      Don't have an account?{" "}
                      <button 
                        className="text-primary-500 hover:underline" 
                        onClick={() => setActiveTab("register")}
                        type="button"
                      >
                        Register
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <button 
                        className="text-primary-500 hover:underline" 
                        onClick={() => setActiveTab("login")}
                        type="button"
                      >
                        Login
                      </button>
                    </>
                  )}
                </p>
              </CardFooter>
            </Card>
          </div>
          
          {/* Right side: Hero content */}
          <div className="hidden lg:flex flex-col justify-center p-6 bg-primary-500 text-white rounded-lg">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold font-heading">Ancient Wisdom for Modern Wellness</h1>
              <p className="text-lg">
                Join AyurCura and connect with qualified Ayurvedic practitioners, discover natural treatments, 
                and embark on your journey to holistic health.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <i className="ri-check-line mr-2 text-accent-500"></i>
                  <span>Find the best Ayurvedic doctors near you</span>
                </li>
                <li className="flex items-center">
                  <i className="ri-check-line mr-2 text-accent-500"></i>
                  <span>Book appointments with just a few clicks</span>
                </li>
                <li className="flex items-center">
                  <i className="ri-check-line mr-2 text-accent-500"></i>
                  <span>Access educational content on Ayurvedic treatments</span>
                </li>
                <li className="flex items-center">
                  <i className="ri-check-line mr-2 text-accent-500"></i>
                  <span>Analyze symptoms and get personalized recommendations</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
