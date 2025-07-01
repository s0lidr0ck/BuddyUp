import { CheckCircleIcon } from '@heroicons/react/24/solid'

const steps = [
  {
    name: 'Sign Up & Find Your Buddy',
    description: 'Create your account and invite a friend, or start on your own until you find the perfect habit buddy.',
    features: ['Super quick sign-up', 'Invite by email or link', 'Start right away'],
  },
  {
    name: 'Pick What You Want to Work On',
    description: 'Choose any habit that matters to you - reading, exercise, journaling, or whatever you want to stick to.',
    features: ['Any habit works', 'Daily or weekdays', 'Set your own timeline'],
  },
  {
    name: 'Take Turns Making It Fun',
    description: 'Whoever just crushed their goal gets to set tomorrow\'s challenge. Keep it small, keep it doable.',
    features: ['Switch who\'s in charge', 'Small goals work best', 'Skip a turn if you need to'],
  },
  {
    name: 'Check In and Celebrate',
    description: 'Mark it done, share how you felt, and add a quick note about your experience.',
    features: ['Quick feeling check-in', 'Optional reflection notes', 'See your progress grow'],
  },
  {
    name: 'Build Your Success Story',
    description: 'Watch your streaks grow, unlock fun achievements, and create an awesome record of your journey together.',
    features: ['Cool streak counters', 'Achievement unlocks', 'Your shared memory timeline'],
  },
]

export function HowItWorks() {
  return (
    <div className="py-24 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Here's how the buddy system works
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Five simple steps to finally stick to the habits you actually care about
          </p>
        </div>
        
        <div className="mt-20">
          <div className="relative">
            {steps.map((step, stepIdx) => (
              <div key={step.name} className={`relative ${stepIdx !== steps.length - 1 ? 'pb-12' : ''}`}>
                {stepIdx !== steps.length - 1 && (
                  <div
                    className="absolute left-6 top-12 -ml-px h-full w-0.5 bg-primary-200"
                    aria-hidden="true"
                  />
                )}
                
                <div className="relative flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-white font-bold text-lg">
                      {stepIdx + 1}
                    </div>
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="card">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.name}</h3>
                      <p className="text-gray-600 mb-4">{step.description}</p>
                      
                      <ul className="space-y-2">
                        {step.features.map((feature) => (
                          <li key={feature} className="flex items-center space-x-2">
                            <CheckCircleIcon className="h-5 w-5 text-success-500" />
                            <span className="text-sm text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 