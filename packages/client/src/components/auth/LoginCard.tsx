import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

type FormValues = { username: string; password: string };

type Props = {
   onSubmit: (values: FormValues) => Promise<void>;
   loading: boolean;
   error?: string;
};

export function LoginCard({ onSubmit, loading, error }: Props) {
   const {
      register,
      handleSubmit,
      formState: { errors },
   } = useForm<FormValues>({
      defaultValues: { username: 'admin', password: 'admin123' },
   });

   return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
         <Card className="w-full max-w-md">
            <CardHeader>
               <CardTitle>Factory RAG Login</CardTitle>
            </CardHeader>
            <CardContent>
               <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                  <div className="space-y-2">
                     <Label htmlFor="username">Username</Label>
                     <Input
                        id="username"
                        {...register('username', {
                           required: 'Username is required',
                        })}
                     />
                     {errors.username ? (
                        <p className="text-xs text-destructive">
                           {errors.username.message}
                        </p>
                     ) : null}
                  </div>
                  <div className="space-y-2">
                     <Label htmlFor="password">Password</Label>
                     <Input
                        id="password"
                        type="password"
                        {...register('password', {
                           required: 'Password is required',
                        })}
                     />
                     {errors.password ? (
                        <p className="text-xs text-destructive">
                           {errors.password.message}
                        </p>
                     ) : null}
                  </div>
                  {error ? (
                     <p className="text-sm text-destructive">{error}</p>
                  ) : null}
                  <Button className="w-full" type="submit" disabled={loading}>
                     {loading ? 'Signing in...' : 'Login'}
                  </Button>
               </form>
            </CardContent>
         </Card>
      </div>
   );
}
