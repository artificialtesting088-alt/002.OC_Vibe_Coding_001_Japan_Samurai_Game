import { useMemo } from 'react'
import * as THREE from 'three'
import { mulberry32, terrainHeight } from '../game'
import { HOUSE_SPOTS } from '../layout'
import { Toon } from './Toon'

const CRIMSON = '#c8352b'
const DARK_RED = '#8f241f'
const STONE = '#8b8a82'
const WOOD = '#4b3527'
const PLASTER = '#e8ddc6'
const ROOF = '#3b3f4a'

function Torii({
  position,
  rotation = 0,
  scale = 1,
}: {
  position: [number, number, number]
  rotation?: number
  scale?: number
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <mesh castShadow position={[-2.3, 3.2, 0]}>
        <cylinderGeometry args={[0.34, 0.46, 6.4, 8]} />
        <Toon color={CRIMSON} />
      </mesh>
      <mesh castShadow position={[2.3, 3.2, 0]}>
        <cylinderGeometry args={[0.34, 0.46, 6.4, 8]} />
        <Toon color={CRIMSON} />
      </mesh>
      <mesh castShadow position={[0, 6.4, 0]}>
        <boxGeometry args={[6.4, 0.42, 0.5]} />
        <Toon color={CRIMSON} />
      </mesh>
      <mesh castShadow position={[0, 5.45, 0]}>
        <boxGeometry args={[5.4, 0.3, 0.36]} />
        <Toon color={CRIMSON} />
      </mesh>
      <mesh castShadow position={[0, 6.9, 0]}>
        <boxGeometry args={[7.2, 0.26, 0.72]} />
        <Toon color={DARK_RED} />
      </mesh>
    </group>
  )
}

function StoneLantern({
  position,
  light = false,
}: {
  position: [number, number, number]
  light?: boolean
}) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.34, 0.5, 0.44, 6]} />
        <Toon color={STONE} />
      </mesh>
      <mesh castShadow position={[0, 0.95, 0]}>
        <cylinderGeometry args={[0.17, 0.22, 1.15, 6]} />
        <Toon color={STONE} />
      </mesh>
      <mesh castShadow position={[0, 1.62, 0]}>
        <boxGeometry args={[0.55, 0.5, 0.55]} />
        <Toon color="#ffd9a0" emissive="#ffb45e" emissiveIntensity={2.2} />
      </mesh>
      <mesh castShadow position={[0, 2.02, 0]}>
        <coneGeometry args={[0.52, 0.42, 4]} />
        <Toon color={STONE} />
      </mesh>
      {light && <pointLight position={[0, 1.62, 0]} color="#ffb45e" intensity={9} distance={10} decay={2} />}
    </group>
  )
}

function House({
  position,
  rotation = 0,
  scale = 1,
}: {
  position: [number, number, number]
  rotation?: number
  scale?: number
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <mesh castShadow receiveShadow position={[0, 1.25, 0]}>
        <boxGeometry args={[4.2, 2.5, 3.4]} />
        <Toon color={PLASTER} />
      </mesh>

      <mesh castShadow position={[0, 1.1, 1.72]}>
        <boxGeometry args={[1.2, 1.9, 0.12]} />
        <Toon color={WOOD} />
      </mesh>

      {[-1.9, 1.9].map((x) =>
        [-1.55, 1.55].map((z) => (
          <mesh key={`${x}-${z}`} castShadow position={[x, 1.25, z]}>
            <boxGeometry args={[0.16, 2.5, 0.16]} />
            <Toon color={WOOD} />
          </mesh>
        )),
      )}

      <mesh castShadow position={[0, 2.55, 0]}>
        <boxGeometry args={[4.6, 0.14, 3.8]} />
        <Toon color={ROOF} />
      </mesh>
      <mesh castShadow position={[0, 2.9, 1.05]} rotation={[0.52, 0, 0]}>
        <boxGeometry args={[4.9, 0.16, 2.2]} />
        <Toon color={ROOF} />
      </mesh>
      <mesh castShadow position={[0, 2.9, -1.05]} rotation={[-0.52, 0, 0]}>
        <boxGeometry args={[4.9, 0.16, 2.2]} />
        <Toon color={ROOF} />
      </mesh>
      <mesh castShadow position={[0, 3.5, 0]}>
        <boxGeometry args={[5.1, 0.16, 0.3]} />
        <Toon color={DARK_RED} />
      </mesh>
    </group>
  )
}

