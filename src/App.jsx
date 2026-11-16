import Cursor from './components/Cursor/Cursor.jsx'
import Hero from './components/Hero/Hero.jsx'
import { isHeroLightAt } from './components/Hero/gradient.js'
import MorphSlider from './components/MorphSlider/MorphSlider.jsx'
import Work from './components/Work/Work.jsx'
import { useSmoothScroll } from './hooks/useSmoothScroll.js'

export default function App() {
  useSmoothScroll()

  return (
    <>
      <main>
        <Hero />
        <MorphSlider />
        <Work />
      </main>
      <Cursor isLightAt={isHeroLightAt} />
    </>
  )
}
