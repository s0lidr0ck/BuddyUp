import { 
  UserGroupIcon, 
  CalendarDaysIcon, 
  TrophyIcon, 
  ChatBubbleLeftRightIcon,
  HeartIcon,
  SparklesIcon 
} from '@heroicons/react/24/outline'

const features = [
  {
    name: 'One-to-One Accountability',
    description: 'Pair up with one trusted friend for crystal-clear responsibility and genuine encouragement.',
    icon: UserGroupIcon,
  },
  {
    name: 'Turn-Based Goal Setting',
    description: 'Take turns setting tomorrow\'s micro-goals to keep things fresh and fair.',
    icon: CalendarDaysIcon,
  },
  {
    name: 'Streaks & Badges',
    description: 'Watch your progress grow with streak counters, celebration moments, and achievement badges.',
    icon: TrophyIcon,
  },
  {
    name: 'Buddy Chat',
    description: 'Stay connected with lightweight chat and one-tap encouragement stickers.',
    icon: ChatBubbleLeftRightIcon,
  },
  {
    name: 'Grace-Filled Motivation',
    description: 'Mulligans, flex days, and reflection prompts balance challenge with encouragement.',
    icon: HeartIcon,
  },
  {
    name: 'Memory Wall',
    description: 'Completed challenges live forever on your Memory Wall for inspiration and reminiscing.',
    icon: SparklesIcon,
  },
]

export function Features() {
  return (
    <div className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need to build lasting habits
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            BuddyUp combines the power of friendship with smart design to make accountability feel natural and fun.
          </p>
        </div>
        
        <div className="mt-20">
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="relative">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
                      <feature.icon className="h-6 w-6 text-primary-600" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{feature.name}</h3>
                  </div>
                </div>
                <div className="mt-2 ml-16">
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 