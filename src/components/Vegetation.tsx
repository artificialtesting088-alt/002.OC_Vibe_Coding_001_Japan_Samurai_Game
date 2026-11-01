import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mulberry32, terrainHeight } from '../game'
import { HOUSE_SPOTS } from '../layout'
import { NPCS } from '../npcs'

type Stalk = {
  x: number
  y: number
  z: number
  height: number
  lean: number
  spin: number
}

function bambooFree(x: number, z: number) {
  if (Math.abs(x) < 10 && z > -50) return false
  if (HOUSE_SPOTS.some((house) => Math.hypot(x - house.position[0], z - house.position[1]) < 7)) return false
  if (NPCS.some((npc) => Math.hypot(x - npc.position[0], z - npc.position[1]) < 3)) return false
  return true
}

function Bamboo({ stalks }: { stalks: Stalk[] }) {
  const trunks = useRef<THREE.InstancedMesh>(null!)
  const leaves = useRef<THREE.InstancedMesh>(null!)

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D()
    const base = new THREE.Matrix4()
    const trunkMatrix = new THREE.Matrix4()
    const leafMatrix = new THREE.Matrix4()
    let leafIndex = 0

    stalks.forEach((stalk, index) => {
      dummy.position.set(stalk.x, stalk.y, stalk.z)
      dummy.rotation.set(0, stalk.spin, stalk.lean)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      base.copy(dummy.matrix)

      trunkMatrix
        .copy(base)
        .multiply(new THREE.Matrix4().makeTranslation(0, stalk.height / 2, 0))
        .multiply(new THREE.Matrix4().makeScale(1, stalk.height, 1))
      trunks.current.setMatrixAt(index, trunkMatrix)

      for (let i = 0; i < 4; i++) {
        dummy.position.set(0, stalk.height * [0.5, 0.68, 0.84, 0.96][i], 0)
        dummy.rotation.set(0.35 * (i - 1.5), 0, 0.55 + i * 0.1)
        dummy.scale.set(1, 1, 1)
        dummy.updateMatrix()
        leafMatrix.copy(base).multiply(dummy.matrix)
        leaves.current.setMatrixAt(leafIndex++, leafMatrix)
      }
    })

    trunks.current.instanceMatrix.needsUpdate = true
    leaves.current.instanceMatrix.needsUpdate = true
    trunks.current.computeBoundingSphere()
    leaves.current.computeBoundingSphere()
  }, [stalks])

  return (
    <>
      <instancedMesh ref={trunks} args={[undefined, undefined, stalks.length]} castShadow frustumCulled={false}>
        <cylinderGeometry args={[0.07, 0.12, 1, 6]} />
        <meshStandardMaterial color="#6f8f46" roughness={0.85} metalness={0} />
      </instancedMesh>
      <instancedMesh ref={leaves} args={[undefined, undefined, stalks.length * 4]} castShadow frustumCulled={false}>
        <coneGeometry args={[0.55, 1.05, 5]} />
        <meshStandardMaterial color="#7da64c" roughness={0.9} metalness={0} />
      </instancedMesh>
    </>
  )
}

function Grass({ count = 1200 }: { count?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null!)

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
        lean: (rand() - 0.5) * 0.18,
      }
    })
  }, [count])

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D()
    blades.forEach((blade, i) => {
      dummy.position.set(blade.x, blade.y + 0.18 * blade.scale, blade.z)
      dummy.rotation.set(blade.lean, blade.rot, 0)
      dummy.scale.set(0.5 * blade.scale, blade.scale, 0.5 * blade.scale)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
    mesh.current.computeBoundingSphere()
  }, [blades])

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} receiveShadow frustumCulled={false}>
      <coneGeometry args={[0.16, 0.7, 3]} />
      <meshStandardMaterial color="#6e8b40" roughness={1} metalness={0} />
    </instancedMesh>
  )
}

export function Vegetation() {
  const bamboo = useMemo(() => {
    const rand = mulberry32(1337)
    const stalks: Stalk[] = []
    let attempts = 0

    while (stalks.length < 120 && attempts < 4000) {
      attempts++
      const x = (rand() - 0.5) * 210
      const z = -25 - rand() * 150
      if (!bambooFree(x, z)) continue
      stalks.push({
        x,
        y: terrainHeight(x, z),
        z,
        height: 5 + rand() * 4.5,
        lean: (rand() - 0.5) * 0.28,
        spin: rand() * Math.PI,
      })
    }

    return stalks
  }, [])

  return (
    <>
      <Bamboo stalks={bamboo} />
      <Grass />
    </>
  )
}