function Pagoda({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[6.4, 1, 6.4]} />
        <Toon color="#9b9484" />
      </mesh>
      {[0, 1, 2].map((level) => {
        const width = 5 - level * 0.8
        return (
          <group key={level} position={[0, level * 2.7, 0]}>
            <mesh castShadow position={[0, 1.65, 0]}>
              <boxGeometry args={[width, 2.2, width]} />
              <Toon color={PLASTER} />
            </mesh>
            {[-1, 1].map((sx) => (
              <mesh key={`w${sx}`} castShadow position={[sx * width * 0.46, 1.65, 0]}>
                <boxGeometry args={[0.14, 2.2, 0.14]} />
                <Toon color={WOOD} />
              </mesh>
            ))}
            <mesh castShadow position={[0, 3.05, 0]} rotation={[0, Math.PI / 4, 0]}>
              <coneGeometry args={[width * 0.92, 1.15, 4]} />
              <Toon color={DARK_RED} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

function MountFuji() {
  return (
    <group position={[110, -26, -330]}>
      <mesh>
        <coneGeometry args={[120, 96, 40]} />
        <meshStandardMaterial color="#5c6f8d" roughness={1} flatShading />
      </mesh>
      <mesh position={[0, 34, 0]}>
        <coneGeometry args={[42, 28, 40]} />
        <meshStandardMaterial color="#edf2ff" roughness={1} flatShading />
      </mesh>
    </group>
  )
}

function PathStones() {
  const stones = useMemo(() => {
    const rand = mulberry32(4242)
    return Array.from({ length: 12 }, (_, i) => {
      const z = 10 - i * 2.6
      const x = Math.sin(i * 0.7) * 0.9
      return {
        p: [x, terrainHeight(x, z) + 0.04, z] as [number, number, number],
        r: rand() * Math.PI,
        s: 0.55 + rand() * 0.25,
      }
    })
  }, [])

  return (
    <>
      {stones.map((stone, i) => (
        <mesh key={i} position={stone.p} rotation={[-Math.PI / 2, 0, stone.r]} receiveShadow>
          <cylinderGeometry args={[stone.s, stone.s, 0.1, 7]} />
          <Toon color="#9a978c" />
        </mesh>
      ))}
    </>
  )
}

export function Structures() {
  return (
    <>
      <MountFuji />
      <PathStones />

      <Torii position={[0, terrainHeight(0, -9), -9]} />

      <Pagoda position={[0, terrainHeight(0, -36), -36]} />

      {HOUSE_SPOTS.map((house, index) => (
        <House
          key={index}
          position={[house.position[0], terrainHeight(house.position[0], house.position[1]), house.position[1]]}
          rotation={house.rotation}
          scale={house.scale}
        />
      ))}

      <StoneLantern position={[3.1, terrainHeight(3.1, 8), 8]} light />
      <StoneLantern position={[-3.1, terrainHeight(-3.1, 8), 8]} light />
      <StoneLantern position={[3.1, terrainHeight(3.1, 1), 1]} />
      <StoneLantern position={[-3.1, terrainHeight(-3.1, 1), 1]} />
      <StoneLantern position={[3.4, terrainHeight(3.4, -16), -16]} />
      <StoneLantern position={[-3.4, terrainHeight(-3.4, -16), -16]} />

      <mesh position={[0, terrainHeight(0, 12) + 0.02, 12]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[1.4, 1.75, 32]} />
        <meshStandardMaterial color="#8f2a22" side={THREE.DoubleSide} transparent opacity={0.5} />
      </mesh>
    </>
  )
}
