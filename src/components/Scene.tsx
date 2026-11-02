import { Environment } from '@react-three/drei'
import { asset } from '../game'
import { Terrain } from './Terrain'
import { Vegetation } from './Vegetation'
import { Structures } from './Structures'
import { Petals } from './Petals'
import { JacarandaTrees, Boulders } from './Trees'
import { NPCs } from './NPC'
import { Enemies } from './Enemies'
import { CameraRig, Player } from './Player'
import { Effects } from './Effects'

export function Scene() {
  return (
    <>
      <fog attach="fog" args={['#d8a98f', 110, 480]} />

      <Environment
        files={asset('hdri/qwantani_sunset_puresky_1k.hdr')}
        background
        backgroundBlurriness={0.02}
        backgroundIntensity={0.55}
        environmentIntensity={1.0}
      />

      <hemisphereLight args={['#b9cdf0', '#4a3a28', 0.4]} />
      <ambientLight intensity={0.1} />

      <directionalLight
        position={[38, 52, 26]}
        intensity={3.2}
        color="#ffd0a1"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={45}
        shadow-camera-bottom={-45}
        shadow-camera-near={1}
        shadow-camera-far={260}
        shadow-bias={-0.0004}
      />

      <directionalLight position={[-40, 28, -55]} intensity={0.5} color="#ffb0c4" />

      <Terrain />
      <Vegetation />
      <JacarandaTrees />
      <Boulders />
      <Structures />
      <NPCs />
      <Enemies />
      <Petals />
      <Player />
      <CameraRig />
      <Effects />
    </>
  )
}
