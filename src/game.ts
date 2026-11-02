import * as THREE from 'three'

export const asset = (path: string) => `${import.meta.env.BASE_URL}assets/${path}`

export function terrainHeight(x: number, z: number): number {
  return (
    Math.sin(x * 0.045) * Math.cos(z * 0.037) * 2.4 +
    Math.sin(x * 0.013 + z * 0.02) * 4.2 +
    Math.cos(z * 0.07 + 1.2) * 0.7
  )
}

export function mulberry32(seed: number) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const playerTransform = {
  position: new THREE.Vector3(0, terrainHeight(0, 12), 12),
  moving: false,
  sprinting: false,
  speed: 0,
  yaw: 0,
  guarding: false,
  parryUntil: 0,
}

export const cameraLook = {
  yaw: 0,
  pitch: 0.34,
}
