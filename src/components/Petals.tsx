import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

type Petal = {
  x: number
  y: number
  z: number
  speed: number
  spin: number
  sway: number
  size: number
}

export function Petals({ count = 420 }: { count?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const petals = useMemo<Petal[]>(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * 130,
        y: Math.random() * 24,
        z: (Math.random() - 0.5) * 150 - 10,
        speed: 0.5 + Math.random() * 1.5,
        spin: (Math.random() - 0.5) * 2,
        sway: Math.random() * Math.PI * 2,
        size: 0.07 + Math.random() * 0.07,
      })),
    [count],
  )

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime
    petals.forEach((petal, i) => {
      petal.y -= petal.speed * dt
      petal.sway += dt * (0.6 + petal.speed * 0.3)
      if (petal.y < -1) {
        petal.y = 22 + Math.random() * 4
        petal.x = (Math.random() - 0.5) * 130
        petal.z = (Math.random() - 0.5) * 150 - 10
      }

      dummy.position.set(
        petal.x + Math.sin(petal.sway) * 1.1,
        petal.y,
        petal.z + Math.cos(petal.sway * 0.7) * 0.8,
      )
      dummy.rotation.set(petal.sway, t * petal.spin, petal.sway * 0.6)
      dummy.scale.setScalar(petal.size)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial
        color="#ffc6da"
        emissive="#ff8fba"
        emissiveIntensity={0.18}
        side={THREE.DoubleSide}
        transparent
        opacity={0.92}
      />
    </instancedMesh>
  )
}
