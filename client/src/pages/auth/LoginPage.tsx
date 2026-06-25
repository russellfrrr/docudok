import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { AlertCircle, Loader2 } from 'lucide-react';
import { login } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthLayout } from '@/components/layout/AuthLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const LoginPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      navigate('/');
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    loginMutation.mutate({
      email,
      password,
    });
  };

  const errorMessage =
    loginMutation.error instanceof Error
      ? loginMutation.error.message
      : 'Login failed';

  return (
    <AuthLayout
      title="Welcome back"
      description="Log in to continue working with your document workspace."
    >

      <Card className="border border-border/80 bg-card/95 shadow-xl shadow-black/5 dark:shadow-black/20">
        <CardHeader className="space-y-2 pb-5">
          <CardTitle className="font-heading text-[1.4rem] font-semibold tracking-[-0.015em]">
            Log in
          </CardTitle>
          <CardDescription className="text-[0.9rem] leading-6">
            Continue to your document workspace.
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {loginMutation.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2.5">
              <Label
                htmlFor="email"
                className="text-[0.78rem] font-semibold tracking-[0.02em]"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor="password"
                className="text-[0.78rem] font-semibold tracking-[0.02em]"
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="mt-1 w-full shadow-sm"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Log in
            </Button>
          </form>

          <p className="mt-4 text-center text-[0.84rem] leading-6 text-muted-foreground">
            No account yet?{' '}
            <Link to="/register" className="font-medium text-foreground underline">
              Create one
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  );
};
