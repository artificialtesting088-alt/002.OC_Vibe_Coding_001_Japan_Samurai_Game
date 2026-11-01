import { useMemo } from 'react'
import * as THREE from 'three'
import { terrainHeight } from '../game'

export function Terrain() {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(440, 440, 128, 128)
    geo.rotateX(-Math.PI / 2)

    const position = geo.attributes.position as THREE.BufferAttribute
    const colors = new Float32Array(position.count * 3)

    const valley = new THREE.Color('#46652f')
    const meadow = new THREE.Color('#6f9a45')
    const ridge = new THREE.Color('#93a95a')
    const shade = new THREE.Color()

    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i)
      const z = position.getZ(i)
      const y = terrainHeight(x, z)
      position.setY(i, y)

      const t = THREE.MathUtils.clamp((y + 6) / 16, 0, 1)
      shade.copy(valley).lerp(meadow, Math.min(1, t * 2))
      shade.lerp(ridge, Math.max(0, t * 2 - 1))
      colors[i * 3] = shade.r
      colors[i * 3 + 1] = shade.g
      colors[i * 3 + 2] = shade.b
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.computeVertexNormals()
    return geo
  }, [])

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors roughness={1} metalness={0} />
    </mesh>
  )
}
