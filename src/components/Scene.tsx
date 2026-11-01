import { Sky } from '@react-three/drei'
import { Terrain } from './Terrain'
import { Vegetation } from './Vegetation'
import { Structures } from './Structures'
import { Petals } from './Petals'
import { CameraRig, Player } from './Player'
import { Effects } from './Effects'

export function Scene() {
  return (
    <>
      <color attach="background" args={['#e6b6a4']} />
      <fog attach="fog" args={['#e3b3a2', 48, 320]} />

      <Sky
        sunPosition={[-60, 16, -90]}
        turbidity={8}
        rayleigh={2.6}
        mieCoefficient={0.006}
        mieDirectionalG={0.82}
      />

      <hemisphereLight args={['#c7d9ff', '#5b4a3a', 0.8]} />
      <ambientLight intensity={0.28} />

      <directionalLight
        position={[-45, 55, -70]}
        intensity={2.6}
        color="#ffd6a8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-70}
        shadow-camera-right={70}
        shadow-camera-top={70}
        shadow-camera-bottom={-70}
        shadow-camera-near={1}
        shadow-camera-far={260}
        shadow-bias={-0.0004}
      />

      <directionalLight position={[40, 22, 60]} intensity={0.5} color="#ff9fb6" />

      <Terrain />
      <Vegetation />
      <Structures />
      <Petals />
      <Player />
      <CameraRig />
      <Effects />
    </>
  )
}
