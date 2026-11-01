import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mulberry32, terrainHeight } from '../game'
import { Toon } from './Toon'

const SAKURA_PALETTE = ['#ffc2d6', '#ffb0c9', '#ffd7e4', '#f79bbd', '#ffe6f0', '#ff9fc0']

function Sakura({
  position,
  scale,
  seed,
}: {
  position: [number, number, number]
  scale: number
  seed: number
}) {
  const rand = useMemo(() => mulberry32(seed), [seed])

  const blobs = useMemo(() => {
    const result: { p: [number, number, number]; s: number; c: string }[] = []
    for (let i = 0; i < 9; i++) {
      const angle = rand() * Math.PI * 2
      const radius = 0.5 + rand() * 2.2
      result.push({
        p: [Math.cos(angle) * radius, 3.9 + rand() * 2.4, Math.sin(angle) * radius],
        s: 0.85 + rand() * 1.05,
        c: SAKURA_PALETTE[Math.floor(rand() * SAKURA_PALETTE.length)],
      })
    }
    return result
  }, [rand])

  const branches = useMemo(() => {
    const result: { p: [number, number, number]; r: [number, number, number] }[] = []
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + 0.4
      result.push({
        p: [Math.cos(angle) * 0.7, 3.2 + i * 0.35, Math.sin(angle) * 0.7],
        r: [Math.cos(angle) * 0.5, 0, -Math.sin(angle) * 0.5],
      })
    }
    return result
  }, [])

  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 2.1, 0]}>
        <cylinderGeometry args={[0.22, 0.44, 4.2, 7]} />
        <Toon color="#5a3f2f" />
      </mesh>

      {branches.map((branch, i) => (
        <mesh key={i} position={branch.p} rotation={branch.r}>
          <cylinderGeometry args={[0.07, 0.16, 2.6, 5]} />
          <Toon color="#5a3f2f" />
        </mesh>
      ))}

      {blobs.map((blob, i) => (
        <mesh key={i} position={blob.p}>
          <icosahedronGeometry args={[blob.s, 1]} />
          <Toon color={blob.c} emissive="#ff8fb8" emissiveIntensity={0.09} />
        </mesh>
      ))}
    </group>
  )
}

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
        <Toon color="#6f9a4b" />
      </mesh>

      {[0.5, 0.68, 0.84, 0.96].map((fraction, i) => (
        <mesh
          key={i}
          position={[0, height * fraction, 0]}
          rotation={[0.35 * (i - 1.5), 0, 0.55 + i * 0.1]}
        >
          <coneGeometry args={[0.55, 1.05, 4]} />
          <Toon color={i % 2 === 0 ? '#8fbf5a' : '#7fb04e'} />
        </mesh>
      ))}
    </group>
  )
}

function Grass({ count = 900 }: { count?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const blades = useMemo(() => {
    const rand = mulberry32(90210)
    return Array.from({ length: count }, () => {
      const x = (rand() - 0.5) * 200
      const z = (rand() - 0.5) * 200
      return {
        x,
        z,
        y: terrainHeight(x, z),
        scale: 0.35 + rand() * 0.7,
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
      <meshToonMaterial color="#7c9a4a" />
    </instancedMesh>
  )
}

export function Vegetation() {
  const { sakura, bamboo } = useMemo(() => {
    const rand = mulberry32(1337)
    const sakuraTrees: { p: [number, number, number]; s: number; seed: number }[] = []
    const bambooStalks: { p: [number, number, number]; seed: number }[] = []

    for (let i = 0; i < 46; i++) {
      const x = (rand() - 0.5) * 230
      const z = (rand() - 0.5) * 230
      if (Math.hypot(x, z) < 24) continue
      if (z < -150) continue
      sakuraTrees.push({
        p: [x, terrainHeight(x, z), z],
        s: 0.85 + rand() * 0.75,
        seed: 1000 + i,
      })
    }

    for (let i = 0; i < 120; i++) {
      const x = (rand() - 0.5) * 210
      const z = -25 - rand() * 150
      bambooStalks.push({
        p: [x, terrainHeight(x, z), z],
        seed: 5000 + i,
      })
    }

    return { sakura: sakuraTrees, bamboo: bambooStalks }
  }, [])

  return (
    <>
      {sakura.map((tree, i) => (
        <Sakura key={`s${i}`} position={tree.p} scale={tree.s} seed={tree.seed} />
      ))}
      {bamboo.map((stalk, i) => (
        <Bamboo key={`b${i}`} position={stalk.p} seed={stalk.seed} />
      ))}
      <Grass />
    </>
  )
}
