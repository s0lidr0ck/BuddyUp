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
    name: 'Just You and Your Buddy',
    description: 'Team up with one person you trust. Simple, personal, and way more effective than going solo.',
    icon: UserGroupIcon,
  },
  {
    name: 'Take Turns Setting Goals',
    description: 'You set a goal for your buddy today, they set one for you tomorrow. Keeps things fair and fun.',
    icon: CalendarDaysIcon,
  },
  {
    name: 'Celebrate Your Wins',
    description: 'Track your streaks, earn fun badges, and see how far you\'ve come together.',
    icon: TrophyIcon,
  },
  {
    name: 'Quick Check-ins',
    description: 'Simple chat to share progress, send encouragement, and celebrate the little victories.',
    icon: ChatBubbleLeftRightIcon,
  },
  {
    name: 'No Pressure Zone',
    description: 'Life happens! Flex days and second chances keep things supportive, not stressful.',
    icon: HeartIcon,
  },
  {
    name: 'Your Success Story',
    description: 'Every completed goal becomes part of your shared story of growth and friendship.',
    icon: SparklesIcon,
  },
]

export function Features() {
  return (
    <div className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Why buddies work better than going solo
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            BuddyUp turns habit-building into a friendship adventure. Because everything's easier with a friend in your corner.
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