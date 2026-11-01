import * as THREE from 'three'
import { asset } from './game'

type TrackData = {
  name: string
  type: 'quaternion'
  times: number[]
  values: number[]
}

type BakedClip = {
  name: string
  duration: number
  tracks: TrackData[]
}

type BakedFile = {
  clips: BakedClip[]
}

let cache: Promise<Record<string, THREE.AnimationClip>> | null = null

export function loadPlayerClips() {
  if (cache) return cache

  cache = fetch(asset('animations/player.json'))
    .then((response) => {
      if (!response.ok) throw new Error(`Gagal memuat animasi tempur (${response.status})`)
      return response.json() as Promise<BakedFile>
    })
    .then((data) => {
      const entries = data.clips.map((clip) => {
        const tracks = clip.tracks.map(
          (track) => new THREE.QuaternionKeyframeTrack(track.name, track.times, track.values),
        )
        return [clip.name.toLowerCase(), new THREE.AnimationClip(clip.name, clip.duration, tracks)] as const
      })
      return Object.fromEntries(entries)
    })

  return cache
}
