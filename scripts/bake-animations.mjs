#!/usr/bin/env node
// Bake Mixamo-compatible clips from the CC0 Quaternius Universal Animation
// Library onto the Grab3D samurai skeleton. Source files are not committed:
//   .raw/samurai.glb        Grab3D samurai-rigged GLB, textures stripped
//   .prev/.../AnimationLibrary_Godot_Standard.glb   Quaternius UAL (CC0)
//
// Usage: node scripts/bake-animations.mjs
import fs from 'node:fs'
import path from 'node:path'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { retargetClip } from 'three/examples/jsm/utils/SkeletonUtils.js'

const root = path.resolve(import.meta.dirname, '..')
const outDir = path.join(root, 'public/assets/animations')
const targetPath = path.join(root, '.raw/samurai-notex.glb')
const sourcePath = path.join(root, '.prev/Animation Library[Standard]/Godot/AnimationLibrary_Godot_Standard.glb')
const clips = ['Sword_Attack', 'Punch_Jab', 'Idle_Loop']
const trims = {
  Sword_Attack: [0.18, 0.45],
  Punch_Jab: [0.13, 0.46],
}

const loader = new GLTFLoader()
async function load(file) {
  const buffer = fs.readFileSync(file)
  return loader.parseAsync(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength), '')
}

function firstSkinned(object) {
  let found = null
  object.traverse((child) => {
    if (!found && child.isSkinnedMesh) found = child
  })
  return found
}

const target = firstSkinned((await load(targetPath)).scene)
const sourceGltf = await load(sourcePath)
const source = firstSkinned(sourceGltf.scene)

const names = {
  Hips: 'DEF-hips',
  Spine: 'DEF-spine001', Spine01: 'DEF-spine002', Spine02: 'DEF-spine003',
  neck: 'DEF-neck', Head: 'DEF-head',
  LeftShoulder: 'DEF-shoulderL', LeftArm: 'DEF-upper_armL', LeftForeArm: 'DEF-forearmL', LeftHand: 'DEF-handL',
  RightShoulder: 'DEF-shoulderR', RightArm: 'DEF-upper_armR', RightForeArm: 'DEF-forearmR', RightHand: 'DEF-handR',
  LeftUpLeg: 'DEF-thighL', LeftLeg: 'DEF-shinL', LeftFoot: 'DEF-footL', LeftToeBase: 'DEF-toeL',
  RightUpLeg: 'DEF-thighR', RightLeg: 'DEF-shinR', RightFoot: 'DEF-footR', RightToeBase: 'DEF-toeR',
}
for (const side of ['L', 'R']) {
  const prefix = side === 'L' ? 'Left' : 'Right'
  for (const [finger, rigify] of [['Index', 'f_index'], ['Middle', 'f_middle'], ['Pinky', 'f_pinky'], ['Ring', 'f_ring'], ['Thumb', 'thumb']]) {
    for (let joint = 1; joint <= 3; joint++) {
      names[`${prefix}Hand${finger}${joint}`] = `DEF-${rigify}0${joint}${side}`
    }
  }
}

function trimClip(clip, start, end) {
  const tracks = clip.tracks.map((track) => {
    const times = []
    const values = []
    for (let i = 0; i < track.times.length; i++) {
      const time = track.times[i]
      if (time < start || time > end) continue
      times.push(time - start)
      for (let j = 0; j < track.getValueSize(); j++) values.push(track.values[i * track.getValueSize() + j])
    }
    return new THREE.QuaternionKeyframeTrack(track.name, times, values)
  })
  return new THREE.AnimationClip(clip.name, end - start, tracks)
}

const CORE_BONES = new Set([
  'Hips',
  'Spine', 'Spine01', 'Spine02', 'neck', 'Head',
  'LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand',
  'RightShoulder', 'RightArm', 'RightForeArm', 'RightHand',
  'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'LeftToeBase',
  'RightUpLeg', 'RightLeg', 'RightFoot', 'RightToeBase',
])

fs.mkdirSync(outDir, { recursive: true })
const bakedClips = []
for (const name of clips) {
  const clip = sourceGltf.animations.find((candidate) => candidate.name === name)
  if (!clip) {
    console.warn('missing clip', name)
    continue
  }
  const baked = retargetClip(target, source, clip, { fps: 30, hip: 'Hips', names, useFirstFramePosition: false })
  const trim = trims[name]
  const finalClip = trim ? trimClip(baked, baked.duration * trim[0], baked.duration * trim[1]) : baked
  const tracks = finalClip.tracks.flatMap((track) => {
    const match = /^\.bones\[(.+)\]\.(\w+)$/.exec(track.name)
    const bone = match ? match[1] : track.name.split('.')[0]
    if (!CORE_BONES.has(bone)) return []
    return [{
      name: `${bone}.${match ? match[2] : track.name.split('.')[1]}`,
      type: 'quaternion',
      times: Array.from(track.times),
      values: Array.from(track.values),
    }]
  })
  bakedClips.push({ name, duration: finalClip.duration, tracks })
  console.log(name, finalClip.duration.toFixed(3), tracks.length, 'tracks')
}
fs.writeFileSync(path.join(outDir, 'player.json'), JSON.stringify({ clips: bakedClips }))
