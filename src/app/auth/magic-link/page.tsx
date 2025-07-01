export default function MagicLinkPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <a 
            href="/auth/signin"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6"
          >
            ← Back to sign in
          </a>
          
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <div className="h-8 w-8 bg-primary-600 rounded"></div>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Magic Link</h1>
          <p className="text-gray-600">
            Enter your email to receive a sign-in link
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <form action="/api/auth/signin" method="POST" className="space-y-6">
            <input name="csrfToken" type="hidden" />
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="alex@example.com"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 font-medium transition-colors"
            >
              Send Magic Link
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <a href="/auth/signin" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign in with password
              </a>
            </p>
          </div>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="bg-yellow-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-yellow-900 mb-2">📧 Backup Option</h3>
              <p className="text-xs text-yellow-800">
                Use this if you forgot your password or prefer email authentication. Check your inbox for the sign-in link.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 