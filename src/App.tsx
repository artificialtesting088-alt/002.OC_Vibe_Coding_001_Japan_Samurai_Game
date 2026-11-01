import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { Scene } from './components/Scene'
import { Hud } from './components/Hud'

export default function App() {
  return (
    <div className="app">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ fov: 55, near: 0.1, far: 1200, position: [0, 7, 22] }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
      <Hud />
    </div>
  )
}
