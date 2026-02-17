import { useState, useEffect, type FormEvent } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { user, loginMutation, registerMutation, demoLoginMutation } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Registration form state
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Form validation and submission states
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  // Handle authentication errors
  useEffect(() => {
    if (loginMutation.error) {
      toast({
        title: "Login Failed",
        description: loginMutation.error.message || "Invalid email or password",
        variant: "destructive",
      });
    }
  }, [loginMutation.error, toast]);

  useEffect(() => {
    if (registerMutation.error) {
      toast({
        title: "Registration Failed",
        description: registerMutation.error.message || "Unable to create account",
        variant: "destructive",
      });
    }
  }, [registerMutation.error, toast]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateLoginForm = () => {
    const newErrors: Record<string, string> = {};

    if (!loginEmail) {
      newErrors.loginEmail = "Email is required";
    } else if (!validateEmail(loginEmail)) {
      newErrors.loginEmail = "Please enter a valid email";
    }

    if (!loginPassword) {
      newErrors.loginPassword = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegisterForm = () => {
    const newErrors: Record<string, string> = {};

    if (!registerName.trim()) {
      newErrors.registerName = "Full name is required";
    }

    if (!registerEmail) {
      newErrors.registerEmail = "Email is required";
    } else if (!validateEmail(registerEmail)) {
      newErrors.registerEmail = "Please enter a valid email";
    }

    if (!registerPassword) {
      newErrors.registerPassword = "Password is required";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (registerPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }

    if (!acceptTerms) {
      newErrors.acceptTerms = "You must accept the terms and conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateLoginForm()) {
      return;
    }

    loginMutation.mutate({
      email: loginEmail,
      password: loginPassword,
    });
  };

  const handleRegister = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateRegisterForm()) {
      return;
    }

    registerMutation.mutate({
      name: registerName.trim(),
      email: registerEmail,
      password: registerPassword,
    });
  };

  const clearErrors = () => setErrors({});

  const switchToLogin = () => {
    setIsLogin(true);
    clearErrors();
  };

  const switchToRegister = () => {
    setIsLogin(false);
    clearErrors();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex min-h-screen">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-center px-12">
          <div className="max-w-md">
            <div className="mb-8">
              <i className="fas fa-balance-scale text-4xl text-primary-foreground mb-4"></i>
              <h1 className="text-4xl font-bold text-primary-foreground mb-4">LawHelper</h1>
              <p className="text-lg text-blue-100">AI-powered legal research platform designed for modern legal professionals</p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <i className="fas fa-search text-blue-200"></i>
                <span className="text-blue-100">AI Legal Research & Case Law Analysis</span>
              </div>
              <div className="flex items-center space-x-3">
                <i className="fas fa-file-text text-blue-200"></i>
                <span className="text-blue-100">Intelligent Document Summarization</span>
              </div>
              <div className="flex items-center space-x-3">
                <i className="fas fa-chart-line text-blue-200"></i>
                <span className="text-blue-100">Predictive Risk Analysis</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Forms */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-8">
          <div className="w-full max-w-md">
            {isLogin ? (
              /* LOGIN FORM */
              <Card className="bg-card rounded-lg shadow-lg">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-semibold">Welcome Back</CardTitle>
                  <CardDescription>Sign in to your LawHelper account</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                      <label htmlFor="login-email" className="text-sm font-medium">
                        Email
                      </label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="demo@lawhelper.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        data-testid="input-email"
                        className={errors.loginEmail ? "border-red-500" : ""}
                      />
                      {errors.loginEmail && (
                        <p className="text-sm text-red-500">{errors.loginEmail}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="login-password" className="text-sm font-medium">
                        Password
                      </label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        data-testid="input-password"
                        className={errors.loginPassword ? "border-red-500" : ""}
                      />
                      {errors.loginPassword && (
                        <p className="text-sm text-red-500">{errors.loginPassword}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-semibold transition-all hover:scale-[1.01]"
                      disabled={loginMutation.isPending}
                      data-testid="button-signin"
                    >
                      {loginMutation.isPending ? "Signing In..." : "Sign In"}
                    </Button>

                    <div className="relative my-8">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t"></span>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-4 text-muted-foreground font-medium">Fast Access</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-12 border-2 border-primary/20 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 group relative overflow-hidden"
                        onClick={() => demoLoginMutation.mutate()}
                        disabled={demoLoginMutation.isPending}
                        data-testid="button-demo"
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <i className="fas fa-rocket text-primary group-hover:animate-bounce"></i>
                          <span className="font-semibold text-primary">
                            {demoLoginMutation.isPending ? "Connecting..." : "Launch Demo MVP"}
                          </span>
                        </div>
                      </Button>

                      <p className="text-center text-xs text-muted-foreground">
                        No password needed for demo access
                      </p>
                    </div>
                  </form>

                  <div className="mt-8 text-center pt-4 border-t">
                    <p className="text-muted-foreground">
                      Don't have an account?{" "}
                      <button
                        onClick={switchToRegister}
                        className="text-primary hover:underline font-semibold"
                        data-testid="link-signup"
                      >
                        Create Account
                      </button>
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* REGISTRATION FORM */
              <Card className="bg-card rounded-lg shadow-lg">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-semibold">Create Account</CardTitle>
                  <CardDescription>Join LawHelper today</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-6">
                    <div className="space-y-2">
                      <label htmlFor="register-name" className="text-sm font-medium">
                        Full Name
                      </label>
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="Enter your full name"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        data-testid="input-name"
                        className={errors.registerName ? "border-red-500" : ""}
                      />
                      {errors.registerName && (
                        <p className="text-sm text-red-500">{errors.registerName}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="register-email" className="text-sm font-medium">
                        Email
                      </label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="Enter your email"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        data-testid="input-email"
                        className={errors.registerEmail ? "border-red-500" : ""}
                      />
                      {errors.registerEmail && (
                        <p className="text-sm text-red-500">{errors.registerEmail}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="register-password" className="text-sm font-medium">
                        Password
                      </label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Create a password"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        data-testid="input-password"
                        className={errors.registerPassword ? "border-red-500" : ""}
                      />
                      {errors.registerPassword && (
                        <p className="text-sm text-red-500">{errors.registerPassword}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="confirm-password" className="text-sm font-medium">
                        Confirm Password
                      </label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        data-testid="input-confirm-password"
                        className={errors.confirmPassword ? "border-red-500" : ""}
                      />
                      {errors.confirmPassword && (
                        <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="terms"
                        checked={acceptTerms}
                        onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                        className={errors.acceptTerms ? "border-red-500" : ""}
                      />
                      <label htmlFor="terms" className="text-sm text-muted-foreground">
                        I agree to the{" "}
                        <button type="button" className="text-primary hover:underline">
                          Terms of Service
                        </button>{" "}
                        and{" "}
                        <button type="button" className="text-primary hover:underline">
                          Privacy Policy
                        </button>
                      </label>
                    </div>
                    {errors.acceptTerms && (
                      <p className="text-sm text-red-500">{errors.acceptTerms}</p>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending}
                      data-testid="button-create-account"
                    >
                      {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>

                  <div className="mt-6 text-center">
                    <p className="text-muted-foreground">
                      Already have an account?{" "}
                      <button
                        onClick={switchToLogin}
                        className="text-primary hover:underline font-medium"
                        data-testid="link-signin"
                      >
                        Sign in
                      </button>
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}