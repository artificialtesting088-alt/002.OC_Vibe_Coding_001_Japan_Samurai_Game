import * as THREE from 'three'

export function createKatana() {
  const katana = new THREE.Group()
  katana.name = 'Katana'

  const steel = new THREE.MeshStandardMaterial({
    color: '#e8f2ff',
    metalness: 1,
    roughness: 0.16,
    emissive: new THREE.Color('#3f6b8c'),
    emissiveIntensity: 0.35,
  })
  const wrap = new THREE.MeshStandardMaterial({ color: '#181820', roughness: 0.92, metalness: 0.1 })
  const bronze = new THREE.MeshStandardMaterial({ color: '#9b7a3a', roughness: 0.34, metalness: 0.9 })

  const blade = new THREE.Mesh(new THREE.BoxGeometry(2.5, 74, 0.75), steel)
  blade.position.y = 48
  blade.castShadow = true
  katana.add(blade)

  const tip = new THREE.Mesh(new THREE.ConeGeometry(1.75, 9, 4), steel)
  tip.position.y = 89.5
  tip.rotation.y = Math.PI / 4
  tip.scale.z = 0.42
  tip.castShadow = true
  katana.add(tip)

  const guard = new THREE.Mesh(new THREE.CylinderGeometry(4.1, 4.1, 1.4, 10), bronze)
  guard.position.y = 11
  guard.castShadow = true
  katana.add(guard)

  const grip = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.3, 22, 8), wrap)
  grip.position.y = 0
  grip.castShadow = true
  katana.add(grip)

  const pommel = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 2, 8), bronze)
  pommel.position.y = -11.4
  pommel.castShadow = true
  katana.add(pommel)

  return katana
}
