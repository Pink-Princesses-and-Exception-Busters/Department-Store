import React from 'react'
import HeroBanner from '../components/HeroBanner'
import WeeklyFocus from '../components/WeeklyFocus'

const HomePage: React.FC = () => {
  return (
    <div className="w-full">
      <HeroBanner />
      <WeeklyFocus />
    </div>
  )
}

export default HomePage