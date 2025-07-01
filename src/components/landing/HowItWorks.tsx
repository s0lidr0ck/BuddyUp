import { CheckCircleIcon } from '@heroicons/react/24/solid'

const steps = [
  {
    name: 'Sign Up & Connect',
    description: 'Create your account and invite a friend, or start solo until you find your accountability buddy.',
    features: ['Fast email sign-up', 'Username or link invites', 'Start immediately'],
  },
  {
    name: 'Choose Your Habit',
    description: 'Pick what matters to you - reading, working out, journaling, or any habit you want to build.',
    features: ['Flexible scheduling', 'Daily or weekday options', 'Custom duration settings'],
  },
  {
    name: 'Take Turns Setting Goals',
    description: 'The person who just completed their task sets tomorrow\'s micro-goal for both of you.',
    features: ['Keep it fresh and fair', 'Micro-goals stay doable', 'Pass option available'],
  },
  {
    name: 'Check In Daily',
    description: 'Mark it done, tag how you felt, and add a quick reflection note to track your journey.',
    features: ['15 feeling tags', 'Rotating reflection prompts', 'Progress tracking'],
  },
  {
    name: 'Celebrate & Grow',
    description: 'Watch your streaks build, earn badges, and create memories on your shared journey.',
    features: ['Streak counters', 'Achievement badges', 'Memory Wall timeline'],
  },
]

export function HowItWorks() {
  return (
    <div className="py-24 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            How BuddyUp Works
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Five simple steps to turn good intentions into lasting habits
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