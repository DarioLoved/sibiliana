import React, { useState } from 'react';
import { Card } from '../Common/Card';
import { Button } from '../Common/Button';
import { Input } from '../Common/Input';
import { Zap, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface LoginFormProps {
  onToggleMode: () => void;
  onForgotPassword: () => void;
}

export function LoginForm({ onToggleMode, onForgotPassword }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signIn(email, password);
    } catch (error: any) {
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'Nessun account trovato con questa email';
      case 'auth/wrong-password':
        return 'Password non corretta';
      case 'auth/invalid-email':
        return 'Email non valida';
      case 'auth/too-many-requests':
        return 'Troppi tentativi. Riprova più tardi';
      case 'auth/invalid-credential':
        return 'Credenziali non valide';
      default:
        return 'Errore durante il login. Riprova';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-energy-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="p-4 bg-primary-600 rounded-full w-16 h-16 mx-auto mb-4">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Casa Mare</h1>
          <p className="text-gray-600">Gestione Spese Energia</p>
        </div>

        <Card>
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Accedi</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tua@email.com"
                icon={Mail}
                required
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="La tua password"
                  icon={Lock}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Accesso in corso...' : 'Accedi'}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-primary-600 hover:text-primary-700 text-sm"
              >
                Password dimenticata?
              </button>
              <div>
                <span className="text-gray-600 text-sm">Non hai un account? </span>
                <button
                  type="button"
                  onClick={onToggleMode}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Registrati
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}