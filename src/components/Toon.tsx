import { useMemo } from 'react'
import * as THREE from 'three'

let cachedGradient: THREE.DataTexture | null = null

function toonGradient() {
  if (cachedGradient) return cachedGradient
  const data = new Uint8Array([70, 130, 190, 255])
  const texture = new THREE.DataTexture(data, data.length, 1, THREE.RedFormat)
  texture.minFilter = THREE.NearestFilter
  texture.magFilter = THREE.NearestFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true
  cachedGradient = texture
  return texture
}

type ToonProps = {
  color: string
  emissive?: string
  emissiveIntensity?: number
  side?: THREE.Side
  transparent?: boolean
  opacity?: number
}

export function Toon({
  color,
  emissive,
  emissiveIntensity = 0,
  side = THREE.FrontSide,
  transparent = false,
  opacity = 1,
}: ToonProps) {
  const gradientMap = useMemo(() => toonGradient(), [])
  return (
    <meshToonMaterial
      color={color}
      gradientMap={gradientMap}
      emissive={emissive}
      emissiveIntensity={emissiveIntensity}
      side={side}
      transparent={transparent}
      opacity={opacity}
    />
  )
}
