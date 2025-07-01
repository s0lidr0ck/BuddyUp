import Link from 'next/link'
import { ArrowRightIcon } from '@heroicons/react/24/outline'

export function CTA() {
  return (
    <div className="bg-primary-600">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to finally stick to your goals?
          </h2>
          <p className="mt-4 text-lg text-primary-100">
            Join thousands of people who discovered that habits are way easier with a buddy.
          </p>
          
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/auth/signup"
              className="inline-flex items-center space-x-2 bg-white px-8 py-3 rounded-lg font-semibold text-primary-600 hover:bg-gray-50 transition-colors duration-200"
            >
              <span>Find Your Buddy</span>
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
          </div>
          
          <p className="mt-4 text-sm text-primary-200">
            Free to start • No pressure • Just you and a friend
          </p>
        </div>
      </div>
    </div>
  )
} 