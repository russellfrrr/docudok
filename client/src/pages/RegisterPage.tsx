import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { AlertCircle, Loader2 } from 'lucide-react';
import { register } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthLayout } from '@/components/layout/AuthLayout';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      navigate('/');
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    registerMutation.mutate({
      name,
      email,
      password,
    });
  };

  const errorMessage =
    registerMutation.error instanceof Error
      ? registerMutation.error.message
      : 'Register failed';

  return (
    <AuthLayout
      title="Create your workspace"
      description="Start uploading documents and asking grounded questions."
    >

      <Card className="border border-border/80 bg-card/95 shadow-xl shadow-black/5 dark:shadow-black/20">
        <CardHeader className="space-y-2 pb-5">
          <CardTitle className="text-[1.35rem] tracking-tight">
            Create account
          </CardTitle>
          <CardDescription className="leading-6">
            Start chatting with your documents.
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {registerMutation.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="password">Password</Label>
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
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Create account
            </Button>
          </form>

          <p className="mt-4 text-center text-[0.86rem] leading-6 text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-foreground underline">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  );
};
