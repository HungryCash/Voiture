"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Force dynamic rendering to avoid build-time errors
export const dynamic = 'force-dynamic';

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState("signin");
  const [userType, setUserType] = useState<"passenger" | "driver">("passenger");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sign In State
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Sign Up State
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password: signInPassword,
      });

      if (error) throw error;

      // Check user type from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', data.user?.id)
        .single();

      // Redirect based on user type
      if (profile?.user_type === "driver") {
        router.push("/driver/dashboard");
      } else {
        router.push("/");
      }
      router.refresh();
    } catch (error: any) {
      setError(error.message || "Failed to sign in");
      console.error("Sign in error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (signUpPassword !== signUpConfirmPassword) {
      setError("Passwords do not match!");
      setLoading(false);
      return;
    }

    try {
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email: signUpEmail,
        password: signUpPassword,
        options: {
          data: {
            full_name: signUpName,
            user_type: userType,
          },
        },
      });

      if (error) throw error;

      // Update profile with full name
      if (data.user) {
        await supabase
          .from('profiles')
          .update({ full_name: signUpName })
          .eq('id', data.user.id);
      }

      // Show success message
      alert("Account created successfully! You can now sign in.");

      // Switch to sign in tab
      setActiveTab("signin");

      // Clear form
      setSignUpName("");
      setSignUpEmail("");
      setSignUpPassword("");
      setSignUpConfirmPassword("");
    } catch (error: any) {
      setError(error.message || "Failed to create account");
      console.error("Sign up error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary/10 to-background">
      {/* Header */}
      <header className="p-4 flex items-center">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold ml-2">Voiture</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 flex items-center justify-center">
        <Card className="w-full p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* Sign In Tab */}
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
                  <p className="text-muted-foreground text-sm mb-4">
                    Sign in to access your account
                  </p>
                </div>

                {/* Error Message */}
                {error && activeTab === "signin" && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded text-sm">
                    {error}
                  </div>
                )}

                {/* User Type Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">I am a:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={userType === "passenger" ? "default" : "outline"}
                      onClick={() => setUserType("passenger")}
                      className="w-full"
                    >
                      Passenger
                    </Button>
                    <Button
                      type="button"
                      variant={userType === "driver" ? "default" : "outline"}
                      onClick={() => setUserType("driver")}
                      className="w-full"
                    >
                      Driver
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="signin-email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your.email@purdue.edu"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="signin-password" className="text-sm font-medium">
                    Password
                  </label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>

                <div className="text-center">
                  <Button variant="link" className="text-sm">
                    Forgot password?
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Sign Up Tab */}
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Create Account</h2>
                  <p className="text-muted-foreground text-sm mb-4">
                    Join Voiture to simplify your campus transit
                  </p>
                </div>

                {/* Error Message */}
                {error && activeTab === "signup" && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded text-sm">
                    {error}
                  </div>
                )}

                {/* User Type Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">I am a:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={userType === "passenger" ? "default" : "outline"}
                      onClick={() => setUserType("passenger")}
                      className="w-full"
                    >
                      Passenger
                    </Button>
                    <Button
                      type="button"
                      variant={userType === "driver" ? "default" : "outline"}
                      onClick={() => setUserType("driver")}
                      className="w-full"
                    >
                      Driver
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="signup-name" className="text-sm font-medium">
                    Full Name
                  </label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="signup-email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your.email@purdue.edu"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="signup-password" className="text-sm font-medium">
                    Password
                  </label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="signup-confirm-password" className="text-sm font-medium">
                    Confirm Password
                  </label>
                  <Input
                    id="signup-confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={signUpConfirmPassword}
                    onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  By signing up, you agree to our Terms of Service and Privacy Policy
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </main>
    </div>
  );
}
