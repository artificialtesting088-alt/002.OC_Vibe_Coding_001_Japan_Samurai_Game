import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mulberry32, terrainHeight } from '../game'

function Bamboo({
  position,
  seed,
}: {
  position: [number, number, number]
  seed: number
}) {
  const rand = useMemo(() => mulberry32(seed), [seed])
  const height = 5 + rand() * 4.5
  const lean = (rand() - 0.5) * 0.28
  const spin = rand() * Math.PI

  return (
    <group position={position} rotation={[0, spin, lean]}>
      <mesh castShadow position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.07, 0.12, height, 6]} />
        <meshStandardMaterial color="#6f8f46" roughness={0.85} metalness={0} />
      </mesh>

      {[0.5, 0.68, 0.84, 0.96].map((fraction, i) => (
        <mesh
          key={i}
          position={[0, height * fraction, 0]}
          rotation={[0.35 * (i - 1.5), 0, 0.55 + i * 0.1]}
        >
          <coneGeometry args={[0.55, 1.05, 5]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#7fa94e' : '#6f9a45'} roughness={0.9} metalness={0} />
        </mesh>
      ))}
    </group>
  )
}

function Grass({ count = 1600 }: { count?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const blades = useMemo(() => {
    const rand = mulberry32(90210)
    return Array.from({ length: count }, () => {
      const x = (rand() - 0.5) * 150
      const z = (rand() - 0.5) * 150
      return {
        x,
        z,
        y: terrainHeight(x, z),
        scale: 0.35 + rand() * 0.8,
        rot: rand() * Math.PI,
      }
    })
  }, [count])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    blades.forEach((blade, i) => {
      dummy.position.set(blade.x, blade.y + 0.18 * blade.scale, blade.z)
      dummy.rotation.set(Math.sin(t * 1.4 + blade.x) * 0.12, blade.rot, 0)
      dummy.scale.set(0.5 * blade.scale, blade.scale, 0.5 * blade.scale)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} receiveShadow>
      <coneGeometry args={[0.16, 0.7, 3]} />
      <meshStandardMaterial color="#6e8b40" roughness={1} metalness={0} />
    </instancedMesh>
  )
}

export function Vegetation() {
  const bamboo = useMemo(() => {
    const rand = mulberry32(1337)
    const stalks: { p: [number, number, number]; seed: number }[] = []

    for (let i = 0; i < 120; i++) {
      const x = (rand() - 0.5) * 210
      const z = -25 - rand() * 150
      stalks.push({
        p: [x, terrainHeight(x, z), z],
        seed: 5000 + i,
      })
    }

    return stalks
  }, [])

  return (
    <>
      {bamboo.map((stalk, i) => (
        <Bamboo key={i} position={stalk.p} seed={stalk.seed} />
      ))}
      <Grass />
    </>
  )
}
