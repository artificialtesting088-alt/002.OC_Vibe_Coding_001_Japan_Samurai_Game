import { useEffect, useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { asset, terrainHeight } from '../game'

const TEXTURES = [
  asset('textures/leafy_grass/leafy_grass_diff_1k.jpg'),
  asset('textures/leafy_grass/leafy_grass_nor_gl_1k.jpg'),
  asset('textures/leafy_grass/leafy_grass_rough_1k.jpg'),
]

export function Terrain() {
  const [map, normalMap, roughnessMap] = useTexture(TEXTURES)
  const normalScale = useMemo(() => new THREE.Vector2(0.75, 0.75), [])

  useEffect(() => {
    for (const texture of [map, normalMap, roughnessMap]) {
      texture.wrapS = THREE.RepeatWrapping
      texture.wrapT = THREE.RepeatWrapping
      texture.repeat.set(90, 90)
      texture.anisotropy = 8
      texture.needsUpdate = true
    }
    map.colorSpace = THREE.SRGBColorSpace
  }, [map, normalMap, roughnessMap])

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(440, 440, 128, 128)
    geo.rotateX(-Math.PI / 2)

    const position = geo.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < position.count; i++) {
      position.setY(i, terrainHeight(position.getX(i), position.getZ(i)))
    }

    geo.computeVertexNormals()
    return geo
  }, [])

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial
        map={map}
        normalMap={normalMap}
        normalScale={normalScale}
        roughnessMap={roughnessMap}
        color="#cfe0b4"
        roughness={1}
        metalness={0}
      />
    </mesh>
  )
}
