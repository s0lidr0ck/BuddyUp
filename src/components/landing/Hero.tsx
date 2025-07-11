import Link from 'next/link'
import { ArrowRightIcon, HeartIcon, UserGroupIcon } from '@heroicons/react/24/outline'

export function Hero() {
  return (
    <div className="relative bg-gradient-to-br from-primary-50 via-white to-secondary-50 pt-20 pb-16 sm:pt-24 sm:pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center space-x-2 bg-primary-100 px-4 py-2 rounded-full">
              <HeartIcon className="h-5 w-5 text-primary-600" />
              <span className="text-primary-800 font-medium">Friends helping friends succeed</span>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
            Build habits you'll{' '}
            <span className="text-gradient">actually love</span>
          </h1>
          
          <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
            Team up with a friend and turn habit-building into quality time together. 
            Everything's more fun (and way easier) when you've got someone in your corner.
          </p>
          
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/auth/signup"
              className="btn-primary flex items-center space-x-2 text-lg px-8 py-3"
            >
              <span>Find Your Buddy</span>
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
            
            <Link
              href="/demo"
              className="btn-secondary text-lg px-8 py-3"
            >
              See How It Works
            </Link>
          </div>
          
          <div className="mt-12 flex items-center justify-center space-x-8 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <UserGroupIcon className="h-5 w-5" />
              <span>Just you and a buddy</span>
            </div>
            <div className="flex items-center space-x-2">
              <HeartIcon className="h-5 w-5" />
              <span>Supportive, not stressful</span>
            </div>
          </div>
        </div>
        
        <div className="mt-16 relative">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary-600 font-bold text-lg">1</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Get a Buddy</h3>
                <p className="text-gray-600 text-sm">Invite a friend or find someone new</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary-600 font-bold text-lg">2</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Pick Something Simple</h3>
                <p className="text-gray-600 text-sm">Start small with what matters to you</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary-600 font-bold text-lg">3</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Stay Motivated</h3>
                <p className="text-gray-600 text-sm">Check in daily and cheer each other on</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 