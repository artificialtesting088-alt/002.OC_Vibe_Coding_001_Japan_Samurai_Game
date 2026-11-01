export type HouseSpot = {
  position: [number, number]
  rotation: number
  scale: number
}

export const HOUSE_SPOTS: HouseSpot[] = [
  { position: [-12, 3], rotation: 0.5, scale: 1 },
  { position: [12.5, 4], rotation: -0.5, scale: 0.95 },
  { position: [-14, -7], rotation: 0.9, scale: 0.85 },
  { position: [14, -8], rotation: -0.8, scale: 0.9 },
  { position: [-23, 14], rotation: 0.35, scale: 0.95 },
  { position: [23, 15], rotation: -0.4, scale: 0.9 },
  { position: [-27, -18], rotation: 0.9, scale: 0.82 },
  { position: [28, -18], rotation: -0.9, scale: 0.88 },
  { position: [-24, -36], rotation: 0.2, scale: 0.92 },
  { position: [24, -34], rotation: -0.3, scale: 0.86 },
]
