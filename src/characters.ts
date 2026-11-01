import * as THREE from 'three'

const probe = new THREE.Vector3()

type Height = { minY: number; height: number }

function boxHeight(scene: THREE.Object3D): Height {
  const box = new THREE.Box3().setFromObject(scene)
  return { minY: box.min.y, height: box.max.y - box.min.y }
}

function skinnedHeight(scene: THREE.Object3D): Height | null {
  scene.updateMatrixWorld(true)

  let minY = Infinity
  let maxY = -Infinity
  let found = false

  scene.traverse((object) => {
    if (!(object instanceof THREE.SkinnedMesh)) return
    found = true
    const positions = object.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < positions.count; i++) {
      object.getVertexPosition(i, probe)
      probe.applyMatrix4(object.matrixWorld)
      minY = Math.min(minY, probe.y)
      maxY = Math.max(maxY, probe.y)
    }
  })

  return found ? { minY, height: maxY - minY } : null
}

function measure(scene: THREE.Object3D): Height {
  return skinnedHeight(scene) ?? boxHeight(scene)
}

export function normalizeHeight(scene: THREE.Object3D, targetHeight: number) {
  const initial = measure(scene)
  if (!Number.isFinite(initial.height) || initial.height <= 0) return 1

  const factor = targetHeight / initial.height
  scene.scale.multiplyScalar(factor)
  scene.updateMatrixWorld(true)

  const adjusted = measure(scene)
  scene.position.y -= adjusted.minY
  scene.updateMatrixWorld(true)

  return factor
}
