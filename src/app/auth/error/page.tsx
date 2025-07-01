'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ExclamationTriangleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

const errorMessages = {
  Configuration: 'There is a problem with the server configuration.',
  AccessDenied: 'You do not have permission to sign in.',
  Verification: 'The verification link was invalid or has expired.',
  Default: 'An error occurred during authentication.',
}

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams?.get('error') as keyof typeof errorMessages

  const errorMessage = errorMessages[error] || errorMessages.Default

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-error-600" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h1>
          <p className="text-gray-600">
            We encountered an issue while trying to sign you in.
          </p>
        </div>

        <div className="card">
          <div className="bg-error-50 border border-error-200 rounded-lg p-4 mb-6">
            <p className="text-error-700 text-sm">{errorMessage}</p>
          </div>

          <div className="space-y-3">
            <Link
              href="/auth/signin"
              className="btn-primary w-full"
            >
              Try signing in again
            </Link>
            
            <Link
              href="/auth/signup"
              className="btn-secondary w-full"
            >
              Create a new account
            </Link>
            
            <Link
              href="/"
              className="btn-secondary w-full flex items-center justify-center"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to home
            </Link>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">💡 Common solutions:</h3>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Check if the link in your email has expired</li>
                <li>• Make sure you're using the same email address</li>
                <li>• Try requesting a new magic link</li>
                <li>• Clear your browser cache and cookies</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 