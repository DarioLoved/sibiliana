import React, { useState } from 'react';
import { Card } from '../Common/Card';
import { Button } from '../Common/Button';
import { Input } from '../Common/Input';
import { Zap, Mail, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await resetPassword(email);
      setSuccess(true);
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
      case 'auth/invalid-email':
        return 'Email non valida';
      default:
        return 'Errore durante il reset. Riprova';
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
            <button
              onClick={onBack}
              className="flex items-center text-primary-600 hover:text-primary-700 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Torna al login
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Password dimenticata?</h2>
            <p className="text-gray-600 mb-6">
              Inserisci la tua email e ti invieremo un link per reimpostare la password.
            </p>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {success ? (
              <div className="text-center">
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-600">
                    Email inviata! Controlla la tua casella di posta per il link di reset.
                  </p>
                </div>
                <Button variant="secondary" onClick={onBack} className="w-full">
                  Torna al login
                </Button>
              </div>
            ) : (
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

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Invio in corso...' : 'Invia link di reset'}
                </Button>
              </form>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}