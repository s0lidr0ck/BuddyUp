export default function TestDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-primary-600 rounded mr-3"></div>
              <h1 className="text-xl font-bold text-gray-900">BuddyUp</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-5 w-5 bg-gray-400 rounded"></div>
                <span className="text-sm text-gray-700">alex@thisisnlc.com</span>
              </div>
              
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to BuddyUp! 🎉
          </h2>
          <p className="text-gray-600">
            Test dashboard - email authentication is working in the background!
          </p>
        </div>

        {/* Welcome Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-primary-600 font-bold text-lg">1</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose Your Habit</h3>
            <p className="text-gray-600 text-sm mb-4">
              Pick something meaningful you want to build consistently.
            </p>
            <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm">
              Get Started
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-purple-600 font-bold text-lg">2</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Find Your Buddy</h3>
            <p className="text-gray-600 text-sm mb-4">
              Invite a friend or start solo until you're ready to partner up.
            </p>
            <button className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-300 text-sm">
              Invite Friend
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-green-600 font-bold text-lg">3</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Building</h3>
            <p className="text-gray-600 text-sm mb-4">
              Begin your daily accountability journey with small, achievable goals.
            </p>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm">
              Start Challenge
            </button>
          </div>
        </div>

        {/* Current State */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Accountability Journey</h3>
          
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="h-8 w-8 bg-gray-400 rounded"></div>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Ready to begin!</h4>
            <p className="text-gray-600 mb-6">
              You're all set up and ready to start building lasting habits with accountability partners.
            </p>
            <div className="flex justify-center space-x-4">
              <button className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700">
                Create Your First Challenge
              </button>
              <button className="bg-gray-200 text-gray-900 px-6 py-2 rounded-lg hover:bg-gray-300">
                Browse Templates
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats (Placeholder) */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-primary-600">0</div>
            <div className="text-sm text-gray-600">Active Partnerships</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-green-600">0</div>
            <div className="text-sm text-gray-600">Day Streak</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">0</div>
            <div className="text-sm text-gray-600">Challenges Completed</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">0</div>
            <div className="text-sm text-gray-600">Badges Earned</div>
          </div>
        </div>

        {/* Email Status */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-yellow-800 font-medium mb-2">📧 Email Configuration Status</h4>
          <p className="text-yellow-700 text-sm">
            Once you fix the Gmail App Password, email authentication will work perfectly! 
            For now, you can explore this test dashboard.
          </p>
        </div>
      </main>
    </div>
  )
} 