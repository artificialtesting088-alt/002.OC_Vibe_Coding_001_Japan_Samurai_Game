import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { asset, mulberry32, terrainHeight } from '../game'
import { HOUSE_SPOTS } from '../layout'
import { NPCS } from '../npcs'

const KEEPOUT = [
  { x: 0, z: 12, r: 6 },
  { x: 0, z: -9, r: 6 },
  { x: 0, z: -36, r: 8 },
  ...HOUSE_SPOTS.map((house) => ({ x: house.position[0], z: house.position[1], r: 6.5 })),
  ...NPCS.map((npc) => ({ x: npc.position[0], z: npc.position[1], r: 3 })),
]

function isFree(x: number, z: number) {
  if (Math.hypot(x, z) < 20) return false
  if (Math.abs(x) < 8 && z < 16 && z > -46) return false
  return KEEPOUT.every((zone) => Math.hypot(x - zone.x, z - zone.z) > zone.r)
}

export function JacarandaTrees() {
  const gltf = useGLTF(asset('models/jacaranda_tree/tree_low.gltf'))

  const { instances } = useMemo(() => {
    gltf.scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      child.castShadow = true
      child.receiveShadow = true
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      for (const material of materials) {
        if (material.name.includes('leaves') && material instanceof THREE.MeshStandardMaterial) {
          material.color.set('#ffffff')
          material.emissive.set('#3d1727')
          material.emissiveIntensity = 0.18
          material.side = THREE.DoubleSide
          material.alphaTest = 0.35
          material.needsUpdate = true
        }
      }
    })

    const box = new THREE.Box3().setFromObject(gltf.scene)
    const size = new THREE.Vector3()
    box.getSize(size)
    const baseScale = 8.6 / Math.max(size.y, 0.001)

    const rand = mulberry32(7777)
    const placements: { x: number; z: number; scale: number; rotation: number }[] = []
    let attempts = 0
    while (placements.length < 14 && attempts < 600) {
      attempts++
      const x = (rand() - 0.5) * 170
      const z = (rand() - 0.5) * 170
      if (!isFree(x, z)) continue
      placements.push({ x, z, scale: 0.8 + rand() * 0.5, rotation: rand() * Math.PI * 2 })
    }

    const clones = placements.map((placement) => {
      const clone = gltf.scene.clone(true)
      const scale = baseScale * placement.scale
      clone.scale.setScalar(scale)
      clone.rotation.y = placement.rotation
      clone.position.set(placement.x, terrainHeight(placement.x, placement.z) - box.min.y * scale, placement.z)
      return clone
    })

    return { instances: clones }
  }, [gltf.scene])

  return (
    <>
      {instances.map((tree, index) => (
        <primitive key={index} object={tree} />
      ))}
    </>
  )
}

export function Boulders() {
  const gltf = useGLTF(asset('models/boulder_01/boulder_low.glb'))

  const instances = useMemo(() => {
    const box = new THREE.Box3().setFromObject(gltf.scene)
    const size = new THREE.Vector3()
    box.getSize(size)
    const baseScale = 2.2 / Math.max(size.y, 0.001)

    const rand = mulberry32(2024)
    const result: THREE.Object3D[] = []
    for (let i = 0; i < 8; i++) {
      const angle = rand() * Math.PI * 2
      const distance = 16 + rand() * 42
      const x = Math.cos(angle) * distance
      const z = Math.sin(angle) * distance
      if (!isFree(x, z)) continue
      const scale = baseScale * (0.5 + rand() * 0.9)
      const clone = gltf.scene.clone(true)
      clone.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })
      clone.scale.setScalar(scale)
      clone.rotation.y = rand() * Math.PI * 2
      clone.position.set(x, terrainHeight(x, z) - box.min.y * scale, z)
      result.push(clone)
    }
    return result
  }, [gltf.scene])

  return (
    <>
      {instances.map((rock, index) => (
        <primitive key={index} object={rock} />
      ))}
    </>
  )
}
