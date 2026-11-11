import Cursor from './components/Cursor/Cursor.jsx'
import Hero from './components/Hero/Hero.jsx'
import { isHeroLightAt } from './components/Hero/gradient.js'

export default function App() {
  return (
    <>
      <main>
        <Hero />
      </main>
      <Cursor isLightAt={isHeroLightAt} />
    </>
  )
}
