import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'

export function Effects() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom intensity={0.5} luminanceThreshold={0.78} luminanceSmoothing={0.25} mipmapBlur />
      <Vignette eskil={false} offset={0.24} darkness={0.68} />
    </EffectComposer>
  )
}
