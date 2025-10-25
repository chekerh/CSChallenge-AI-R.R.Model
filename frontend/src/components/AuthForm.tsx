import React, { useState } from 'react';
import { User, Key, Mail, Loader2 } from 'lucide-react';
import { API_BASE } from '../api';
import AssistantCharacter from './AssistantCharacter';
import { assistantCharacters } from '../config/characters';

export default function AuthForm({ onAuth }: { onAuth: (token: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState<'none' | 'name' | 'email' | 'password'>('none');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setStatus('');

    const urlPath = mode === 'signup' ? '/auth/signup' : '/auth/login';
    const url = `${API_BASE}${urlPath}`;
    const body = mode === 'signup' ? { email, password, name } : { email, password };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setStatus(data.error || 'Authentication failed');
        return;
      }

      localStorage.setItem('token', data.token);
      onAuth(data.token);
    } catch (err) {
      setStatus('Network error occurred');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-md w-full space-y-8 relative">
      {/* Advisor Character */}
      <AssistantCharacter
        {...assistantCharacters.advisor}
        state={isFocused === 'password' ? 'lookingAway' : 
               isFocused === 'email' ? 'curious' :
               isLoading ? 'happy' : 'normal'}
        message={isFocused === 'password' ? assistantCharacters.advisor.messages.lookingAway :
                isFocused === 'email' ? assistantCharacters.advisor.messages.curious :
                isLoading ? assistantCharacters.advisor.messages.happy :
                assistantCharacters.advisor.messages.normal}
      />

      {/* Recruiter Character */}
      <AssistantCharacter
        {...assistantCharacters.recruiter}
        state={isFocused === 'name' ? 'curious' :
               isLoading ? 'happy' : 'normal'}
        message={isFocused === 'name' ? assistantCharacters.recruiter.messages.curious :
                isLoading ? assistantCharacters.recruiter.messages.happy :
                assistantCharacters.recruiter.messages.normal}
      />
      
      <div className="text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {mode === 'login' ? (
            <>
              Or{' '}
              <button
                onClick={() => setMode('signup')}
                className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline transition-colors duration-200"
              >
                start your journey
              </button>
            </>
          ) : (
            <>
              Already registered?{' '}
              <button
                onClick={() => setMode('login')}
                className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline transition-colors duration-200"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={submit}>
        <div className="rounded-md shadow-sm space-y-4">
          {mode === 'signup' && (
            <div className="relative">
              <label htmlFor="name" className="sr-only">
                Name
              </label>
              <User className="absolute top-1/2 left-3 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="name"
                type="text"
                required={mode === 'signup'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setIsFocused('name')}
                onBlur={() => setIsFocused('none')}
                className="
                  appearance-none relative block w-full pl-10 pr-3 py-2
                  border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md
                  focus:outline-none focus:ring-indigo-500 focus:border-indigo-500
                  focus:z-10 sm:text-sm
                  transition-all duration-200
                "
                placeholder="Full name"
              />
            </div>
          )}

          <div className="relative">
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <Mail className="absolute top-1/2 left-3 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setIsFocused('email')}
              onBlur={() => setIsFocused('none')}
              className="
                appearance-none relative block w-full pl-10 pr-3 py-2
                border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md
                focus:outline-none focus:ring-indigo-500 focus:border-indigo-500
                focus:z-10 sm:text-sm
                transition-all duration-200
              "
              placeholder="Email address"
            />
          </div>

          <div className="relative">
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <Key className="absolute top-1/2 left-3 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setIsFocused('password')}
              onBlur={() => setIsFocused('none')}
              className="
                appearance-none relative block w-full pl-10 pr-3 py-2
                border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md
                focus:outline-none focus:ring-indigo-500 focus:border-indigo-500
                focus:z-10 sm:text-sm
                transition-all duration-200
              "
              placeholder="Password"
            />
          </div>
        </div>

        {status && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{status}</h3>
              </div>
            </div>
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className={`
              group relative w-full flex justify-center py-2 px-4 border border-transparent
              text-sm font-medium rounded-md text-white
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
              transition-all duration-200
              ${isLoading
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
              }
            `}
          >
            {isLoading ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              mode === 'signup' ? 'Create Account' : 'Sign In'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
