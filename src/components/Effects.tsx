import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'

export function Effects() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom intensity={0.32} luminanceThreshold={0.82} luminanceSmoothing={0.3} mipmapBlur />
      <Vignette eskil={false} offset={0.22} darkness={0.62} />
    </EffectComposer>
  )
}
