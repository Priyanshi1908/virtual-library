import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RoundedBox, Sparkles, useGLTF, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { bookPalette } from '../data/library'
import { setWorldInvalidator } from '../worldRender'
import PerformanceProbe from '../performance/PerformanceProbe'

let scenePreparationCount = 0

const LEATHER_TEXTURES = {
  normalMap: '/assets/textures/brown-leather/brown_leather_nor_gl_1k.jpg',
  armMap: '/assets/textures/brown-leather/brown_leather_arm_1k.jpg',
}
const DARK_WOOD_TEXTURES = {
  map: '/assets/textures/dark-wood/dark_wood_diff_2k.jpg',
  aoMap: '/assets/textures/dark-wood/dark_wood_ao_2k.jpg',
  armMap: '/assets/textures/dark-wood/dark_wood_arm_2k.jpg',
  normalMap: '/assets/textures/dark-wood/dark_wood_nor_gl_2k.jpg',
}
const ENTRANCE_STONE_TEXTURES = {
  map: '/assets/textures/stone-wall-04/stone_wall_04_diff_2k.jpg',
  armMap: '/assets/textures/stone-wall-04/stone_wall_04_arm_2k.jpg',
  normalMap: '/assets/textures/stone-wall-04/stone_wall_04_nor_gl_2k.jpg',
}
const TABLE_TEXTURES = {
  map: '/assets/textures/wood-table-worn/wood_table_worn_diff_1k.jpg',
  normalMap: '/assets/textures/wood-table-worn/wood_table_worn_nor_gl_1k.jpg',
  armMap: '/assets/textures/wood-table-worn/wood_table_worn_arm_1k.jpg',
}
const HALL_TEXTURES = {
  wallMap: '/assets/textures/medieval-wall-02/medieval_wall_02_diff_1k.jpg',
  wallArm: '/assets/textures/medieval-wall-02/medieval_wall_02_arm_1k.jpg',
  wallNormal: '/assets/textures/medieval-wall-02/medieval_wall_02_nor_gl_1k.jpg',
  floorMap: '/assets/textures/monastery-stone-floor/monastery_stone_floor_diff_1k.jpg',
  floorArm: '/assets/textures/monastery-stone-floor/monastery_stone_floor_arm_1k.jpg',
  floorNormal: '/assets/textures/monastery-stone-floor/monastery_stone_floor_nor_gl_1k.jpg',
  rugMap: '/assets/textures/antique-runner/antique-library-runner.png',
  ceilingMap: '/assets/textures/old-planks-02/old_planks_02_diff_1k.jpg',
  ceilingArm: '/assets/textures/old-planks-02/old_planks_02_arm_1k.jpg',
  ceilingNormal: '/assets/textures/old-planks-02/old_planks_02_nor_gl_1k.jpg',
}

const wood = new THREE.MeshStandardMaterial({ color: '#4a2818', roughness: 0.76, metalness: 0.01 })
const darkWood = new THREE.MeshStandardMaterial({ color: '#28140d', roughness: 0.9 })
const brass = new THREE.MeshStandardMaterial({ color: '#87531f', roughness: 0.3, metalness: 0.76 })
const stone = new THREE.MeshStandardMaterial({ color: '#31211a', roughness: 0.96 })
const vaultStone = new THREE.MeshStandardMaterial({ color: '#3f352f', roughness: 0.98, metalness: 0 })
const carvedOak = new THREE.MeshStandardMaterial({ color: '#392216', roughness: 0.9, metalness: 0 })
const doorTrim = new THREE.MeshPhysicalMaterial({
  color: '#3a180d',
  roughness: 0.84,
  metalness: 0,
  clearcoat: 0.015,
  clearcoatRoughness: 0.96,
  sheen: 0.08,
  sheenColor: new THREE.Color('#6d321a'),
  sheenRoughness: 0.92,
})
const blackenedIron = new THREE.MeshStandardMaterial({ color: '#100c0a', roughness: 0.34, metalness: 0.78 })
const parchment = new THREE.MeshStandardMaterial({ color: '#b89a68', roughness: 0.92, metalness: 0 })
const oxblood = new THREE.MeshStandardMaterial({ color: '#35100d', roughness: 0.91, metalness: 0 })
const forestLeather = new THREE.MeshStandardMaterial({ color: '#183128', roughness: 0.9, metalness: 0 })
const midnightLeather = new THREE.MeshStandardMaterial({ color: '#1a2733', roughness: 0.9, metalness: 0 })
const moonSky = new THREE.MeshBasicMaterial({ color: '#07101c', side: THREE.DoubleSide })
const moonDisc = new THREE.MeshBasicMaterial({ color: '#dce8eb', transparent: true, opacity: 0.9, side: THREE.DoubleSide })
const flameMaterial = new THREE.MeshBasicMaterial({ color: '#ffc071', toneMapped: false })
const lanternGlowMaterial = new THREE.MeshBasicMaterial({ color: '#ffb15a', transparent: true, opacity: 0.82, toneMapped: false })
const courtyardIron = new THREE.MeshStandardMaterial({ color: '#12100e', roughness: 0.4, metalness: 0.78 })
const courtyardFoliage = new THREE.MeshStandardMaterial({ color: '#17271f', roughness: 0.98, metalness: 0 })
const courtyardFoliageLight = new THREE.MeshStandardMaterial({ color: '#26372a', roughness: 0.98, metalness: 0 })
const courtyardTrunk = new THREE.MeshStandardMaterial({ color: '#302016', roughness: 0.96, metalness: 0 })
const courtyardRecess = new THREE.MeshStandardMaterial({ color: '#171b1d', emissive: '#071018', emissiveIntensity: 0.34, roughness: 0.94, metalness: 0 })
const courtyardWindow = new THREE.MeshStandardMaterial({ color: '#5a321b', emissive: '#c87734', emissiveIntensity: 1.65, transparent: true, opacity: 0.9, roughness: 0.72, metalness: 0, side: THREE.DoubleSide })
const courtyardSky = new THREE.MeshBasicMaterial({ color: '#07111b', side: THREE.BackSide, depthWrite: false, fog: false })
const interactionMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
const unitBoxGeometry = new THREE.BoxGeometry(1, 1, 1)
const courtyardFoliageGeometry = new THREE.IcosahedronGeometry(1, 1)
const courtyardTrunkGeometry = new THREE.CylinderGeometry(1, 1, 1, 9)
function createBookGeometry() {
  const source = new THREE.BoxGeometry(1, 1, 1).toNonIndexed()
  const positions = source.getAttribute('position')
  const normals = source.getAttribute('normal')
  const uvs = source.getAttribute('uv')
  const keptPositions = []
  const keptNormals = []
  const keptUvs = []
  for (let vertex = 0; vertex < positions.count; vertex += 3) {
    const ny = normals.getY(vertex)
    const nz = normals.getZ(vertex)
    if (ny < -0.9 || nz < -0.9) continue
    for (let corner = 0; corner < 3; corner += 1) {
      const index = vertex + corner
      keptPositions.push(positions.getX(index), positions.getY(index), positions.getZ(index))
      keptNormals.push(normals.getX(index), normals.getY(index), normals.getZ(index))
      keptUvs.push(uvs.getX(index), uvs.getY(index))
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(keptPositions, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(keptNormals, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(keptUvs, 2))
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  source.dispose()
  return geometry
}
const bookGeometry = createBookGeometry()
const doorPanelInsetGeometry = new THREE.BoxGeometry(1.23, 1.34, 0.04)
const doorPanelDetailGeometry = new THREE.OctahedronGeometry(0.1, 0)
const doorPanelTrimGeometry = new RoundedBoxGeometry(1.45, 1.58, 0.11, 2, 0.052)
const hingeBarrelGeometry = new THREE.CylinderGeometry(0.095, 0.095, 0.42, 12)
const hingeStudGeometry = new THREE.SphereGeometry(0.07, 12, 12)
const shelfPillarGeometry = new THREE.CylinderGeometry(0.13, 0.17, 1, 12)
const shelfCapitalGeometry = new THREE.CylinderGeometry(0.24, 0.16, 0.3, 12)
const vaultBossGeometry = new THREE.DodecahedronGeometry(0.3, 0)
const HALL_HALF_WIDTH = 23.5
const VAULT_HALF_WIDTH = 23.15
const TALL_LADDER_CENTER_Y = 6.72
const TALL_LADDER_LENGTH = 13.25
const TALL_LADDER_HALF_LENGTH = TALL_LADDER_LENGTH / 2
const TALL_LADDER_RUNG_START = -5.8
const TALL_LADDER_RUNG_STEP = 0.59
const TALL_LADDER_RUNG_COUNT = 21
const CLIMB_MAX_HEIGHT = 12.55

function vaultHeightAt(x) {
  return 13 + 10 * (1 - Math.pow(Math.min(1, Math.abs(x) / VAULT_HALF_WIDTH), 1.72))
}

function createGothicVaultSurface() {
  const geometry = new THREE.BufferGeometry()
  const positions = []
  const uvs = []
  const indices = []
  const segmentsX = 64
  const segmentsZ = 18
  for (let zIndex = 0; zIndex <= segmentsZ; zIndex += 1) {
    const z = 6 - (zIndex / segmentsZ) * 78
    for (let xIndex = 0; xIndex <= segmentsX; xIndex += 1) {
      const x = -VAULT_HALF_WIDTH + (xIndex / segmentsX) * VAULT_HALF_WIDTH * 2
      positions.push(x, vaultHeightAt(x), z)
      uvs.push(xIndex / segmentsX, zIndex / segmentsZ)
    }
  }
  for (let zIndex = 0; zIndex < segmentsZ; zIndex += 1) {
    for (let xIndex = 0; xIndex < segmentsX; xIndex += 1) {
      const a = zIndex * (segmentsX + 1) + xIndex
      const b = a + 1
      const c = a + segmentsX + 1
      const d = c + 1
      indices.push(a, b, c, b, d, c)
    }
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}

const gothicVaultGeometry = createGothicVaultSurface()
const vaultRibPoints = [-22.65, -17.8, -11.8, -5.8, -0.24, 0, 0.24, 5.8, 11.8, 17.8, 22.65]
  .map((x) => new THREE.Vector3(x, vaultHeightAt(x) - 0.08, 0))
const gothicVaultRibGeometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(vaultRibPoints, false, 'catmullrom', 0.12), 72, 0.14, 8, false)
const diagonalVaultRibGeometryA = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
  new THREE.Vector3(-22.65, 13, -7), new THREE.Vector3(-11.8, 18.1, -3.5), new THREE.Vector3(0, 22.9, 0),
  new THREE.Vector3(11.8, 18.1, 3.5), new THREE.Vector3(22.65, 13, 7),
], false, 'catmullrom', 0.18), 72, 0.2, 8, false)
const diagonalVaultRibGeometryB = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
  new THREE.Vector3(-22.65, 13, 7), new THREE.Vector3(-11.8, 18.1, 3.5), new THREE.Vector3(0, 22.9, 0),
  new THREE.Vector3(11.8, 18.1, -3.5), new THREE.Vector3(22.65, 13, -7),
], false, 'catmullrom', 0.18), 72, 0.2, 8, false)
const sideGothicArchGeometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 3.2, -5.6), new THREE.Vector3(0, 7.4, -4.7), new THREE.Vector3(0, 11.2, -1.1),
  new THREE.Vector3(0, 12.6, -0.16), new THREE.Vector3(0, 12.6, 0.16),
  new THREE.Vector3(0, 11.2, 1.1), new THREE.Vector3(0, 7.4, 4.7), new THREE.Vector3(0, 3.2, 5.6),
], false, 'catmullrom', 0.12), 64, 0.18, 8, false)
const clerestoryPaneShape = new THREE.Shape()
clerestoryPaneShape.moveTo(-0.9, -1.8)
clerestoryPaneShape.lineTo(-0.9, 0.62)
clerestoryPaneShape.lineTo(0, 2.02)
clerestoryPaneShape.lineTo(0.9, 0.62)
clerestoryPaneShape.lineTo(0.9, -1.8)
clerestoryPaneShape.closePath()
const clerestoryPaneGeometry = new THREE.ShapeGeometry(clerestoryPaneShape)
const courtyardArchShape = new THREE.Shape()
courtyardArchShape.moveTo(-1, -1.8)
courtyardArchShape.lineTo(-1, 0.38)
courtyardArchShape.bezierCurveTo(-1, 0.9, -0.52, 1.48, 0, 2.08)
courtyardArchShape.bezierCurveTo(0.52, 1.48, 1, 0.9, 1, 0.38)
courtyardArchShape.lineTo(1, -1.8)
courtyardArchShape.closePath()
const courtyardArchPaneGeometry = new THREE.ShapeGeometry(courtyardArchShape)
const courtyardArchFrameGeometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
  new THREE.Vector3(-1, -1.8, 0), new THREE.Vector3(-1, 0.42, 0),
  new THREE.Vector3(-0.72, 1.12, 0), new THREE.Vector3(0, 2.12, 0),
  new THREE.Vector3(0.72, 1.12, 0), new THREE.Vector3(1, 0.42, 0),
  new THREE.Vector3(1, -1.8, 0), new THREE.Vector3(-1, -1.8, 0),
], false, 'catmullrom', 0.08), 48, 0.07, 8, false)
const courtyardPortalFrameGeometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
  new THREE.Vector3(-1, -1.8, 0), new THREE.Vector3(-1, 0.42, 0),
  new THREE.Vector3(-0.72, 1.12, 0), new THREE.Vector3(0, 2.12, 0),
  new THREE.Vector3(0.72, 1.12, 0), new THREE.Vector3(1, 0.42, 0),
  new THREE.Vector3(1, -1.8, 0),
], false, 'catmullrom', 0.08), 44, 0.07, 8, false)
const clerestoryFrameGeometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
  new THREE.Vector3(-0.92, -1.82, 0), new THREE.Vector3(-0.92, 0.64, 0),
  new THREE.Vector3(0, 2.08, 0), new THREE.Vector3(0.92, 0.64, 0),
  new THREE.Vector3(0.92, -1.82, 0), new THREE.Vector3(-0.92, -1.82, 0),
], false, 'catmullrom', 0.02), 44, 0.085, 8, false)

function StaticInstances({ geometry = unitBoxGeometry, material, transforms }) {
  const ref = useRef()
  useLayoutEffect(() => {
    if (!ref.current) return
    const matrix = new THREE.Matrix4()
    const quaternion = new THREE.Quaternion()
    const position = new THREE.Vector3()
    const scale = new THREE.Vector3()
    const euler = new THREE.Euler()
    transforms.forEach((transform, index) => {
      position.fromArray(transform.position)
      euler.fromArray(transform.rotation || [0, 0, 0])
      quaternion.setFromEuler(euler)
      scale.fromArray(transform.scale || [1, 1, 1])
      matrix.compose(position, quaternion, scale)
      ref.current.setMatrixAt(index, matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.computeBoundingSphere()
  }, [transforms])
  return <instancedMesh ref={ref} args={[geometry, material, transforms.length]} castShadow={false} receiveShadow={false} />
}

function BookInstances({ books, withSpineDetails = true }) {
  const ref = useRef()
  const leatherMaps = useTexture(LEATHER_TEXTURES)
  const leatherNormalMap = leatherMaps.normalMap
  const leatherArmMap = leatherMaps.armMap
  const bookMaterial = useMemo(() => {
    const normalMap = leatherNormalMap.clone()
    const armMap = leatherArmMap.clone()
    for (const texture of [normalMap, armMap]) {
      texture.wrapS = THREE.RepeatWrapping
      texture.wrapT = THREE.RepeatWrapping
      texture.repeat.set(0.72, 1.7)
      texture.colorSpace = THREE.NoColorSpace
      texture.needsUpdate = true
    }
    const material = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      emissive: '#190b07',
      emissiveIntensity: 0.34,
      roughness: 0.86,
      metalness: 0,
      vertexColors: true,
      roughnessMap: armMap,
      normalMap,
      normalScale: new THREE.Vector2(0.24, 0.24),
    })
    return material
  }, [leatherArmMap, leatherNormalMap])
  useLayoutEffect(() => {
    if (!ref.current) return
    const matrix = new THREE.Matrix4()
    const quaternion = new THREE.Quaternion()
    const position = new THREE.Vector3()
    const scale = new THREE.Vector3()
    const color = new THREE.Color()
    books.forEach((book, index) => {
      position.fromArray(book.position)
      quaternion.setFromEuler(new THREE.Euler(...(book.rotation || [0, 0, book.tilt || 0])))
      scale.fromArray(book.scale)
      matrix.compose(position, quaternion, scale)
      ref.current.setMatrixAt(index, matrix)
      ref.current.setColorAt(index, color.set(book.color))
    })
    ref.current.instanceMatrix.needsUpdate = true
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
    ref.current.computeBoundingSphere()
  }, [books])
  const spineDetails = useMemo(() => !withSpineDetails ? [] : books.flatMap((book, index) => {
    if (index % 7 !== 0) return []
    const face = book.face || 1
    const [x, y, z] = book.position
    const [w, h] = book.scale
    const rotation = book.rotation || [0, 0, book.tilt || 0]
    const frontZ = z + face * 0.105
    return [
      { position: [x, y - h * 0.27, frontZ], rotation, scale: [w * 0.78, 0.018, 0.012] },
      { position: [x, y + h * 0.29, frontZ], rotation, scale: [w * 0.78, 0.018, 0.012] },
      ...(index % 21 === 0 ? [
        { position: [x, y, frontZ + face * 0.003], rotation, scale: [w * 0.3, h * 0.32, 0.009] },
        { position: [x, y, frontZ + face * 0.006], rotation, scale: [w * 0.55, 0.012, 0.011] },
      ] : []),
    ]
  }), [books, withSpineDetails])
  return (
    <>
      <instancedMesh ref={ref} args={[bookGeometry, bookMaterial, books.length]} castShadow={false} receiveShadow={false} />
      {withSpineDetails && <StaticInstances material={brass} transforms={spineDetails} />}
    </>
  )
}

function ShelfTitleLabels({ seed }) {
  const labels = ['HISTORIA', 'ASTRA', 'ARCANA', 'NATURA']
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 128
    const context = canvas.getContext('2d')
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = '#b88948'
    context.font = '500 35px Georgia'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.letterSpacing = '5px'
    context.fillText(labels[seed % labels.length], 256, 64)
    const result = new THREE.CanvasTexture(canvas)
    result.colorSpace = THREE.SRGBColorSpace
    result.needsUpdate = true
    return result
  }, [seed])
  const material = useMemo(() => new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false }), [texture])
  if (seed % 9 !== 0) return null
  return (
    <>
      <mesh material={material} position={[0.65, 3.42, 0.596]}><planeGeometry args={[0.72, 0.18]} /></mesh>
      <mesh material={material} position={[-0.7, 8.76, -0.596]} rotation={[0, Math.PI, 0]}><planeGeometry args={[0.72, 0.18]} /></mesh>
    </>
  )
}

function ShelfFrameInstances({ rows }) {
  const ref = useRef()
  const pieces = useMemo(() => {
    const result = [
      { position: [-2.02, 0.25, 0.36], scale: [0.18, 4.75, 0.62] },
      { position: [2.02, 0.25, 0.36], scale: [0.18, 4.75, 0.62] },
    ]
    for (let i = 0; i < rows + 1; i += 1) result.push({ position: [0, -1.55 + i * 0.68, 0.36], scale: [4.15, 0.13, 0.62] })
    return result
  }, [rows])
  useLayoutEffect(() => {
    if (!ref.current) return
    const matrix = new THREE.Matrix4()
    const quaternion = new THREE.Quaternion()
    const position = new THREE.Vector3()
    const scale = new THREE.Vector3()
    pieces.forEach((piece, index) => {
      matrix.compose(position.fromArray(piece.position), quaternion, scale.fromArray(piece.scale))
      ref.current.setMatrixAt(index, matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.computeBoundingSphere()
  }, [pieces])
  return <instancedMesh ref={ref} args={[unitBoxGeometry, wood, pieces.length]} castShadow={false} receiveShadow={false} />
}

function Candle({ position, rotation = [0, 0, 0], scale = 1, lightIntensity = 1.5, variant = 1, withLight = false }) {
  const { scene } = useGLTF('/assets/models/brass-candleholders/brass_candleholders_1k.gltf')
  const candleModel = useMemo(() => {
    const source = scene.getObjectByName(`brass_candleholder_0${variant}`) || scene.children[0]
    const clone = source.clone(true)
    clone.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = variant === 3
        object.receiveShadow = true
      }
    })
    return clone
  }, [scene, variant])
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive object={candleModel} />
      <mesh material={flameMaterial} position={[0, variant === 3 ? 0.8 : 0.4, 0.03]} scale={[0.6, 1, 0.6]}><sphereGeometry args={[0.045, 8, 6]} /></mesh>
      {withLight && <pointLight position={[0, variant === 3 ? 0.78 : 0.38, 0.03]} color="#ff8a2a" intensity={lightIntensity} distance={4.6} decay={2} castShadow={false} />}
    </group>
  )
}

function cloneModel(source) {
  const clone = source.clone(true)
  clone.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = false
      object.receiveShadow = false
    }
  })
  return clone
}

function BinderNotebook({ position, rotation = [0, 0, 0], scale = 1 }) {
  const { scene } = useGLTF('/assets/models/binder-notebook/binder_notebook_1k.gltf')
  const model = useMemo(() => cloneModel(scene.getObjectByName('binder_notebook') || scene.children[0]), [scene])
  return <primitive object={model} position={position} rotation={rotation} scale={scale} />
}

function EncyclopediaStack({ position, rotation = [0, 0, 0], scale = 1 }) {
  const { scene } = useGLTF('/assets/models/encyclopedia-set/book_encyclopedia_set_01_1k.gltf')
  const volumes = useMemo(() => [2, 9, 16].map((index) => {
    const volume = cloneModel(scene.children[index] || scene.children[0])
    volume.position.set(0, 0, 0)
    return volume
  }), [scene])
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {volumes.map((volume, index) => (
        <primitive key={index} object={volume} position={[index * 0.012, index * 0.038, index * -0.018]} rotation={[0, index * 0.04, Math.PI / 2]} />
      ))}
    </group>
  )
}

function GothicChair({ position, rotation = [0, 0, 0], scale = 0.5 }) {
  const frame = useMemo(() => [
    ...[-0.34, 0.34].flatMap((x) => [-0.27, 0.27].map((z) => ({ position: [x, 0.31, z], scale: [0.085, 0.62, 0.085] }))),
    ...[-0.39, 0.39].map((x) => ({ position: [x, 1.14, 0.31], scale: [0.09, 1.25, 0.09] })),
    { position: [0, 1.73, 0.31], scale: [0.92, 0.12, 0.12] },
    { position: [0, 0.48, 0], scale: [0.88, 0.12, 0.75] },
    ...[-0.48, 0.48].map((x) => ({ position: [x, 0.83, 0.02], scale: [0.1, 0.12, 0.78] })),
  ], [])
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <StaticInstances material={darkWood} transforms={frame} />
      <RoundedBox args={[0.76, 0.18, 0.68]} radius={0.08} smoothness={2} material={oxblood} position={[0, 0.59, 0.02]} />
      <RoundedBox args={[0.78, 0.96, 0.16]} radius={0.08} smoothness={2} material={oxblood} position={[0, 1.17, 0.28]} rotation={[-0.08, 0, 0]} />
      {[-0.22, 0, 0.22].map((x) => <mesh key={x} material={brass} position={[x, 1.18, 0.39]}><sphereGeometry args={[0.022, 8, 6]} /></mesh>)}
    </group>
  )
}

function GrandfatherClock({ position, rotation = [0, 0, 0], scale = 1 }) {
  const { scene } = useGLTF('/assets/models/grandfather-clock/vintage_grandfather_clock_01_1k.gltf')
  const model = useMemo(() => cloneModel(scene), [scene])
  return <primitive object={model} position={position} rotation={rotation} scale={scale} />
}

function NormalizedFixture({ url, position, rotation = [0, 0, 0], scale = 1 }) {
  const { scene } = useGLTF(url)
  const model = useMemo(() => {
    const clone = cloneModel(scene)
    const bounds = new THREE.Box3().setFromObject(clone)
    const size = bounds.getSize(new THREE.Vector3())
    const center = bounds.getCenter(new THREE.Vector3())
    const normalizer = 1 / Math.max(0.001, size.y)
    clone.scale.setScalar(normalizer)
    clone.position.set(-center.x * normalizer, -bounds.min.y * normalizer, -center.z * normalizer)
    return clone
  }, [scene])
  return <primitive object={model} position={position} rotation={rotation} scale={scale} />
}

function InstancedModelPart({ geometry, material, sourceMatrix, normalizationMatrix, transforms }) {
  const ref = useRef()
  useLayoutEffect(() => {
    if (!ref.current) return
    const placementMatrix = new THREE.Matrix4()
    const finalMatrix = new THREE.Matrix4()
    const quaternion = new THREE.Quaternion()
    const position = new THREE.Vector3()
    const scale = new THREE.Vector3()
    const euler = new THREE.Euler()
    transforms.forEach((transform, index) => {
      position.fromArray(transform.position)
      euler.fromArray(transform.rotation || [0, 0, 0])
      quaternion.setFromEuler(euler)
      if (Array.isArray(transform.scale)) scale.fromArray(transform.scale)
      else scale.setScalar(transform.scale || 1)
      placementMatrix.compose(position, quaternion, scale)
      finalMatrix.copy(placementMatrix).multiply(normalizationMatrix).multiply(sourceMatrix)
      ref.current.setMatrixAt(index, finalMatrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.computeBoundingSphere()
  }, [normalizationMatrix, sourceMatrix, transforms])
  return <instancedMesh ref={ref} args={[geometry, material, transforms.length]} castShadow={false} receiveShadow={false} />
}

function NormalizedModelInstances({ url, transforms, materialColor }) {
  const { scene } = useGLTF(url)
  const { normalizationMatrix, parts } = useMemo(() => {
    scene.updateMatrixWorld(true)
    const bounds = new THREE.Box3().setFromObject(scene)
    const size = bounds.getSize(new THREE.Vector3())
    const center = bounds.getCenter(new THREE.Vector3())
    const normalizer = 1 / Math.max(0.001, size.y)
    const normalization = new THREE.Matrix4().compose(
      new THREE.Vector3(-center.x * normalizer, -bounds.min.y * normalizer, -center.z * normalizer),
      new THREE.Quaternion(),
      new THREE.Vector3(normalizer, normalizer, normalizer),
    )
    const meshes = []
    scene.traverse((object) => {
      if (!object.isMesh) return
      const material = object.material.clone()
      if (materialColor && material.color) material.color.set(materialColor)
      if (material.emissive) material.emissive.set('#000000')
      material.roughness = 1
      meshes.push({
        geometry: object.geometry,
        material,
        sourceMatrix: object.matrixWorld.clone(),
      })
    })
    return { normalizationMatrix: normalization, parts: meshes }
  }, [materialColor, scene])
  useEffect(() => () => parts.forEach((part) => part.material.dispose()), [parts])
  return parts.map((part, index) => (
    <InstancedModelPart key={`${url}-${index}`} {...part} normalizationMatrix={normalizationMatrix} transforms={transforms} />
  ))
}

function PolyHavenChandelier({ position, scale = 3.1 }) {
  return (
    <group position={position}>
      <NormalizedFixture url="/assets/models/chandelier-03/Chandelier_03_1k.gltf" position={[0, 0, 0]} scale={scale} />
      <pointLight position={[0, 0.25, 0]} color="#d99350" intensity={34} distance={18} decay={1.9} />
    </group>
  )
}

function WallLantern({ side, z, withLight = false }) {
  return (
    <group position={[side * 22.84, 4.45, z]} rotation={[0, side < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
      <mesh material={blackenedIron} position={[0, -0.2, -0.2]}><boxGeometry args={[0.16, 0.16, 0.82]} /></mesh>
      <NormalizedFixture url="/assets/models/lantern-01/Lantern_01_1k.gltf" position={[0, -0.9, 0.18]} scale={1.65} />
      <mesh material={lanternGlowMaterial} position={[0, -0.2, 0.42]}><sphereGeometry args={[0.12, 12, 8]} /></mesh>
      {withLight && <pointLight position={[0, -0.18, 0.5]} color="#e2944a" intensity={26} distance={12} decay={1.95} />}
    </group>
  )
}

function VintagePainting({ position, rotation = [0, 0, 0], scale = 1 }) {
  const { scene } = useGLTF('/assets/models/fancy-picture-frame/fancy_picture_frame_02_1k.gltf')
  const model = useMemo(() => {
    const clone = cloneModel(scene)
    const bounds = new THREE.Box3().setFromObject(clone)
    const size = bounds.getSize(new THREE.Vector3())
    const center = bounds.getCenter(new THREE.Vector3())
    const normalizer = 1 / Math.max(0.001, size.y)
    clone.scale.setScalar(normalizer)
    clone.position.set(-center.x * normalizer, -center.y * normalizer, -center.z * normalizer)
    return clone
  }, [scene])
  return <primitive object={model} position={position} rotation={rotation} scale={scale} />
}

function PortraitPainting({ position, rotation = [0, 0, 0], scale = 1, art }) {
  const texture = useTexture(art)
  const canvasMaterial = useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 4
    texture.needsUpdate = true
    return new THREE.MeshStandardMaterial({ map: texture, color: '#d1b58b', roughness: 0.94, metalness: 0 })
  }, [texture])
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <RoundedBox args={[2.18, 3.02, 0.2]} radius={0.07} smoothness={2} material={carvedOak} />
      <mesh material={brass} position={[0, 0, 0.115]}><boxGeometry args={[1.94, 2.78, 0.055]} /></mesh>
      <mesh material={carvedOak} position={[0, 0, 0.15]}><boxGeometry args={[1.82, 2.66, 0.06]} /></mesh>
      <mesh material={canvasMaterial} position={[0, 0, 0.19]}><planeGeometry args={[1.68, 2.5]} /></mesh>
      <mesh material={brass} position={[0, 1.64, 0.05]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.22, 0.22, 0.16]} /></mesh>
    </group>
  )
}

function ClerestoryWindow({ side, z }) {
  const rotation = [0, side < 0 ? Math.PI / 2 : -Math.PI / 2, 0]
  return (
    <group position={[side * 19.42, 12.9, z]} rotation={rotation} scale={1.15}>
      <mesh geometry={clerestoryPaneGeometry} material={moonSky} position={[0, 0, 0.04]} />
      <mesh geometry={clerestoryFrameGeometry} material={carvedOak} position={[0, 0, 0.11]} />
      <mesh material={brass} position={[0, -0.25, 0.14]}><boxGeometry args={[0.07, 3.15, 0.06]} /></mesh>
      <mesh material={brass} position={[0, -0.18, 0.14]}><boxGeometry args={[1.72, 0.07, 0.06]} /></mesh>
      <mesh material={moonDisc} position={[side * -0.28, 0.52, 0.16]}><circleGeometry args={[0.2, 24]} /></mesh>
    </group>
  )
}

function VintageGlobe({ position, rotation = [0, 0, 0], scale = 1 }) {
  const map = useTexture('/assets/textures/antique-globe/antique-world-map.png')
  const globeMaterial = useMemo(() => {
    map.colorSpace = THREE.SRGBColorSpace
    map.anisotropy = 4
    map.needsUpdate = true
    return new THREE.MeshStandardMaterial({ map, color: '#c3a063', roughness: 0.72, metalness: 0 })
  }, [map])
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <group position={[0, 1.65, 0]} rotation={[0, 0, -0.2]}>
        <mesh material={globeMaterial} castShadow><sphereGeometry args={[0.78, 48, 32]} /></mesh>
        <mesh material={brass}><torusGeometry args={[0.86, 0.035, 10, 64]} /></mesh>
        <mesh material={brass} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.86, 0.035, 10, 64]} /></mesh>
        <mesh material={brass} position={[0, -0.9, 0]}><sphereGeometry args={[0.09, 14, 10]} /></mesh>
      </group>
      <mesh material={darkWood} position={[0, 0.72, 0]}><cylinderGeometry args={[0.16, 0.23, 0.75, 20]} /></mesh>
      <mesh material={brass} position={[0, 0.34, 0]}><cylinderGeometry args={[0.32, 0.42, 0.12, 24]} /></mesh>
      <mesh material={darkWood} position={[0, 0.16, 0]}><cylinderGeometry args={[0.62, 0.76, 0.28, 24]} /></mesh>
    </group>
  )
}

function BankersLamp({ position, rotation = [0, 0, 0], scale = 1 }) {
  const greenGlass = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#173d31', emissive: '#122c22', emissiveIntensity: 0.42, roughness: 0.3, metalness: 0.05, transmission: 0.04, clearcoat: 0.28, clearcoatRoughness: 0.35 }), [])
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh material={brass} position={[0, 0.04, 0]}><cylinderGeometry args={[0.24, 0.29, 0.07, 24]} /></mesh>
      <mesh material={brass} position={[0, 0.33, 0]}><cylinderGeometry args={[0.035, 0.055, 0.58, 16]} /></mesh>
      <mesh material={brass} position={[0, 0.62, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.12, 0.025, 8, 20, Math.PI]} /></mesh>
      <mesh material={greenGlass} position={[0, 0.62, 0]}><cylinderGeometry args={[0.34, 0.45, 0.2, 24, 1, true]} /></mesh>
      <mesh material={lanternGlowMaterial} position={[0, 0.55, 0]} scale={[1.35, 0.46, 1.35]}><sphereGeometry args={[0.12, 12, 8]} /></mesh>
    </group>
  )
}

function InteriorSconce({ position, rotation = [0, 0, 0], withLight = false }) {
  const candles = useMemo(() => [-0.2, 0, 0.2], [])
  return (
    <group position={position} rotation={rotation}>
      <mesh material={blackenedIron} position={[0, 0, -0.16]}><boxGeometry args={[0.42, 0.62, 0.12]} /></mesh>
      <mesh material={blackenedIron} position={[0, -0.18, 0.08]}><boxGeometry args={[0.72, 0.12, 0.52]} /></mesh>
      {candles.map((x, index) => (
        <group key={x} position={[x, index === 1 ? 0.12 : 0, 0.11]}>
          <mesh material={brass} position={[0, 0.02, 0]}><cylinderGeometry args={[0.055, 0.09, 0.11, 10]} /></mesh>
          <mesh material={parchment} position={[0, 0.28, 0]}><cylinderGeometry args={[0.035, 0.045, 0.46, 10]} /></mesh>
          <mesh material={flameMaterial} position={[0, 0.57, 0]} scale={[0.58, 1, 0.58]}><sphereGeometry args={[0.065, 8, 6]} /></mesh>
        </group>
      ))}
      {withLight && <pointLight position={[0, 0.45, 0.2]} color="#ff8a2a" intensity={5.6} distance={5.2} decay={2} castShadow={false} />}
    </group>
  )
}

function NaveChandelier({ position }) {
  const arms = useMemo(() => Array.from({ length: 8 }, (_, index) => {
    const angle = index * Math.PI / 4
    return {
      angle,
      position: [0.72, -0.48, 0],
      rotation: [0, -angle, 0],
    }
  }), [])
  return (
    <group position={position} scale={2.05}>
      <mesh material={blackenedIron} position={[0, 2.6, 0]}><cylinderGeometry args={[0.035, 0.035, 5.2, 10]} /></mesh>
      <mesh material={brass} position={[0, -0.36, 0]}><cylinderGeometry args={[0.11, 0.17, 0.7, 14]} /></mesh>
      {arms.map((arm, index) => (
        <group key={index} rotation={[0, arm.angle, 0]}>
          <mesh material={blackenedIron} position={[0.66, -0.5, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.04, 0.055, 1.32, 10]} /></mesh>
          <mesh material={brass} position={arm.position}><cylinderGeometry args={[0.12, 0.16, 0.1, 14]} /></mesh>
          <mesh material={parchment} position={[1.32, -0.17, 0]}><cylinderGeometry args={[0.055, 0.065, 0.48, 12]} /></mesh>
          <mesh material={flameMaterial} position={[1.32, 0.12, 0]} scale={[0.65, 1, 0.65]}><sphereGeometry args={[0.07, 10, 8]} /></mesh>
        </group>
      ))}
      <pointLight position={[0, -0.25, 0]} color="#e49b56" intensity={34} distance={18} decay={1.9} />
    </group>
  )
}

function Shelf({ position, rotation = [0, 0, 0], rows = 5, seed = 0 }) {
  const books = useMemo(() => {
    const items = []
    for (let row = 0; row < rows; row += 1) {
      let x = -1.75
      let index = 0
      while (x < 1.72) {
        const w = 0.11 + ((index * 17 + seed * 11 + row * 7) % 8) * 0.012
        const h = 0.44 + ((index * 13 + seed * 5 + row * 3) % 9) * 0.024
        items.push({ key: `${row}-${index}`, position: [x + w / 2, -1.42 + row * 0.68 + h / 2, 0.21], scale: [w, h, 0.19], color: bookPalette[(index + row * 2 + seed) % bookPalette.length], tilt: ((index * 7 + seed) % 11 === 0) ? -0.08 : 0 })
        x += w + 0.025
        index += 1
      }
    }
    return items
  }, [rows, seed])
  return (
    <group position={position} rotation={rotation}>
      <mesh receiveShadow material={darkWood} position={[0, 0.25, 0]}><boxGeometry args={[4.2, 4.4, 0.45]} /></mesh>
      <ShelfFrameInstances rows={rows} />
      <BookInstances books={books} />
      <mesh material={brass} position={[0, 2.56, 0.49]}><boxGeometry args={[4.28, 0.045, 0.05]} /></mesh>
    </group>
  )
}

function GrandShelf({ position, rotation = [0, 0, 0], scale = 1, rows = 14, seed = 0, district = 0, shelfMaterial = darkWood }) {
  const width = 5.15
  const height = 13.2
  const rowStep = 0.89
  const books = useMemo(() => {
    const items = []
    for (const face of [-1, 1]) {
      for (let row = 0; row < rows; row += 1) {
        let x = -2.27
        let index = 0
        while (x < 2.2) {
          if ((index * 11 + row * 7 + seed * 3) % 37 === 0) x += 0.13
          const w = 0.12 + ((index * 13 + seed * 7 + row * 5) % 8) * 0.014
          const h = 0.47 + ((index * 17 + seed * 3 + row * 7) % 8) * 0.025
          const tilt = ((index * 5 + seed + row) % 13 === 0) ? (((index + row) % 2 ? 1 : -1) * 0.11) : 0
          items.push({
            position: [x + w / 2, 0.38 + row * rowStep + h / 2, face * (0.48 + ((index + row + seed) % 4) * 0.008)],
            scale: [w, h, 0.17 + ((index + row) % 3) * 0.015],
            color: bookPalette[(index + row * 2 + seed + district) % bookPalette.length],
            rotation: [0, face < 0 ? Math.PI : 0, tilt],
            face,
          })
          x += w + 0.035
          index += 1
        }
      }
    }
    return items
  }, [district, rows, seed])
  const framePieces = useMemo(() => [
    { position: [0, height / 2, 0], scale: [width, height, 0.58] },
    ...[-2.52, 0, 2.52].map((x) => ({ position: [x, height / 2, 0], scale: [0.18, height + 0.5, 0.88] })),
    ...Array.from({ length: rows + 1 }, (_, row) => ({ position: [0, 0.22 + row * rowStep, 0], scale: [width + 0.12, 0.13, 0.9] })),
    { position: [0, 0.12, 0], scale: [width + 0.42, 0.34, 1.04] },
    { position: [0, height + 0.14, 0], scale: [width + 0.52, 0.4, 1.04] },
    { position: [0, height + 0.52, 0], scale: [width + 0.12, 0.18, 0.86] },
  ], [rows])
  const pilasters = useMemo(() => [-2.62, 2.62].map((x) => ({ position: [x, height / 2, 0], scale: [1, height, 1] })), [])
  const capitals = useMemo(() => [-2.62, 2.62].flatMap((x) => [
    { position: [x, 0.28, 0] },
    { position: [x, height + 0.36, 0], scale: [1.14, 1.1, 1.14] },
  ]), [])
  const endCaps = useMemo(() => [-1, 1].flatMap((side) => [
    { position: [side * 2.68, height / 2, 0], scale: [0.2, height - 0.35, 1.08] },
    { position: [side * 2.8, 1.1, 0], scale: [0.16, 1.65, 1.28] },
    { position: [side * 2.8, height - 1.02, 0], scale: [0.16, 1.45, 1.28] },
  ]), [])
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <StaticInstances material={shelfMaterial} transforms={framePieces} />
      <StaticInstances material={shelfMaterial} transforms={endCaps} />
      <StaticInstances geometry={shelfPillarGeometry} material={shelfMaterial} transforms={pilasters} />
      <StaticInstances geometry={shelfCapitalGeometry} material={shelfMaterial} transforms={capitals} />
      <BookInstances books={books} />
      <ShelfTitleLabels seed={seed} />
      {seed % 17 === 0 && <EncyclopediaStack position={[1.36, 4.88, 0.62]} rotation={[0, -0.08, 0]} scale={0.72} />}
      <mesh material={brass} position={[0, height + 0.55, 0.47]}><boxGeometry args={[2.5, 0.06, 0.035]} /></mesh>
      <mesh material={brass} position={[0, height + 0.55, -0.47]}><boxGeometry args={[2.5, 0.06, 0.035]} /></mesh>
    </group>
  )
}

function Arch({ z, width = 9, height = 7.2 }) {
  const stonePieces = useMemo(() => [
    { position: [-width / 2, height / 2 - 0.2, 0], scale: [0.7, height, 0.85] },
    { position: [width / 2, height / 2 - 0.2, 0], scale: [0.7, height, 0.85] },
    { position: [0, height - 0.35, 0], scale: [width + 0.7, 0.7, 0.85] },
  ], [width, height])
  return (
    <group position={[0, 0, z]}>
      <StaticInstances material={stone} transforms={stonePieces} />
      <mesh material={brass} position={[0, height - 0.71, 0.46]}><boxGeometry args={[width - 0.75, 0.035, 0.035]} /></mesh>
    </group>
  )
}

function Door({ side, progress, forceClosed = false, openForExplorer = false }) {
  const ref = useRef()
  const { camera, invalidate } = useThree()
  const sourceMaps = useTexture(DARK_WOOD_TEXTURES)
  const maps = useMemo(() => {
    const result = {}
    Object.entries(sourceMaps).forEach(([key, texture]) => {
      const clone = texture.clone()
      clone.wrapS = THREE.RepeatWrapping
      clone.wrapT = THREE.RepeatWrapping
      clone.center.set(0.5, 0.5)
      clone.rotation = Math.PI / 2
      clone.repeat.set(0.9, 1.55)
      clone.offset.set(side === -1 ? 0.08 : 0.46, 0.04)
      clone.colorSpace = key === 'map' ? THREE.SRGBColorSpace : THREE.NoColorSpace
      clone.needsUpdate = true
      result[key] = clone
    })
    return result
  }, [side, sourceMaps])
  const panelMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#a97858',
    roughness: 0.92,
    metalness: 0,
    map: maps.map,
    roughnessMap: maps.armMap,
    normalMap: maps.normalMap,
    normalScale: new THREE.Vector2(0.44, 0.44),
  }), [maps])
  const center = -side * 1.78
  const panelColumns = [center - 0.78, center + 0.78]
  const panelRows = [-3.44, -1.72, 0, 1.72, 3.44]
  const frameTransforms = useMemo(() => [
    ...[-1.58, 0, 1.58].map((x) => ({ position: [center + x, 0, 0.285], scale: [0.22, 8.98, 0.17] })),
    ...[-4.29, -2.58, -0.86, 0.86, 2.58, 4.29].map((y) => ({ position: [center, y, 0.285], scale: [3.4, 0.22, 0.17] })),
    { position: [center, -4.48, 0.29], scale: [3.48, 0.46, 0.2] },
  ], [center])
  const panelTransforms = useMemo(() => panelColumns.flatMap((x) => panelRows.map((y) => ({ position: [x, y, 0.375] }))), [center])
  const insetTransforms = useMemo(() => panelColumns.flatMap((x) => panelRows.map((y) => ({ position: [x, y, 0.437] }))), [center])
  const detailTransforms = useMemo(() => panelColumns.flatMap((x) => panelRows.map((y) => ({ position: [x, y, 0.51], rotation: [0, 0, Math.PI / 4], scale: [1, 1, 0.32] }))), [center])
  const rearFrameTransforms = useMemo(() => frameTransforms.map((piece) => ({ ...piece, position: [piece.position[0], piece.position[1], -piece.position[2]] })), [frameTransforms])
  const rearPanelTransforms = useMemo(() => panelColumns.flatMap((x) => panelRows.map((y) => ({ position: [x, y, -0.375] }))), [center])
  const rearInsetTransforms = useMemo(() => panelColumns.flatMap((x) => panelRows.map((y) => ({ position: [x, y, -0.437] }))), [center])
  const rearDetailTransforms = useMemo(() => panelColumns.flatMap((x) => panelRows.map((y) => ({ position: [x, y, -0.51], rotation: [0, 0, Math.PI / 4], scale: [1, 1, 0.32] }))), [center])
  const hingeStraps = useMemo(() => [-3.15, 0, 3.15].map((y) => ({ position: [-side * 0.58, y, 0.39], scale: [1.16, 0.14, 0.1] })), [side])
  const hingeBarrels = useMemo(() => [-3.15, 0, 3.15].map((y) => ({ position: [0, y, 0.39] })), [])
  const hingeStuds = useMemo(() => [-3.15, 0, 3.15].map((y) => ({ position: [-side * 1.08, y, 0.46] })), [side])
  const doorRotation = useRef(0)
  useFrame((_, delta) => {
    if (!ref.current) return
    // In free exploration the entrance remains closed when viewed from across
    // the nave, but opens from either side as the player approaches. This
    // keeps the interior composition intact without trapping someone on the
    // exterior approach.
    const distanceFromThreshold = Math.hypot(camera.position.x * 0.72, camera.position.z - 8.4)
    const explorerOpening = openForExplorer
      ? 1 - THREE.MathUtils.smoothstep(distanceFromThreshold, 4.4, 6.2)
      : 0
    const opening = forceClosed
      ? explorerOpening
      : THREE.MathUtils.smoothstep(progress.current, 0.015, 0.12)
        * (1 - THREE.MathUtils.smoothstep(progress.current, 0.23, 0.34))
    const desiredRotation = -side * opening * 1.08
    doorRotation.current = THREE.MathUtils.damp(doorRotation.current, desiredRotation, 7.5, delta)
    ref.current.rotation.y = doorRotation.current
    if (Math.abs(doorRotation.current - desiredRotation) > 0.0005) invalidate()
  })
  return (
    <group ref={ref} position={[side * 3.98, 4.76, 8.4]} scale={[1.12, 1.035, 1]}>
      <mesh castShadow receiveShadow material={darkWood} position={[center, 0, 0]}>
        <boxGeometry args={[3.52, 9.2, 0.4]} />
      </mesh>

      <mesh castShadow receiveShadow position={[center, 0, 0.206]}>
        <planeGeometry args={[3.42, 9.08, 1, 1]} />
        <meshStandardMaterial
          map={maps.map}
          aoMap={maps.aoMap}
          roughnessMap={maps.armMap}
          metalnessMap={maps.armMap}
          normalMap={maps.normalMap}
          normalScale={[0.72, 0.72]}
          roughness={0.94}
          metalness={0}
        />
      </mesh>
      <mesh castShadow receiveShadow position={[center, 0, -0.206]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[3.42, 9.08, 1, 1]} />
        <meshStandardMaterial map={maps.map} roughnessMap={maps.armMap} normalMap={maps.normalMap} normalScale={[0.72, 0.72]} roughness={0.94} metalness={0} />
      </mesh>

      <StaticInstances material={doorTrim} transforms={frameTransforms} />
      <StaticInstances geometry={doorPanelTrimGeometry} material={doorTrim} transforms={panelTransforms} />
      <StaticInstances geometry={doorPanelInsetGeometry} material={panelMaterial} transforms={insetTransforms} />
      <StaticInstances geometry={doorPanelDetailGeometry} material={doorTrim} transforms={detailTransforms} />
      <StaticInstances material={doorTrim} transforms={rearFrameTransforms} />
      <StaticInstances geometry={doorPanelTrimGeometry} material={doorTrim} transforms={rearPanelTransforms} />
      <StaticInstances geometry={doorPanelInsetGeometry} material={panelMaterial} transforms={rearInsetTransforms} />
      <StaticInstances geometry={doorPanelDetailGeometry} material={doorTrim} transforms={rearDetailTransforms} />
      <StaticInstances material={blackenedIron} transforms={hingeStraps} />
      <StaticInstances geometry={hingeBarrelGeometry} material={blackenedIron} transforms={hingeBarrels} />
      <StaticInstances geometry={hingeStudGeometry} material={blackenedIron} transforms={hingeStuds} />

      <group position={[-side * 3.25, 0, 0.46]}>
        <mesh castShadow material={blackenedIron}><boxGeometry args={[0.34, 0.7, 0.11]} /></mesh>
        <mesh material={brass} position={[0, 0, 0.09]}><torusGeometry args={[0.15, 0.035, 10, 28]} /></mesh>
        <mesh material={brass} position={[0, -0.23, 0.1]}><sphereGeometry args={[0.055, 12, 12]} /></mesh>
      </group>
      <group position={[-side * 3.25, 0, -0.46]} rotation={[0, Math.PI, 0]}>
        <mesh castShadow material={blackenedIron}><boxGeometry args={[0.34, 0.7, 0.11]} /></mesh>
        <mesh material={brass} position={[0, 0, 0.09]}><torusGeometry args={[0.15, 0.035, 10, 28]} /></mesh>
        <mesh material={brass} position={[0, -0.23, 0.1]}><sphereGeometry args={[0.055, 12, 12]} /></mesh>
      </group>
    </group>
  )
}

function EntranceFrame() {
  const sourceMaps = useTexture(DARK_WOOD_TEXTURES)
  const frameWood = useMemo(() => {
    const maps = {}
    Object.entries(sourceMaps).forEach(([key, texture]) => {
      const clone = texture.clone()
      clone.wrapS = THREE.RepeatWrapping
      clone.wrapT = THREE.RepeatWrapping
      clone.center.set(0.5, 0.5)
      clone.rotation = Math.PI / 2
      clone.repeat.set(0.9, 1.55)
      clone.colorSpace = key === 'map' ? THREE.SRGBColorSpace : THREE.NoColorSpace
      clone.needsUpdate = true
      maps[key] = clone
    })
    return new THREE.MeshPhysicalMaterial({
      color: '#704125',
      map: maps.map,
      normalMap: maps.normalMap,
      normalScale: new THREE.Vector2(0.32, 0.32),
      roughnessMap: maps.armMap,
      roughness: 0.9,
      metalness: 0,
      clearcoat: 0.015,
      clearcoatRoughness: 0.96,
    })
  }, [sourceMaps])
  const woodPieces = useMemo(() => [
    ...[-1, 1].map((side) => ({ position: [side * 3.78, 4.6, 0.1], scale: [0.74, 9.65, 0.52] })),
    { position: [0, 9.32, 0.1], scale: [8.3, 0.52, 0.52] },
  ], [])
  const frameBases = useMemo(() => [-1, 1].map((side) => ({ position: [side * 3.78, -0.14, 0.08], scale: [0.9, 0.3, 0.72] })), [])
  const interiorMonumentalPieces = useMemo(() => [
    ...[-1, 1].flatMap((side) => [
      { position: [side * 5.05, 5, 0.48], scale: [1.02, 10, 1.12] },
      { position: [side * 5.05, 0.28, 0.62], scale: [1.52, 0.56, 1.46] },
      { position: [side * 5.05, 0.68, 0.57], scale: [1.25, 0.26, 1.28] },
      { position: [side * 5.05, 9.5, 0.58], scale: [1.45, 0.42, 1.4] },
      { position: [side * 5.05, 9.88, 0.54], scale: [1.18, 0.34, 1.26] },
      { position: [side * 4.25, 4.65, 0.28], scale: [0.28, 9.35, 0.7] },
    ]),
    { position: [0, 0.18, 0.42], scale: [8.78, 0.36, 0.94] },
    { position: [0, 9.35, 0.3], scale: [8.78, 0.3, 0.72] },
    { position: [0, 10.08, 0.52], scale: [11.2, 0.52, 1.16] },
    { position: [0, 10.58, 0.45], scale: [12.15, 0.4, 1.02] },
    { position: [0, 11.15, 0.42], scale: [10.8, 0.72, 0.98] },
  ], [])
  const interiorDentils = useMemo(() => Array.from({ length: 11 }, (_, index) => ({
    position: [-4.5 + index * 0.9, 10.72, 1.02],
    scale: [0.46, 0.24, 0.38],
  })), [])
  return (
    <>
      <group position={[0, 0, 8.54]} scale={[1.12, 1.035, 1]}>
        <StaticInstances material={frameWood} transforms={woodPieces} />
        <StaticInstances material={frameWood} transforms={frameBases} />
        <mesh castShadow material={blackenedIron} position={[0, 9.52, 0.19]}><boxGeometry args={[1.72, 0.44, 0.11]} /></mesh>
      </group>
      <group position={[0, 0, 8.24]} rotation={[0, Math.PI, 0]}>
        <StaticInstances material={frameWood} transforms={interiorMonumentalPieces} />
        <StaticInstances material={frameWood} transforms={interiorDentils} />
        <RoundedBox args={[0.82, 0.82, 0.2]} radius={0.06} smoothness={2} castShadow receiveShadow position={[0, 11.32, 1.05]} rotation={[0, 0, Math.PI / 4]}>
          <primitive object={frameWood} attach="material" />
        </RoundedBox>
        <mesh castShadow material={blackenedIron} position={[0, 11.32, 1.18]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.22, 0.22, 0.1]} />
        </mesh>
      </group>
    </>
  )
}

function EntranceSconce({ side }) {
  return (
    <group position={[side * 6.85, 5.05, 8.92]}>
      <mesh castShadow material={blackenedIron} position={[0, 0.22, -0.15]}>
        <boxGeometry args={[0.62, 1.28, 0.2]} />
      </mesh>
      <mesh castShadow material={blackenedIron} position={[0, -0.12, 0.22]}>
        <boxGeometry args={[1.14, 0.16, 0.88]} />
      </mesh>
      <Candle position={[0, -0.12, 0.25]} scale={2.08} variant={2} lightIntensity={5.35} withLight />
    </group>
  )
}

function EntranceArchitecture() {
  const sourceMaps = useTexture(ENTRANCE_STONE_TEXTURES)
  const { sideBackdropMaterial, topBackdropMaterial, wallMaterial, floorMaterial } = useMemo(() => {
    const makeMaps = (repeatX, repeatY) => {
      const maps = {}
      Object.entries(sourceMaps).forEach(([key, texture]) => {
        const clone = texture.clone()
        clone.wrapS = THREE.RepeatWrapping
        clone.wrapT = THREE.RepeatWrapping
        clone.repeat.set(repeatX, repeatY)
        clone.colorSpace = key === 'map' ? THREE.SRGBColorSpace : THREE.NoColorSpace
        clone.needsUpdate = true
        maps[key] = clone
      })
      return maps
    }
    const sideBackdropMaps = makeMaps(1.48, 2.65)
    const topBackdropMaps = makeMaps(1.15, 1.33)
    const wallMaps = makeMaps(1.8, 2.65)
    const floorMaps = makeMaps(3.8, 3.2)
    return {
      sideBackdropMaterial: new THREE.MeshStandardMaterial({
        map: sideBackdropMaps.map,
        normalMap: sideBackdropMaps.normalMap,
        normalScale: new THREE.Vector2(0.85, 0.85),
        roughnessMap: sideBackdropMaps.armMap,
        metalnessMap: sideBackdropMaps.armMap,
        roughness: 0.96,
        metalness: 0.01,
        color: '#655247',
        emissive: '#160a06',
        emissiveIntensity: 0.14,
      }),
      topBackdropMaterial: new THREE.MeshStandardMaterial({
        map: topBackdropMaps.map,
        normalMap: topBackdropMaps.normalMap,
        normalScale: new THREE.Vector2(0.85, 0.85),
        roughnessMap: topBackdropMaps.armMap,
        metalnessMap: topBackdropMaps.armMap,
        roughness: 0.96,
        metalness: 0.01,
        color: '#655247',
        emissive: '#160a06',
        emissiveIntensity: 0.14,
      }),
      wallMaterial: new THREE.MeshStandardMaterial({
        map: wallMaps.map,
        normalMap: wallMaps.normalMap,
        normalScale: new THREE.Vector2(0.85, 0.85),
        roughnessMap: wallMaps.armMap,
        metalnessMap: wallMaps.armMap,
        roughness: 0.96,
        metalness: 0.01,
        color: '#655247',
        emissive: '#160a06',
        emissiveIntensity: 0.14,
      }),
      floorMaterial: new THREE.MeshStandardMaterial({
        map: floorMaps.map,
        normalMap: floorMaps.normalMap,
        normalScale: new THREE.Vector2(0.55, 0.55),
        roughnessMap: floorMaps.armMap,
        roughness: 0.98,
        color: '#6f6259',
      }),
    }
  }, [sourceMaps])
  const sideBackdrops = useMemo(() => [-1, 1].map((side) => ({ position: [side * 10.25, 10, -0.02], scale: [11.5, 22, 0.84] })), [])
  const wallPieces = useMemo(() => [
    ...[-1, 1].flatMap((side) => [
      { position: [side * 5.05, 5, 0.48], scale: [1.02, 10, 1.12] },
      { position: [side * 5.05, 0.28, 0.62], scale: [1.52, 0.56, 1.46] },
      { position: [side * 5.05, 0.68, 0.57], scale: [1.25, 0.26, 1.28] },
      { position: [side * 5.05, 9.5, 0.58], scale: [1.45, 0.42, 1.4] },
      { position: [side * 5.05, 9.88, 0.54], scale: [1.18, 0.34, 1.26] },
    ]),
    { position: [0, 10.08, 0.52], scale: [11.2, 0.52, 1.16] },
    { position: [0, 10.58, 0.45], scale: [12.15, 0.4, 1.02] },
    { position: [0, 11.15, 0.42], scale: [10.8, 0.72, 0.98] },
    ...Array.from({ length: 11 }, (_, i) => ({ position: [-4.5 + i * 0.9, 10.72, 1.02], scale: [0.46, 0.24, 0.38] })),
  ], [])
  const floorLines = useMemo(() => [-1, 1].map((side) => ({ position: [side * 3.25, 0.092, 6.1], scale: [0.035, 0.018, 11.7] })), [])

  return (
    <>
      <group position={[0, 0, 8.02]}>
        <StaticInstances material={sideBackdropMaterial} transforms={sideBackdrops} />
        <mesh receiveShadow material={topBackdropMaterial} position={[0, 15.5, -0.02]}>
          <boxGeometry args={[9, 11, 0.84]} />
        </mesh>
        <StaticInstances material={wallMaterial} transforms={wallPieces} />
        <RoundedBox args={[0.82, 0.82, 0.2]} radius={0.06} smoothness={2} castShadow receiveShadow position={[0, 11.32, 1.05]} rotation={[0, 0, Math.PI / 4]}>
          <primitive object={wallMaterial} attach="material" />
        </RoundedBox>
        <mesh castShadow material={blackenedIron} position={[0, 11.32, 1.18]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.22, 0.22, 0.1]} />
        </mesh>
        <mesh receiveShadow material={floorMaterial} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.075, 6.45]}>
          <planeGeometry args={[25, 14]} />
        </mesh>
        <StaticInstances material={brass} transforms={floorLines} />
      </group>
      <EntranceSconce side={-1} />
      <EntranceSconce side={1} />
    </>
  )
}

function CourtyardLantern({ position, rotation = [0, 0, 0], withLight = false }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh material={courtyardIron} position={[0, 0, -0.11]}><boxGeometry args={[0.36, 0.78, 0.12]} /></mesh>
      <mesh material={courtyardIron} position={[0, -0.26, 0.16]}><boxGeometry args={[0.64, 0.08, 0.5]} /></mesh>
      <mesh material={courtyardIron} position={[0, 0.3, 0.15]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.38, 0.38, 0.08]} /></mesh>
      <mesh material={lanternGlowMaterial} position={[0, 0.02, 0.2]} scale={[0.82, 1.5, 0.58]}><sphereGeometry args={[0.12, 10, 8]} /></mesh>
      {withLight && <pointLight position={[0, 0, 0.42]} color="#e9a05a" intensity={17} distance={9.5} decay={2} />}
    </group>
  )
}

function PointedStonePanel({ position, rotation = [0, 0, 0], scale = [1, 1, 1], material = courtyardRecess, lit = false, open = false }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {!open && <mesh geometry={courtyardArchPaneGeometry} material={material} position={[0, 0, 0.015]} />}
      <mesh geometry={courtyardArchFrameGeometry} material={stone} position={[0, 0, 0.075]} />
      {lit && <>
        <mesh geometry={courtyardArchPaneGeometry} material={courtyardWindow} position={[0, -0.16, 0.095]} scale={[0.38, 0.78, 1]} />
        <mesh material={courtyardIron} position={[0, -0.28, 0.105]}><boxGeometry args={[0.035, 2.45, 0.045]} /></mesh>
        <mesh material={courtyardIron} position={[0, -0.28, 0.108]}><boxGeometry args={[0.62, 0.04, 0.045]} /></mesh>
      </>}
    </group>
  )
}

function ExteriorFacadeDetails({ wallMaterial, wallFieldMaterial }) {
  const facadeWings = useMemo(() => [
    { position: [-10.15, 8, 8.69], scale: [10.9, 16, 0.32] },
    { position: [10.15, 8, 8.69], scale: [10.9, 16, 0.32] },
    { position: [0, 13.05, 8.56], scale: [9.5, 6.15, 0.32] },
  ], [])
  const buttresses = useMemo(() => [-14.5, -10.5, -5.35, 5.35, 10.5, 14.5].map((x) => ({
    position: [x, 4.2, 8.62], scale: [0.72, 8.4, 1.05],
  })), [])
  const ledges = useMemo(() => [
    { position: [-10, 1.05, 8.72], scale: [10.8, 0.18, 0.38] },
    { position: [10, 1.05, 8.72], scale: [10.8, 0.18, 0.38] },
    { position: [-10, 8.1, 8.7], scale: [10.8, 0.2, 0.42] },
    { position: [10, 8.1, 8.7], scale: [10.8, 0.2, 0.42] },
  ], [])
  return (
    <group name="exterior-facade-details">
      <StaticInstances material={wallFieldMaterial} transforms={facadeWings} />
      <StaticInstances material={wallMaterial} transforms={buttresses} />
      <StaticInstances material={wallMaterial} transforms={ledges} />
      <mesh geometry={courtyardPortalFrameGeometry} material={wallMaterial} position={[0, 4.68, 9.04]} scale={[4.55, 2.48, 1]} />
      <mesh geometry={courtyardPortalFrameGeometry} material={stone} position={[0, 4.68, 9.09]} scale={[4.18, 2.33, 1]} />
      {[-12.15, -7.55, 7.55, 12.15].map((x, index) => (
        <PointedStonePanel key={x} position={[x, 4.35, 8.91]} scale={[1.06, 1.4, 1]} lit={index === 1 || index === 2} />
      ))}
      <PointedStonePanel position={[0, 13.15, 8.86]} scale={[1.35, 1.68, 1]} lit />
      <CourtyardLantern position={[-5.45, 4.25, 9.15]} withLight />
      <CourtyardLantern position={[5.45, 4.25, 9.15]} withLight />
    </group>
  )
}

function ExteriorCourtyard() {
  const sourceMaps = useTexture(ENTRANCE_STONE_TEXTURES)
  const { floorMaterial, wallMaterial, wallFieldMaterial, pathMaterial } = useMemo(() => {
    const makeMaps = (repeatX, repeatY) => {
      const maps = {}
      Object.entries(sourceMaps).forEach(([key, texture]) => {
        const clone = texture.clone()
        clone.wrapS = THREE.RepeatWrapping
        clone.wrapT = THREE.RepeatWrapping
        clone.repeat.set(repeatX, repeatY)
        clone.colorSpace = key === 'map' ? THREE.SRGBColorSpace : THREE.NoColorSpace
        clone.needsUpdate = true
        maps[key] = clone
      })
      return maps
    }
    const floor = makeMaps(8.5, 7.2)
    const walls = makeMaps(1.65, 2.1)
    const wallField = makeMaps(7.4, 2.35)
    const path = makeMaps(1.8, 7.2)
    return {
      floorMaterial: new THREE.MeshStandardMaterial({ map: floor.map, normalMap: floor.normalMap, roughnessMap: floor.armMap, normalScale: new THREE.Vector2(0.46, 0.46), color: '#373c3e', roughness: 0.93 }),
      wallMaterial: new THREE.MeshStandardMaterial({ map: walls.map, normalMap: walls.normalMap, roughnessMap: walls.armMap, normalScale: new THREE.Vector2(0.72, 0.72), color: '#5b554f', emissive: '#0c0a09', emissiveIntensity: 0.08, roughness: 0.98 }),
      wallFieldMaterial: new THREE.MeshStandardMaterial({ map: wallField.map, normalMap: wallField.normalMap, roughnessMap: wallField.armMap, normalScale: new THREE.Vector2(0.66, 0.66), color: '#4f4d49', emissive: '#08090a', emissiveIntensity: 0.06, roughness: 0.98 }),
      pathMaterial: new THREE.MeshStandardMaterial({ map: path.map, normalMap: path.normalMap, roughnessMap: path.armMap, normalScale: new THREE.Vector2(0.58, 0.58), color: '#4a4d4d', roughness: 0.88 }),
    }
  }, [sourceMaps])
  const sideWallTransforms = useMemo(() => [-1, 1].map((side) => ({
    position: [side * 14.3, 3.65, 20.15], scale: [0.9, 7.3, 24.5],
  })), [])
  const sideButtresses = useMemo(() => [-1, 1].flatMap((side) => [10.25, 15.3, 20.35, 25.4, 30.45].map((z) => ({
    position: [side * 13.78, 3.45, z], scale: [1.55, 6.9, 0.82],
  }))), [])
  const sideButtressCaps = useMemo(() => [-1, 1].flatMap((side) => [10.25, 15.3, 20.35, 25.4, 30.45].flatMap((z) => [
    { position: [side * 13.58, 0.7, z], scale: [1.95, 0.4, 1.2] },
    { position: [side * 13.7, 6.5, z], scale: [1.72, 0.28, 1.02] },
  ])), [])
  const sideCornices = useMemo(() => [-1, 1].flatMap((side) => [
    { position: [side * 13.7, 0.78, 20.15], scale: [1.35, 0.2, 24.4] },
    { position: [side * 13.72, 6.72, 20.15], scale: [1.28, 0.24, 24.4] },
  ]), [])
  const rearButtresses = useMemo(() => [-12.3, -8.2, -3.65, 3.65, 8.2, 12.3].map((x) => ({
    position: [x, 3.35, 31.72], scale: [0.78, 6.7, 1.5],
  })), [])
  const rearWallTransforms = useMemo(() => [
    { position: [-8.8, 3.35, 31.95], scale: [12, 6.7, 0.9] },
    { position: [8.8, 3.35, 31.95], scale: [12, 6.7, 0.9] },
    { position: [0, 6.3, 31.95], scale: [5.6, 1.2, 0.9] },
  ], [])
  const treeBases = useMemo(() => [
    ...[-1, 1].flatMap((side) => [12, 18.5, 25, 30].map((z, index) => [side * (16 + (index % 2) * 0.55), z])),
    ...[-12, -7.2, 7.2, 12].map((x, index) => [x, 34 + (index % 2) * 0.55]),
  ], [])
  const trunkPositions = useMemo(() => treeBases.flatMap(([x, z], index) => [
    { position: [x, 4.8, z], rotation: [0, 0, index % 2 ? 0.08 : -0.06], scale: [0.34, 7.2, 0.34] },
    { position: [x + 0.65, 7.1, z], rotation: [0, 0, -0.48], scale: [0.16, 2.5, 0.16] },
  ]), [treeBases])
  const canopyPositions = useMemo(() => treeBases.flatMap(([x, z], index) => {
    const lift = (index % 3) * 0.24
    return [
      { position: [x, 9.15 + lift, z], scale: [1.9, 1.65, 1.82] },
      { position: [x - 1.35, 8.75 + lift, z + 0.2], scale: [1.55, 1.35, 1.58] },
      { position: [x + 1.28, 8.95 + lift, z - 0.28], scale: [1.62, 1.42, 1.55] },
      { position: [x + 0.15, 10.45 + lift, z + 0.15], scale: [1.45, 1.28, 1.42] },
      { position: [x - 0.92, 10.05 + lift, z - 0.45], scale: [1.28, 1.18, 1.22] },
      { position: [x + 1.05, 10.15 + lift, z + 0.45], scale: [1.25, 1.12, 1.28] },
      { position: [x - 2.05, 9.35 + lift, z - 0.12], scale: [1.1, 1.05, 1.15] },
    ]
  }), [treeBases])
  const canopyHighlights = useMemo(() => canopyPositions.filter((_, index) => index % 3 === 0).map((leaf) => ({
    ...leaf,
    position: [leaf.position[0] - 0.18, leaf.position[1] + 0.15, leaf.position[2] - 0.12],
    scale: leaf.scale.map((value) => value * 0.72),
  })), [canopyPositions])
  const sideBeds = useMemo(() => [-1, 1].flatMap((side) => [12.6, 17.65, 22.7, 27.75].map((z) => ({
    position: [side * 11.9, 0.34, z], scale: [1.35, 0.68, 4.45],
  }))), [])
  const hedgeBlocks = useMemo(() => sideBeds.map((bed, index) => ({
    position: [bed.position[0], 0.86 + (index % 2) * 0.04, bed.position[2]],
    rotation: [0, (index % 3 - 1) * 0.018, 0],
    scale: [1.08, 0.62, 4.05],
  })), [sideBeds])
  const gateBars = useMemo(() => [
    ...[-2.05, -1.55, -1.02, -0.5, 0, 0.5, 1.02, 1.55, 2.05].map((x) => ({ position: [x, 2.35, 31.2], scale: [0.065, 4.3, 0.075] })),
    { position: [0, 0.95, 31.17], scale: [4.65, 0.1, 0.09] },
    { position: [0, 3.55, 31.17], scale: [4.65, 0.1, 0.09] },
    { position: [-1.1, 2.3, 31.12], rotation: [0, 0, 0.6], scale: [0.055, 2.45, 0.065] },
    { position: [1.1, 2.3, 31.12], rotation: [0, 0, -0.6], scale: [0.055, 2.45, 0.065] },
  ], [])
  const pathCurbs = useMemo(() => [-1, 1].map((side) => ({ position: [side * 3.85, 0.11, 20.1], scale: [0.18, 0.14, 23.2] })), [])
  const pavingBands = useMemo(() => [11.2, 15.7, 20.2, 24.7, 29.2].map((z) => ({ position: [0, 0.075, z], scale: [21.4, 0.035, 0.09] })), [])
  const rearBeds = useMemo(() => [-8.8, 8.8].map((x) => ({ position: [x, 0.38, 29.95], scale: [5.25, 0.76, 2.1] })), [])
  const shrubPlacements = useMemo(() => [
    ...sideBeds.map((bed, index) => ({
      position: [bed.position[0], 0.7, bed.position[2] + (index % 2 ? 0.42 : -0.38)],
      rotation: [0, index * 0.78, 0],
      scale: 2.95 + (index % 3) * 0.18,
    })),
    ...[-10.1, -7.45, 7.45, 10.1].map((x, index) => ({
      position: [x, 0.78, 29.72], rotation: [0, index * 0.94, 0], scale: 2.95 + (index % 2) * 0.2,
    })),
  ], [sideBeds])
  const gardenShrubs = useMemo(() => [
    { position: [-4.8, 1.3, 36], scale: [3.2, 1.5, 3.2] },
    { position: [4.8, 1.3, 36], scale: [3.2, 1.5, 3.2] },
    { position: [-6.5, 2.2, 41], scale: [4.2, 2.3, 3.6] },
    { position: [6.5, 2.2, 41], scale: [4.2, 2.3, 3.6] },
  ], [])

  return (
    <group name="exterior-courtyard">
      <mesh material={courtyardSky} position={[0, 12, 18]}><sphereGeometry args={[66, 32, 16]} /></mesh>
      <directionalLight position={[-9, 14, 29]} color="#7792aa" intensity={0.72} />
      <mesh receiveShadow material={floorMaterial} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 20.1]}><planeGeometry args={[29.2, 24.6]} /></mesh>
      <mesh receiveShadow material={pathMaterial} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.066, 20.1]}><planeGeometry args={[7.55, 23.2]} /></mesh>
      <StaticInstances material={wallMaterial} transforms={pathCurbs} />
      <StaticInstances material={wallMaterial} transforms={pavingBands} />
      <StaticInstances material={wallFieldMaterial} transforms={sideWallTransforms} />
      <StaticInstances material={wallFieldMaterial} transforms={rearWallTransforms} />
      <StaticInstances material={wallMaterial} transforms={sideButtresses} />
      <StaticInstances material={wallMaterial} transforms={sideButtressCaps} />
      <StaticInstances material={wallMaterial} transforms={sideCornices} />
      <StaticInstances material={wallMaterial} transforms={rearButtresses} />
      {[-1, 1].flatMap((side) => [12.8, 17.85, 22.9, 27.95].map((z, index) => (
        <PointedStonePanel key={`side-panel-${side}-${z}`} position={[side * 13.74, 3.7, z]} rotation={[0, -side * Math.PI / 2, 0]} scale={[1.18, 1.5, 1]} lit={(index + (side > 0 ? 1 : 0)) % 3 === 0} />
      )))}
      {[-10.2, -6.25, 6.25, 10.2].map((x) => (
        <PointedStonePanel key={`rear-panel-${x}`} position={[x, 3.48, 31.43]} rotation={[0, Math.PI, 0]} scale={[1.28, 1.42, 1]} />
      ))}
      <PointedStonePanel position={[0, 3.58, 31.38]} rotation={[0, Math.PI, 0]} scale={[2.5, 1.92, 1]} open />
      <StaticInstances material={courtyardIron} transforms={gateBars} />
      <StaticInstances geometry={courtyardTrunkGeometry} material={courtyardTrunk} transforms={trunkPositions} />
      <StaticInstances geometry={courtyardFoliageGeometry} material={courtyardFoliage} transforms={canopyPositions} />
      <StaticInstances geometry={courtyardFoliageGeometry} material={courtyardFoliageLight} transforms={canopyHighlights} />
      <StaticInstances material={wallMaterial} transforms={sideBeds} />
      <StaticInstances material={courtyardFoliage} transforms={hedgeBlocks} />
      <StaticInstances material={wallMaterial} transforms={rearBeds} />
      <NormalizedModelInstances url="/assets/models/shrub-03/shrub_03_1k.gltf" transforms={shrubPlacements} materialColor="#314735" />
      <mesh material={pathMaterial} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 38]}><planeGeometry args={[4.2, 14]} /></mesh>
      <StaticInstances geometry={courtyardFoliageGeometry} material={courtyardFoliage} transforms={gardenShrubs} />
      <mesh material={moonDisc} position={[6.8, 13.3, 44]}><sphereGeometry args={[0.92, 28, 20]} /></mesh>
      <mesh position={[6.8, 13.3, 44.15]} scale={1.75}><sphereGeometry args={[0.92, 20, 14]} /><meshBasicMaterial color="#9bb4c7" transparent opacity={0.08} /></mesh>
      {[-1, 1].map((side) => <group key={`bench-${side}`} position={[side * 10.95, 0, 20.25]} rotation={[0, side > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}>
        <mesh material={wallMaterial} position={[0, 0.72, 0]}><boxGeometry args={[3.1, 0.2, 0.64]} /></mesh>
        <mesh material={wallMaterial} position={[-1.18, 0.35, 0]}><boxGeometry args={[0.28, 0.7, 0.56]} /></mesh>
        <mesh material={wallMaterial} position={[1.18, 0.35, 0]}><boxGeometry args={[0.28, 0.7, 0.56]} /></mesh>
      </group>)}
      <CourtyardLantern position={[-13.35, 3.85, 15.3]} rotation={[0, Math.PI / 2, 0]} withLight />
      <CourtyardLantern position={[13.35, 3.85, 15.3]} rotation={[0, -Math.PI / 2, 0]} withLight />
      <CourtyardLantern position={[-13.35, 3.85, 25.4]} rotation={[0, Math.PI / 2, 0]} />
      <CourtyardLantern position={[13.35, 3.85, 25.4]} rotation={[0, -Math.PI / 2, 0]} />
      <CourtyardLantern position={[-3.45, 4.05, 31.25]} rotation={[0, Math.PI, 0]} withLight />
      <CourtyardLantern position={[3.45, 4.05, 31.25]} rotation={[0, Math.PI, 0]} withLight />
      <ExteriorFacadeDetails wallMaterial={wallMaterial} wallFieldMaterial={wallFieldMaterial} />
    </group>
  )
}

function EntranceScene({ progress, exploreEnabled = false }) {
  const facadeRef = useRef()
  const courtyardRef = useRef()
  useFrame(() => {
    if (facadeRef.current) facadeRef.current.visible = scenePreparationCount > 0 || progress.current < 0.19
    if (courtyardRef.current) {
      courtyardRef.current.visible = exploreEnabled || scenePreparationCount > 0 || progress.current < 0.24
    }
  })
  return (
    <group name="entrance-scene">
      <group ref={courtyardRef}>
        <ExteriorCourtyard />
      </group>
      <EntranceFrame />
      <group ref={facadeRef}><EntranceArchitecture /></group>
      <Door side={-1} progress={progress} forceClosed={exploreEnabled} openForExplorer={exploreEnabled} />
      <Door side={1} progress={progress} forceClosed={exploreEnabled} openForExplorer={exploreEnabled} />
    </group>
  )
}

function TableStationery({ position = [0, 0, 0], rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh material={parchment} rotation={[-Math.PI / 2, 0, 0.12]} position={[0, 0.005, 0]}><planeGeometry args={[0.72, 0.48]} /></mesh>
      <mesh material={blackenedIron} position={[0.36, 0.09, 0.08]}><cylinderGeometry args={[0.075, 0.1, 0.18, 12]} /></mesh>
      <mesh material={brass} position={[0.18, 0.13, -0.05]} rotation={[0.12, 0, -0.62]}><cylinderGeometry args={[0.012, 0.024, 0.72, 8]} /></mesh>
    </group>
  )
}

function Desk({ position }) {
  const legs = useMemo(() => [
    { position: [-0.95, 0.34, -0.34], scale: [0.12, 0.68, 0.12] },
    { position: [0.95, 0.34, -0.34], scale: [0.12, 0.68, 0.12] },
    { position: [-0.95, 0.34, 0.34], scale: [0.12, 0.68, 0.12] },
    { position: [0.95, 0.34, 0.34], scale: [0.12, 0.68, 0.12] },
  ], [])
  return (
    <group position={position}>
      <mesh material={wood} castShadow position={[0, 0.72, 0]}><boxGeometry args={[2.4, 0.13, 1]} /></mesh>
      <StaticInstances material={darkWood} transforms={legs} />
      <Candle position={[0.7, 0.79, 0]} scale={0.8} variant={1} />
      <mesh material={brass} position={[-0.35, 0.81, 0]} rotation={[-Math.PI / 2, 0, 0.2]}><torusGeometry args={[0.3, 0.035, 8, 28]} /></mesh>
    </group>
  )
}

function StudyTable({ position, rotation = [0, 0, 0], seed = 0, compact = false }) {
  const length = compact ? 3.7 : 5.6
  const tableMaps = useTexture(TABLE_TEXTURES)
  const tableMaterial = useMemo(() => {
    const build = (source, repeat) => {
      const maps = {}
      Object.entries(source).forEach(([key, texture]) => {
        const clone = texture.clone()
        clone.wrapS = THREE.RepeatWrapping
        clone.wrapT = THREE.RepeatWrapping
        clone.repeat.set(...repeat)
        clone.colorSpace = key === 'map' ? THREE.SRGBColorSpace : THREE.NoColorSpace
        clone.needsUpdate = true
        maps[key] = clone
      })
      return maps
    }
    const tabletop = build(tableMaps, [1.25, compact ? 2.2 : 3.2])
    return new THREE.MeshStandardMaterial({ map: tabletop.map, normalMap: tabletop.normalMap, roughnessMap: tabletop.armMap, normalScale: new THREE.Vector2(0.42, 0.42), color: '#82553a', roughness: 0.9, metalness: 0 })
  }, [compact, tableMaps])
  const legs = useMemo(() => [-1, 1].flatMap((x) => [-1, 1].map((z) => ({
    position: [x * 0.92, 0.43, z * (length / 2 - 0.34)], scale: [0.16, 0.86, 0.16],
  }))), [length])
  const usesCandles = seed % 2 === 0
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[2.55, 0.22, length]} radius={0.08} smoothness={2} material={tableMaterial} castShadow position={[0, 0.9, 0]} />
      <mesh material={darkWood} position={[0, 0.77, 0]}><boxGeometry args={[2.3, 0.16, length - 0.18]} /></mesh>
      <StaticInstances material={darkWood} transforms={legs} />
      {[-1, 1].map((side) => (
        <GothicChair key={side} position={[0, 0, side * (length / 2 + 0.72)]} rotation={[0, side < 0 ? Math.PI : 0, 0]} scale={compact ? 0.72 : 0.84} />
      ))}
      {usesCandles
        ? <Candle position={[0.28, 1.02, -0.15]} scale={compact ? 1.16 : 1.44} variant={2} />
        : <BankersLamp position={[0.48, 1.03, -length * 0.2]} scale={compact ? 0.64 : 0.76} />}
      {usesCandles
        ? <EncyclopediaStack position={[-0.56, 1.05, 1.3]} rotation={[0, -0.18, 0]} scale={compact ? 1.2 : 1.48} />
        : <BinderNotebook position={[-0.5, 1.04, 0.62]} rotation={[0, 0.28, 0]} scale={compact ? 1.8 : 2.2} />}
      {!usesCandles && seed % 3 !== 0 && <BinderNotebook position={[-0.32, 1.1, 1.18]} rotation={[0, -0.2, 0.05]} scale={compact ? 1.55 : 1.9} />}
      {usesCandles && seed % 3 === 0 && <BinderNotebook position={[0.62, 1.04, -1.2]} rotation={[0, 0.34, 0]} scale={compact ? 1.6 : 2} />}
      {!usesCandles && <TableStationery position={[0.42, 1.025, 1.3]} rotation={[0, seed * 0.17, 0]} />}
    </group>
  )
}

function CozyReadingNook() {
  const rugTexture = useTexture('/assets/textures/antique-runner/antique-library-runner.png')
  const rugMaterial = useMemo(() => {
    const map = rugTexture.clone()
    map.wrapS = THREE.RepeatWrapping
    map.wrapT = THREE.RepeatWrapping
    map.repeat.set(1, 1.2)
    map.colorSpace = THREE.SRGBColorSpace
    map.needsUpdate = true
    return new THREE.MeshStandardMaterial({ map, color: '#705453', roughness: 0.98 })
  }, [rugTexture])
  return (
    <group>
      <mesh material={rugMaterial} position={[-19.35, 0.032, -23]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[5.2, 6.4]} /></mesh>
      <StudyTable position={[-19.3, 0, -23]} seed={3} compact />
    </group>
  )
}

function GrandHallShell() {
  const sourceMaps = useTexture(HALL_TEXTURES)
  const { wallMaterial, entranceWallMaterial, floorMaterial, ceilingMaterial, rugMaterial } = useMemo(() => {
    const makeMaps = (entries, repeatX, repeatY) => {
      const result = {}
      entries.forEach(([key, texture]) => {
        const clone = texture.clone()
        clone.wrapS = THREE.RepeatWrapping
        clone.wrapT = THREE.RepeatWrapping
        clone.repeat.set(repeatX, repeatY)
        clone.colorSpace = key === 'map' ? THREE.SRGBColorSpace : THREE.NoColorSpace
        clone.needsUpdate = true
        result[key] = clone
      })
      return result
    }
    const walls = makeMaps([['map', sourceMaps.wallMap], ['normalMap', sourceMaps.wallNormal], ['armMap', sourceMaps.wallArm]], 7.5, 2.8)
    const entranceWalls = makeMaps([['map', sourceMaps.wallMap], ['normalMap', sourceMaps.wallNormal], ['armMap', sourceMaps.wallArm]], 4.4, 2.35)
    const floor = makeMaps([['map', sourceMaps.floorMap], ['normalMap', sourceMaps.floorNormal], ['armMap', sourceMaps.floorArm]], 11, 22)
    const ceiling = makeMaps([['map', sourceMaps.ceilingMap], ['normalMap', sourceMaps.ceilingNormal], ['armMap', sourceMaps.ceilingArm]], 8, 22)
    const rug = makeMaps([['map', sourceMaps.rugMap]], 1, 4.5)
    return {
      wallMaterial: new THREE.MeshStandardMaterial({ map: walls.map, normalMap: walls.normalMap, roughnessMap: walls.armMap, normalScale: new THREE.Vector2(0.68, 0.68), color: '#6e5c50', roughness: 0.97, metalness: 0 }),
      entranceWallMaterial: new THREE.MeshStandardMaterial({ map: entranceWalls.map, normalMap: entranceWalls.normalMap, roughnessMap: entranceWalls.armMap, normalScale: new THREE.Vector2(0.82, 0.82), color: '#8d786a', emissive: '#24130c', emissiveIntensity: 0.18, roughness: 0.98, metalness: 0 }),
      floorMaterial: new THREE.MeshStandardMaterial({ map: floor.map, normalMap: floor.normalMap, roughnessMap: floor.armMap, normalScale: new THREE.Vector2(0.5, 0.5), color: '#7d756e', roughness: 0.96, metalness: 0 }),
      ceilingMaterial: new THREE.MeshStandardMaterial({ map: ceiling.map, normalMap: ceiling.normalMap, roughnessMap: ceiling.armMap, normalScale: new THREE.Vector2(0.62, 0.62), color: '#80583c', emissive: '#180b05', emissiveIntensity: 0.15, roughness: 0.94, metalness: 0, side: THREE.DoubleSide }),
      rugMaterial: new THREE.MeshStandardMaterial({ map: rug.map, color: '#887168', roughness: 0.96, metalness: 0 }),
    }
  }, [sourceMaps])
  const columns = useMemo(() => [-1, 1].flatMap((side) => Array.from({ length: 11 }, (_, i) => ({
    position: [side * 22.55, 8.7, 3 - i * 7], scale: [1.05, 17.4, 1.05],
  }))), [])
  const columnBases = useMemo(() => [-1, 1].flatMap((side) => Array.from({ length: 11 }, (_, i) => ({
    position: [side * 22.55, 0.48, 3 - i * 7], scale: [1.55, 0.96, 1.55],
  }))), [])
  const vaultRibs = useMemo(() => Array.from({ length: 7 }, (_, i) => ({ position: [0, 0, 5 - i * 14] })), [])
  const diagonalVaultBays = useMemo(() => Array.from({ length: 6 }, (_, i) => ({ position: [0, 0, -2 - i * 14] })), [])
  const longitudinalRibs = useMemo(() => [-14, 0, 14].map((x) => ({
    position: [x, vaultHeightAt(x) - 0.12, -33], scale: [0.24, 0.24, 78],
  })), [])
  const vaultBosses = useMemo(() => Array.from({ length: 7 }, (_, i) => ({ position: [0, 22.72, 5 - i * 14], rotation: [0.4, i * 0.37, 0.25], scale: [1.45, 1.45, 1.45] })), [])
  const aisleRunners = useMemo(() => [
    { position: [0, 0.045, -29], scale: [4.2, 0.018, 76] },
    { position: [-9.9, 0.044, -29], scale: [2.2, 0.017, 70] },
    { position: [9.9, 0.044, -29], scale: [2.2, 0.017, 70] },
  ], [])
  const timberInlays = useMemo(() => [
    ...[-16.6, -11.4, -5.25, 5.25, 11.4, 16.6].map((x) => ({ position: [x, 0.018, -31], scale: [0.13, 0.025, 84] })),
    ...[3, -11, -25, -39, -53, -67].map((z) => ({ position: [0, 0.019, z], scale: [46.2, 0.025, 0.12] })),
  ], [])
  const entranceReturnWall = useMemo(() => [
    { position: [-14.38, 10, 7.72], scale: [18.25, 20, 1] },
    { position: [14.38, 10, 7.72], scale: [18.25, 20, 1] },
    { position: [0, 15.25, 7.72], scale: [10.55, 9.5, 1] },
  ], [])
  const wallSconces = useMemo(() => [-2, -16, -30, -44, -58, -69].flatMap((z) => [
    { position: [-22.92, 4.4, z], rotation: [0, Math.PI / 2, 0] },
    { position: [22.92, 4.4, z], rotation: [0, -Math.PI / 2, 0] },
  ]), [])
  return (
    <group>
      <mesh receiveShadow material={floorMaterial} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -31]}><planeGeometry args={[49, 86]} /></mesh>
      <mesh material={wallMaterial} position={[-HALL_HALF_WIDTH, 10.5, -33]}><boxGeometry args={[1.2, 21, 78]} /></mesh>
      <mesh material={wallMaterial} position={[HALL_HALF_WIDTH, 10.5, -33]}><boxGeometry args={[1.2, 21, 78]} /></mesh>
      <mesh material={wallMaterial} position={[0, 12, -72.35]}><boxGeometry args={[48.2, 24, 1.1]} /></mesh>
      <StaticInstances material={entranceWallMaterial} transforms={entranceReturnWall} />
      <mesh material={ceilingMaterial} geometry={gothicVaultGeometry} />
      <StaticInstances material={wallMaterial} transforms={columns} />
      <StaticInstances material={wallMaterial} transforms={columnBases} />
      <StaticInstances geometry={gothicVaultRibGeometry} material={carvedOak} transforms={vaultRibs} />
      <StaticInstances geometry={diagonalVaultRibGeometryA} material={carvedOak} transforms={diagonalVaultBays} />
      <StaticInstances geometry={diagonalVaultRibGeometryB} material={carvedOak} transforms={diagonalVaultBays} />
      <StaticInstances material={carvedOak} transforms={longitudinalRibs} />
      <StaticInstances geometry={vaultBossGeometry} material={brass} transforms={vaultBosses} />
      {aisleRunners.map((runner, index) => (
        <mesh key={`runner-${index}`} material={rugMaterial} rotation={[-Math.PI / 2, 0, 0]} position={runner.position}>
          <planeGeometry args={[runner.scale[0], runner.scale[2]]} />
        </mesh>
      ))}
      <StaticInstances material={darkWood} transforms={timberInlays} />
      {wallSconces.map((sconce, index) => <InteriorSconce key={index} {...sconce} />)}
      <InteriorSconce position={[-22.92, 4.4, -23]} rotation={[0, Math.PI / 2, 0]} withLight />
      <InteriorSconce position={[-7.15, 4.65, 7.05]} rotation={[0, Math.PI, 0]} withLight />
      <InteriorSconce position={[7.15, 4.65, 7.05]} rotation={[0, Math.PI, 0]} withLight />
      <PolyHavenChandelier position={[0, 14.2, -10]} />
      <PolyHavenChandelier position={[0, 14.2, -34]} />
      <PolyHavenChandelier position={[0, 14.2, -58]} />
      <WallLantern side={-1} z={-9} />
      <WallLantern side={1} z={-9} />
      <WallLantern side={-1} z={-51} />
      <WallLantern side={1} z={-51} />
      <GrandfatherClock position={[0, 0, -71.72]} scale={3.6} />
      <VintageGlobe position={[0, 0, -21.5]} rotation={[0, 0.32, 0]} scale={1.2} />
      <PortraitPainting position={[-5.2, 7.3, -71.72]} scale={1.28} art="/assets/images/portrait-elder-scholar.jpg" />
      <PortraitPainting position={[5.2, 7.3, -71.72]} scale={1.28} art="/assets/images/portrait-woman-astronomer.jpg" />
      <PortraitPainting position={[-22.82, 7.5, -23]} rotation={[0, Math.PI / 2, 0]} scale={1.12} art="/assets/images/portrait-woman-astronomer.jpg" />
      <CozyReadingNook />
    </group>
  )
}

function Ladder({ position, rotation = [0, 0, -0.17] }) {
  const woodPieces = useMemo(() => [
    ...[-0.62, 0.62].map((z) => ({ position: [0, 0, z], scale: [0.18, TALL_LADDER_LENGTH, 0.18] })),
    ...Array.from({ length: TALL_LADDER_RUNG_COUNT }, (_, i) => ({ position: [-0.08, TALL_LADDER_RUNG_START + i * TALL_LADDER_RUNG_STEP, 0], scale: [0.42, 0.12, 1.38] })),
    { position: [-0.16, -TALL_LADDER_HALF_LENGTH + 0.16, 0], scale: [0.72, 0.2, 1.7] },
  ], [])
  return (
    <group position={position} rotation={rotation}>
      <StaticInstances material={darkWood} transforms={woodPieces} />
      <mesh material={brass} position={[0, TALL_LADDER_HALF_LENGTH - 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.07, 0.07, 1.5, 12]} /></mesh>
      {[-0.66, 0.66].map((z) => (
        <mesh key={z} material={brass} position={[-0.2, -TALL_LADDER_HALF_LENGTH, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.19, 0.19, 0.14, 16]} />
        </mesh>
      ))}
    </group>
  )
}

function ContextLadder({ placement, slideRef, heightRef, climbing = false }) {
  const groupRef = useRef()
  const rungRefs = useRef([])
  const face = placement?.face || 1
  const y = placement?.rotationY || 0
  const ladderRotationY = y + (face < 0 ? Math.PI : 0)
  const anchor = placement?.position || [0, 0, 0]
  const normalX = Math.sin(ladderRotationY)
  const normalZ = Math.cos(ladderRotationY)
  const tangentX = Math.cos(ladderRotationY)
  const tangentZ = -Math.sin(ladderRotationY)
  const position = [anchor[0] + normalX * 1.04, TALL_LADDER_CENTER_Y, anchor[2] + normalZ * 1.04]
  const pieces = [
    ...[-0.58, 0.58].map((x) => ({ position: [x, 0, 0], scale: [0.16, TALL_LADDER_LENGTH, 0.16] })),
    { position: [0, -TALL_LADDER_HALF_LENGTH + 0.16, 0.08], scale: [1.58, 0.22, 0.64] },
  ]
  const rungHeights = useMemo(() => Array.from({ length: TALL_LADDER_RUNG_COUNT }, (_, index) => TALL_LADDER_RUNG_START + index * TALL_LADDER_RUNG_STEP), [])
  useFrame(() => {
    if (!groupRef.current) return
    const slide = slideRef?.current || 0
    groupRef.current.position.set(position[0] + tangentX * slide, position[1], position[2] + tangentZ * slide)
    const eyeHeight = heightRef?.current ?? -100
    rungRefs.current.forEach((rung, index) => {
      if (!rung) return
      const rungWorldHeight = position[1] + rungHeights[index] * Math.cos(0.11)
      rung.visible = !climbing || Math.abs(rungWorldHeight - eyeHeight) > 0.72
    })
  })
  if (!placement) return null
  return (
    <group ref={groupRef} position={position} rotation={[0, ladderRotationY, 0]}>
      <group rotation={[-0.11, 0, 0]}>
        <StaticInstances material={wood} transforms={pieces} />
        {rungHeights.map((rungHeight, index) => (
          <mesh key={rungHeight} ref={(node) => { rungRefs.current[index] = node }} material={wood} position={[0, rungHeight, 0]}>
            <boxGeometry args={[1.34, 0.11, 0.2]} />
          </mesh>
        ))}
        <mesh material={brass} position={[0, TALL_LADDER_HALF_LENGTH - 0.15, -0.02]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.07, 0.07, 1.4, 12]} /></mesh>
        {[-0.61, 0.61].map((x) => <mesh key={x} material={brass} position={[x, -TALL_LADDER_HALF_LENGTH, 0.12]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.18, 0.18, 0.15, 16]} /></mesh>)}
        <mesh material={interactionMaterial} userData={{ interactionType: 'ladder', interactionId: `ladder-${placement.shelfId}`, shelfId: placement.shelfId }}>
          <boxGeometry args={[1.8, TALL_LADDER_LENGTH + 0.35, 0.75]} />
        </mesh>
      </group>
    </group>
  )
}

function ShelfFocusFrame({ face = 1 }) {
  const z = face * 0.53
  return (
    <group position={[0, 6.58, z]}>
      <mesh material={brass} position={[0, 6.52, 0]}><boxGeometry args={[5.38, 0.018, 0.018]} /></mesh>
      <mesh material={brass} position={[0, -6.52, 0]}><boxGeometry args={[5.38, 0.018, 0.018]} /></mesh>
      <mesh material={brass} position={[-2.68, 0, 0]}><boxGeometry args={[0.018, 13.04, 0.018]} /></mesh>
      <mesh material={brass} position={[2.68, 0, 0]}><boxGeometry args={[0.018, 13.04, 0.018]} /></mesh>
    </group>
  )
}

function BookSpineLabel({ title, width, height }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1536
    canvas.height = 256
    const context = canvas.getContext('2d')
    const cleaned = title.replace(/\s+/g, ' ').trim().toUpperCase()
    const display = cleaned
    const gradient = context.createLinearGradient(0, 0, canvas.width, 0)
    gradient.addColorStop(0, '#6d431b')
    gradient.addColorStop(0.18, '#d2a758')
    gradient.addColorStop(0.52, '#f0d98e')
    gradient.addColorStop(0.82, '#b57a32')
    gradient.addColorStop(1, '#5a3313')
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.strokeStyle = '#7b4c1f'
    context.lineWidth = 5
    context.strokeRect(18, 24, canvas.width - 36, canvas.height - 48)
    context.strokeStyle = '#d0a458'
    context.lineWidth = 2
    context.strokeRect(36, 41, canvas.width - 72, canvas.height - 82)
    for (const x of [74, canvas.width - 74]) {
      context.beginPath()
      context.arc(x, canvas.height / 2, 7, 0, Math.PI * 2)
      context.fillStyle = '#c79547'
      context.fill()
    }
    context.fillStyle = gradient
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    let fontSize = 102
    do {
      context.font = `600 ${fontSize}px "Times New Roman", Georgia, serif`
      fontSize -= 3
    } while (context.measureText(display).width > 1280 && fontSize > 34)
    context.shadowColor = 'rgba(43,20,5,.8)'
    context.shadowBlur = 3
    context.shadowOffsetY = 2
    context.fillText(display, canvas.width / 2, 128)
    context.shadowColor = 'transparent'
    const seed = [...display].reduce((sum, letter) => sum + letter.charCodeAt(0), 0)
    context.globalCompositeOperation = 'destination-out'
    for (let index = 0; index < 42; index += 1) {
      const x = (seed * (index + 7) * 37) % 1440 + 42
      const y = (seed * (index + 11) * 19) % 170 + 43
      context.globalAlpha = 0.08 + (index % 3) * 0.035
      context.fillRect(x, y, 2 + (index % 4), 1 + (index % 2))
    }
    context.globalCompositeOperation = 'source-over'
    context.globalAlpha = 1
    const result = new THREE.CanvasTexture(canvas)
    result.colorSpace = THREE.SRGBColorSpace
    result.anisotropy = 4
    result.needsUpdate = true
    return result
  }, [title])
  const material = useMemo(() => new THREE.MeshStandardMaterial({ map: texture, transparent: true, roughness: 0.48, metalness: 0.28, polygonOffset: true, polygonOffsetFactor: -2 }), [texture])
  return <mesh material={material} position={[0, 0, 0.116]} rotation={[0, 0, Math.PI / 2]}><planeGeometry args={[height * 0.7, width * 0.35]} /></mesh>
}

function UserBookVolume({ book, index, row, column, rowCount }) {
  const leatherMaps = useTexture(LEATHER_TEXTURES)
  const face = book.face || 1
  const width = 0.23 + (index % 3) * 0.018
  const height = 0.58 + (index % 4) * 0.022
  const x = (column - (rowCount - 1) / 2) * 0.34
  const y = 0.38 + row * 0.89 + height / 2
  const z = face * 0.36
  const color = ['#35130f', '#1d3329', '#243141', '#49301d'][index % 4]
  const leatherMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color, normalMap: leatherMaps.normalMap, normalScale: new THREE.Vector2(0.28, 0.28), roughnessMap: leatherMaps.armMap, roughness: 0.92, metalness: 0, envMapIntensity: 0.18 }), [color, leatherMaps])
  return (
    <group position={[x, y, z]} rotation={[0, face < 0 ? Math.PI : 0, 0]}>
      <RoundedBox args={[width, height, 0.2]} radius={0.022} smoothness={3}>
        <primitive object={leatherMaterial} attach="material" />
      </RoundedBox>
      {[-0.4, -0.29, 0.29, 0.4].map((ratio) => <mesh key={ratio} material={brass} position={[0, height * ratio, 0.111]}><boxGeometry args={[width * 0.88, 0.014, 0.012]} /></mesh>)}
      <BookSpineLabel title={book.title} width={width} height={height} />
      <mesh material={interactionMaterial} position={[0, 0, 0.02]} userData={{ interactionType: 'book', interactionId: book.id, shelfId: book.shelfId, title: book.title }}>
        <boxGeometry args={[width + 0.08, height + 0.08, 0.32]} />
      </mesh>
    </group>
  )
}

function ShelfInteractionLayer({ rootRef, shelves, books = [], focusedTarget, ladderPlacement, ladderSlideRef, ladderHeightRef, climbing }) {
  const booksByShelf = useMemo(() => {
    const grouped = new Map()
    books.forEach((book) => {
      if (!grouped.has(book.shelfId)) grouped.set(book.shelfId, [])
      grouped.get(book.shelfId).push(book)
    })
    return grouped
  }, [books])
  return (
    <group ref={rootRef}>
      {shelves.map((shelf) => {
        const rotationY = shelf.rotation?.[1] || 0
        const shelfBooks = booksByShelf.get(shelf.id) || []
        const focusFace = focusedTarget?.shelfId === shelf.id ? (focusedTarget.face || 1) : null
        return (
          <group key={`interaction-${shelf.id}`} position={shelf.position} rotation={shelf.rotation || [0, 0, 0]} scale={shelf.scale || 1}>
            <mesh material={interactionMaterial} position={[0, 6.6, 0]} userData={{ interactionType: 'shelf', interactionId: shelf.id, shelfId: shelf.id, shelfPosition: shelf.position, rotationY }}>
              <boxGeometry args={[5.5, 13.45, 0.7]} />
            </mesh>
            {focusFace && <ShelfFocusFrame face={focusFace} />}
            {shelfBooks.map((book, index) => {
              const row = book.row ?? (2 + (Math.floor((book.slot ?? index) / 10) % 9))
              const booksOnRow = shelfBooks.filter((item, itemIndex) => (item.row ?? (2 + (Math.floor((item.slot ?? itemIndex) / 10) % 9))) === row)
              const column = booksOnRow.findIndex((item) => item.id === book.id)
              return <UserBookVolume key={book.id} book={book} index={index} row={row} column={column} rowCount={Math.min(10, booksOnRow.length)} />
            })}
          </group>
        )
      })}
      <ContextLadder placement={ladderPlacement} slideRef={ladderSlideRef} heightRef={ladderHeightRef} climbing={climbing} />
    </group>
  )
}

function MoonlitWindowSurface() {
  const ref = useRef()
  const { camera, invalidate } = useThree()
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec2 vUv;
      float hash(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0)), f.x), f.y);
      }
      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.55;
        for (int i = 0; i < 5; i++) {
          value += amplitude * noise(p);
          p = p * 2.03 + 17.1;
          amplitude *= 0.5;
        }
        return value;
      }
      void main() {
        vec2 uv = vUv;
        vec3 sky = mix(vec3(0.018, 0.045, 0.072), vec3(0.11, 0.19, 0.25), smoothstep(0.0, 1.0, uv.y));
        vec2 moonCenter = vec2(0.34, 0.68);
        float moonDistance = distance(uv, moonCenter);
        float moon = 1.0 - smoothstep(0.105, 0.125, moonDistance);
        float moonHalo = (1.0 - smoothstep(0.12, 0.28, moonDistance)) * 0.34;
        float cloudA = fbm(uv * vec2(3.7, 5.0) + vec2(uTime * 0.018, 0.0));
        float cloudB = fbm(uv * vec2(7.0, 8.0) + vec2(-uTime * 0.009, 8.3));
        float clouds = smoothstep(0.46, 0.76, cloudA * 0.72 + cloudB * 0.38);
        float moonVisibility = 1.0 - clouds * 0.88;
        vec3 color = sky + vec3(0.24, 0.33, 0.39) * clouds * 0.78;
        color += vec3(0.68, 0.78, 0.8) * moonHalo * moonVisibility;
        color = mix(color, vec3(0.78, 0.84, 0.83), moon * moonVisibility);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    side: THREE.DoubleSide,
    toneMapped: false,
  }), [])
  useFrame((_, delta) => {
    if (ref.current) ref.current.uniforms.uTime.value += delta
  })
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (camera.position.z < 7) invalidate()
    }, 66)
    return () => window.clearInterval(timer)
  }, [camera, invalidate])
  return <mesh material={material} position={[0, 0, 0.18]}><circleGeometry args={[1.76, 64]} /></mesh>
}

function RoseWindow() {
  const spokes = useMemo(() => Array.from({ length: 8 }, (_, i) => ({ position: [0, 0, 0.38], rotation: [0, 0, i * Math.PI / 4], scale: [0.05, 3.45, 0.04] })), [])
  return (
    <group position={[0, 12.5, -71.68]} scale={2.45}>
      <mesh material={stone} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[2.05, 2.05, 0.3, 48]} /></mesh>
      <MoonlitWindowSurface />
      <StaticInstances material={brass} transforms={spokes} />
      {Array.from({ length: 8 }, (_, i) => {
        const angle = i * Math.PI / 4
        return <mesh key={`petal-${i}`} material={brass} position={[Math.cos(angle) * 0.82, Math.sin(angle) * 0.82, 0.42]}><torusGeometry args={[0.62, 0.035, 8, 28]} /></mesh>
      })}
      <mesh material={brass} position={[0, 0, 0.43]}><torusGeometry args={[0.48, 0.045, 8, 32]} /></mesh>
      <mesh material={brass} position={[0, 0, 0.4]}><torusGeometry args={[1.74, 0.05, 8, 64]} /></mesh>
      <pointLight position={[0, 0, 1]} color="#b9d9ed" intensity={18} distance={28} decay={1.7} />
    </group>
  )
}

function Balcony() {
  const platforms = useMemo(() => [-1, 1].map((side) => ({ position: [side * 5.25, 5.45, -37], scale: [1.5, 0.25, 43] })), [])
  const rails = useMemo(() => [-1, 1].map((side) => ({ position: [side * 4.45, 6.13, -37], scale: [0.06, 0.06, 43] })), [])
  const posts = useMemo(() => [-1, 1].flatMap((side) => Array.from({ length: 14 }, (_, i) => ({ position: [side * 4.45, 5.8, -17 - i * 3.1], scale: [0.045, 0.7, 0.045] }))), [])
  return (
    <>
      <StaticInstances material={wood} transforms={platforms} />
      <StaticInstances material={brass} transforms={[...rails, ...posts]} />
    </>
  )
}

function ShelfBatch({ shelves, shelfMaterial }) {
  const batches = useMemo(() => {
    const frameBoxes = []
    const pillars = []
    const capitals = []
    const books = []
    const spineDetails = []
    const brassBars = []
    const width = 5.15
    const height = 13.2
    const rows = 14
    const rowStep = 0.89

    shelves.forEach((shelf) => {
      const parentPosition = new THREE.Vector3().fromArray(shelf.position)
      const parentRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(...(shelf.rotation || [0, 0, 0])))
      const parentScale = Array.isArray(shelf.scale)
        ? new THREE.Vector3().fromArray(shelf.scale)
        : new THREE.Vector3().setScalar(shelf.scale || 1)
      const parentMatrix = new THREE.Matrix4().compose(parentPosition, parentRotation, parentScale)
      const toWorld = (transform) => {
        const localPosition = new THREE.Vector3().fromArray(transform.position)
        const localRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(...(transform.rotation || [0, 0, 0])))
        const localScale = new THREE.Vector3().fromArray(transform.scale || [1, 1, 1])
        const worldMatrix = parentMatrix.clone().multiply(new THREE.Matrix4().compose(localPosition, localRotation, localScale))
        const worldPosition = new THREE.Vector3()
        const worldRotation = new THREE.Quaternion()
        const worldScale = new THREE.Vector3()
        worldMatrix.decompose(worldPosition, worldRotation, worldScale)
        const worldEuler = new THREE.Euler().setFromQuaternion(worldRotation, 'XYZ')
        return {
          position: worldPosition.toArray(),
          rotation: [worldEuler.x, worldEuler.y, worldEuler.z],
          scale: worldScale.toArray(),
        }
      }

      const shelfBoxes = [
        { position: [0, height / 2, 0], scale: [width, height, 0.58] },
        ...[-2.52, 0, 2.52].map((x) => ({ position: [x, height / 2, 0], scale: [0.18, height + 0.5, 0.88] })),
        ...Array.from({ length: rows + 1 }, (_, row) => ({ position: [0, 0.22 + row * rowStep, 0], scale: [width + 0.12, 0.13, 0.9] })),
        { position: [0, 0.12, 0], scale: [width + 0.42, 0.34, 1.04] },
        { position: [0, height + 0.14, 0], scale: [width + 0.52, 0.4, 1.04] },
        { position: [0, height + 0.52, 0], scale: [width + 0.12, 0.18, 0.86] },
        ...[-1, 1].flatMap((side) => [
          { position: [side * 2.68, height / 2, 0], scale: [0.2, height - 0.35, 1.08] },
          { position: [side * 2.8, 1.1, 0], scale: [0.16, 1.65, 1.28] },
          { position: [side * 2.8, height - 1.02, 0], scale: [0.16, 1.45, 1.28] },
        ]),
      ]
      frameBoxes.push(...shelfBoxes.map(toWorld))
      pillars.push(...[-2.62, 2.62].map((x) => toWorld({ position: [x, height / 2, 0], scale: [1, height, 1] })))
      capitals.push(...[-2.62, 2.62].flatMap((x) => [
        toWorld({ position: [x, 0.28, 0] }),
        toWorld({ position: [x, height + 0.36, 0], scale: [1.14, 1.1, 1.14] }),
      ]))
      brassBars.push(
        toWorld({ position: [0, height + 0.55, 0.47], scale: [2.5, 0.06, 0.035] }),
        toWorld({ position: [0, height + 0.55, -0.47], scale: [2.5, 0.06, 0.035] }),
      )

      for (const face of [-1, 1]) {
        for (let row = 0; row < rows; row += 1) {
          let x = -2.27
          let index = 0
          while (x < 2.2) {
            if ((index * 11 + row * 7 + shelf.seed * 3) % 37 === 0) x += 0.13
            const bookWidth = 0.15 + ((index * 13 + shelf.seed * 7 + row * 5) % 8) * 0.015
            const bookHeight = 0.47 + ((index * 17 + shelf.seed * 3 + row * 7) % 8) * 0.025
            const tilt = ((index * 5 + shelf.seed + row) % 13 === 0) ? (((index + row) % 2 ? 1 : -1) * 0.11) : 0
            const localBook = {
              position: [x + bookWidth / 2, 0.38 + row * rowStep + bookHeight / 2, face * (0.34 + ((index + row + shelf.seed) % 4) * 0.006)],
              rotation: [0, face < 0 ? Math.PI : 0, tilt],
              scale: [bookWidth, bookHeight, 0.17 + ((index + row) % 3) * 0.015],
            }
            books.push({
              ...toWorld(localBook),
              color: bookPalette[(index + row * 2 + shelf.seed + shelf.district) % bookPalette.length],
            })
            if (index % 7 === 0) {
              const [bookX, bookY, bookZ] = localBook.position
              const frontZ = bookZ + face * 0.095
              const details = [
                { position: [bookX, bookY - bookHeight * 0.27, frontZ], rotation: localBook.rotation, scale: [bookWidth * 0.78, 0.018, 0.012] },
                { position: [bookX, bookY + bookHeight * 0.29, frontZ], rotation: localBook.rotation, scale: [bookWidth * 0.78, 0.018, 0.012] },
                ...(index % 21 === 0 ? [
                  { position: [bookX, bookY, frontZ + face * 0.003], rotation: localBook.rotation, scale: [bookWidth * 0.3, bookHeight * 0.32, 0.009] },
                  { position: [bookX, bookY, frontZ + face * 0.006], rotation: localBook.rotation, scale: [bookWidth * 0.55, 0.012, 0.011] },
                ] : []),
              ]
              spineDetails.push(...details.map(toWorld))
            }
            x += bookWidth + 0.03
            index += 1
          }
        }
      }
    })
    return { frameBoxes, pillars, capitals, books, spineDetails, brassBars }
  }, [shelves])

  return (
    <>
      <StaticInstances material={shelfMaterial} transforms={batches.frameBoxes} />
      <StaticInstances geometry={shelfPillarGeometry} material={shelfMaterial} transforms={batches.pillars} />
      <StaticInstances geometry={shelfCapitalGeometry} material={shelfMaterial} transforms={batches.capitals} />
      <BookInstances books={batches.books} withSpineDetails={false} />
      <StaticInstances material={brass} transforms={batches.spineDetails} />
      <StaticInstances material={brass} transforms={batches.brassBars} />
      {shelves.map((shelf) => (
        <group key={`shelf-detail-${shelf.seed}`} position={shelf.position} rotation={shelf.rotation || [0, 0, 0]} scale={shelf.scale || 1}>
          <ShelfTitleLabels seed={shelf.seed} />
          {shelf.seed % 17 === 0 && <EncyclopediaStack position={[1.36, 4.88, 0.62]} rotation={[0, -0.08, 0]} scale={0.72} />}
        </group>
      ))}
    </>
  )
}

function ShelfField({ shelves }) {
  const sourceMaps = useTexture(DARK_WOOD_TEXTURES)
  const colorMap = sourceMaps.map
  const armMap = sourceMaps.armMap
  const normalMap = sourceMaps.normalMap
  const shelfMaterial = useMemo(() => {
    const maps = {}
    Object.entries({ map: colorMap, armMap, normalMap }).forEach(([key, texture]) => {
      const clone = texture.clone()
      clone.wrapS = THREE.RepeatWrapping
      clone.wrapT = THREE.RepeatWrapping
      clone.repeat.set(1.7, 5.5)
      clone.colorSpace = key === 'map' ? THREE.SRGBColorSpace : THREE.NoColorSpace
      clone.needsUpdate = true
      maps[key] = clone
    })
    return new THREE.MeshStandardMaterial({
      color: '#876148',
      emissive: '#160a06',
      emissiveIntensity: 0.16,
      map: maps.map,
      roughnessMap: maps.armMap,
      normalMap: maps.normalMap,
      normalScale: new THREE.Vector2(0.44, 0.44),
      roughness: 0.94,
      metalness: 0,
    })
  }, [armMap, colorMap, normalMap])
  const shelfBays = useMemo(() => {
    const grouped = new Map()
    shelves.forEach((shelf) => {
      const bay = Math.floor((6 - shelf.position[2]) / 14)
      if (!grouped.has(bay)) grouped.set(bay, [])
      grouped.get(bay).push(shelf)
    })
    return [...grouped.entries()].sort(([a], [b]) => a - b)
  }, [shelves])
  return shelfBays.map(([bay, bayShelves]) => (
    <ShelfBatch key={`shelf-bay-${bay}`} shelves={bayShelves} shelfMaterial={shelfMaterial} />
  ))
}

function MainHallReadingZones() {
  const zones = useMemo(() => [
    { z: -8, tables: [[-4.25, 0], [4.25, 0]] },
    { z: -34, tables: [[-4.25, 0], [4.25, 0]] },
    { z: -56, tables: [[-4.25, 0], [4.25, 0]] },
  ], [])
  return (
    <>
      {zones.map((zone, index) => (
        <group key={`study-zone-${zone.z}`}>
          {zone.tables.map(([x, offsetZ], tableIndex) => (
            <StudyTable key={`${zone.z}-${tableIndex}`} position={[x, 0, zone.z + offsetZ]} seed={index * 2 + tableIndex} />
          ))}
        </group>
      ))}
    </>
  )
}

function InteriorScene({ progress, shelves, exploreEnabled = false, forceVisible = false }) {
  const ref = useRef()
  const warmupFrames = useRef(0)
  useFrame(() => {
    warmupFrames.current += 1
    if (ref.current) ref.current.visible = forceVisible || scenePreparationCount > 0 || warmupFrames.current <= 3 || progress.current > 0.055
  })
  return (
    <group ref={ref} visible>
      <GrandHallShell />
      <ShelfField shelves={shelves} />
      <MainHallReadingZones />
      {!exploreEnabled && <>
        <Ladder position={[20.15, TALL_LADDER_CENTER_Y, -39.65]} rotation={[0, 0, -0.11]} />
        <Ladder position={[-20.15, TALL_LADDER_CENTER_Y, -54.1]} rotation={[0, 0, 0.1]} />
        <Ladder position={[-8.05, TALL_LADDER_CENTER_Y, -14.25]} rotation={[0, 0, -0.1]} />
        <Ladder position={[8.05, TALL_LADDER_CENTER_Y, -46.8]} rotation={[0, 0, 0.1]} />
      </>}
      <RoseWindow />
      <Sparkles count={96} scale={[38, 15, 76]} position={[0, 7, -26]} size={0.58} speed={0.06} color="#c48642" opacity={0.2} />
    </group>
  )
}

function InspectionCameraRig({ view }) {
  const { camera, invalidate } = useThree()
  const target = useMemo(() => {
    const views = {
      ladder: { pos: [15.1, 3.3, -34.6], look: [20.2, 4.1, -39.65] },
      ladderLeftWall: { pos: [-15.6, 3.15, -48.4], look: [-20.15, 4.15, -54.1] },
      ladderLeftAisle: { pos: [-11.25, 2.8, -9.2], look: [-8.05, 4.15, -14.25] },
      ladderRightAisle: { pos: [11.2, 2.8, -41.2], look: [8.05, 4.15, -46.8] },
      nook: { pos: [-13.8, 2.2, -18], look: [-19.3, 1.4, -23] },
      entrance: { pos: [0, 2.25, -10.5], look: [0, 4.2, 8.5] },
      entranceLeft: { pos: [-4.15, 2.65, -4.2], look: [0, 4.45, 8.45] },
      entranceRight: { pos: [4.15, 2.65, -4.2], look: [0, 4.45, 8.45] },
      entranceThresholdOutside: { pos: [0, 2.05, 12.65], look: [0, 3.2, 8.35] },
      courtyardFront: { pos: [0, 2.2, 25.5], look: [0, 4.2, 8.45] },
      courtyardRear: { pos: [0, 2.05, 12.8], look: [0, 3.2, 31.5] },
      courtyardLeft: { pos: [0.8, 2.05, 12.7], look: [-13.7, 3.1, 23.2] },
      courtyardRight: { pos: [-0.8, 2.05, 26.8], look: [13.7, 3.1, 17.4] },
      table: { pos: [2.9, 2.35, -2.4], look: [4.25, 1.1, -8] },
      candle: { pos: [-2.8, 2.3, -2.5], look: [-4.25, 1.1, -8] },
      aisle: { pos: [-14.5, 2.2, -32], look: [-21, 3.2, -37] },
      shelfDepth: { pos: [-10.15, 2.85, -8.3], look: [-13.35, 3.25, -12.1] },
      night: { pos: [0, 4.2, -48], look: [0, 12.3, -72] },
      freeStart: { pos: [0, 2.05, 7], look: [0, 2.7, -7] },
      freeRig: { pos: [-10.1, 2.15, 3.2], look: [-7.2, 2.9, -4.5] },
      userBook: { pos: [-5.72, 2.56, 2], look: [-7.2, 2.56, 2] },
      climbComposition: { pos: [-10.4, 2.25, -28], look: [-7.2, 2.35, -28] },
      contextLadder: { pos: [-11.6, 4.1, -28], look: [-7.2, 4.2, -28] },
      contextLadderSide: { pos: [-10.7, 0.72, -24.1], look: [-8.05, 1.65, -28] },
    }
    return views[view]
  }, [view])
  useFrame(() => {
    if (!target) return
    camera.position.fromArray(target.pos)
    camera.lookAt(new THREE.Vector3().fromArray(target.look))
    camera.updateMatrixWorld(true)
  })
  useEffect(() => { invalidate() }, [invalidate, target])
  return null
}

const cameraStops = [
  { at: 0, pos: [0.3, 1.05, 24.2], look: [0, 5.75, 8.15] },
  { at: 0.18, pos: [0, 2.05, 7], look: [0, 2.7, -7] },
  { at: 0.29, pos: [0, 2.05, -2], look: [0, 2.8, -16] },
  { at: 0.38, pos: [0, 2.05, -15], look: [-10, 2.65, -15] },
  { at: 0.47, pos: [-10, 2.05, -15], look: [-10, 2.8, -29] },
  { at: 0.59, pos: [-10, 2.05, -24.5], look: [0, 2.65, -24.5] },
  { at: 0.68, pos: [0, 2.05, -24.5], look: [10, 2.65, -24.5] },
  { at: 0.77, pos: [10, 2.05, -24.5], look: [10, 2.8, -43] },
  { at: 0.89, pos: [10, 2.05, -50], look: [2, 3.2, -62] },
  { at: 1, pos: [0, 2.15, -61], look: [0, 7.5, -72] },
]

const exploreShelfBands = [2, -5, -12, -21, -28, -35, -44, -51, -62]
const exploreShelfLanes = [-13.4, -7.2, 7.2, 13.4]
const exploreTableBands = [-8, -34, -56]
const wallShelfBands = [-9, -23, -37, -51, -65]
const exploreObstacles = [
  ...exploreShelfBands.flatMap((z) => exploreShelfLanes
    .filter((x) => !(x === -13.4 && z === -21))
    .map((x) => ({ x, z, halfX: 0.62, halfZ: 2.56 }))),
  ...exploreTableBands.flatMap((z) => [-4.25, 4.25].map((x) => ({ x, z, halfX: 1.48, halfZ: 3.65 }))),
  ...wallShelfBands.flatMap((z) => [-1, 1].flatMap((side) => [-2.65, 2.65]
    .filter(() => !(side === -1 && z === -23))
    .map((offset) => ({ x: side * 21.95, z: z + offset, halfX: 0.72, halfZ: 2.5 })))),
  { x: 0, z: -21.5, halfX: 1.15, halfZ: 1.15 },
  { x: -19.3, z: -23, halfX: 1.65, halfZ: 3.1 },
]

function canExploreAt(x, z) {
  const radius = 0.34
  if (x < -22.2 || x > 22.2 || z < -69.5) return false
  // Keep the entrance wall solid except at the real doorway, then open into a
  // proper courtyard. The short throat prevents diagonal wall clipping while
  // still letting the visitor walk back through either opening door.
  if (z > 6.4 && z < 9.35 && Math.abs(x) > 3.55) return false
  if (z >= 9.35 && (Math.abs(x) > 10.75 || z > 30.55)) return false
  return !exploreObstacles.some((box) => (
    Math.abs(x - box.x) < box.halfX + radius && Math.abs(z - box.z) < box.halfZ + radius
  ))
}

function FreeExploreRig({ enabled, paused = false, targetRoot, onLockChange, onTargetChange, onInteract, climbing = false, ladderPlacement, ladderSlideRef, ladderHeightRef, ladderLookRef, onDismount }) {
  const { camera, gl, invalidate } = useThree()
  const keys = useRef(new Set())
  const velocity = useRef(new THREE.Vector3())
  const yaw = useRef(0)
  const pitch = useRef(0)
  const touch = useRef({ id: null, x: 0, y: 0 })
  const desired = useMemo(() => new THREE.Vector3(), [])
  const forward = useMemo(() => new THREE.Vector3(), [])
  const right = useMemo(() => new THREE.Vector3(), [])
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const lastRaycast = useRef(0)
  const currentTarget = useRef(null)
  const lastTargetKey = useRef('')
  const climbHeight = useRef(2.15)
  const climbOffset = useRef(0)
  const climbVerticalVelocity = useRef(0)
  const climbLateralVelocity = useRef(0)
  const climbCameraTarget = useMemo(() => new THREE.Vector3(), [])
  const climbLookTarget = useMemo(() => new THREE.Vector3(), [])
  const pausedRef = useRef(paused)
  const climbingRef = useRef(climbing)
  pausedRef.current = paused
  climbingRef.current = climbing
  const callbacks = useRef({ onTargetChange, onInteract, onDismount })
  callbacks.current = { onTargetChange, onInteract, onDismount }

  const placeCameraOnLadder = useCallback((height, lateralOffset = 0, lookYaw = 0) => {
    if (!ladderPlacement) return
    const face = ladderPlacement.face || 1
    const ladderRotationY = ladderPlacement.rotationY + (face < 0 ? Math.PI : 0)
    const normalX = Math.sin(ladderRotationY)
    const normalZ = Math.cos(ladderRotationY)
    const tangentX = Math.cos(ladderRotationY)
    const tangentZ = -Math.sin(ladderRotationY)
    // Follow the ladder's real 6.3° lean instead of orbiting a fixed distance
    // from the shelf. This keeps the player's head just outside the rails at
    // every rung and prevents both shelf clipping and the "floating" feeling.
    const localHeight = height - TALL_LADDER_CENTER_Y
    const ladderPlaneDistance = 1.04 - localHeight * Math.sin(0.11)
    // The eyes sit just beyond the rung plane, as they would while climbing.
    // Keeping the nearest rung behind the camera preserves visible side rails
    // without a giant bar cutting across the interaction view.
    const cameraDistance = ladderPlaneDistance + 0.72
    climbCameraTarget.set(
      ladderPlacement.position[0] + normalX * cameraDistance + tangentX * lateralOffset,
      height,
      ladderPlacement.position[2] + normalZ * cameraDistance + tangentZ * lateralOffset,
    )
    const lookSlide = lateralOffset + lookYaw * 4.2
    climbLookTarget.set(
      ladderPlacement.position[0] + tangentX * lookSlide,
      height + Math.tan(pitch.current) * 3.2,
      ladderPlacement.position[2] + tangentZ * lookSlide,
    )
  }, [climbCameraTarget, climbLookTarget, ladderPlacement])

  useEffect(() => {
    if (!enabled) {
      keys.current.clear()
      velocity.current.set(0, 0, 0)
      if (document.pointerLockElement === gl.domElement) document.exitPointerLock?.()
      onLockChange?.(false)
      return undefined
    }

    camera.position.set(0, 2.05, 5.75)
    camera.lookAt(0, 2.7, -8)
    const initial = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ')
    yaw.current = initial.y
    pitch.current = initial.x
    invalidate()

    const canvas = gl.domElement
    const isEditableTarget = (target) => target instanceof HTMLElement && (
      target.isContentEditable ||
      target.matches('input, textarea, select, [role="textbox"]')
    )
    const onKeyDown = (event) => {
      if (isEditableTarget(event.target)) return
      if (event.code === 'Escape' && climbingRef.current) {
        callbacks.current.onDismount?.()
        return
      }
      if (event.code === 'KeyE' && !event.repeat) {
        event.preventDefault()
        if (climbingRef.current) callbacks.current.onDismount?.()
        else if (currentTarget.current) callbacks.current.onInteract?.(currentTarget.current)
        return
      }
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight'].includes(event.code)) {
        event.preventDefault()
        keys.current.add(event.code)
        invalidate()
      }
    }
    const onKeyUp = (event) => {
      if (isEditableTarget(event.target)) return
      keys.current.delete(event.code)
      invalidate()
    }
    const onMouseMove = (event) => {
      if (document.pointerLockElement !== canvas) return
      if (climbingRef.current) ladderLookRef.current = THREE.MathUtils.clamp(ladderLookRef.current + event.movementX * 0.0013, -0.38, 0.38)
      else yaw.current -= event.movementX * 0.0018
      pitch.current = THREE.MathUtils.clamp(pitch.current - event.movementY * 0.00155, -1.18, 1.12)
      invalidate()
    }
    const onPointerDown = (event) => {
      if (event.pointerType === 'touch') {
        touch.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
        canvas.setPointerCapture?.(event.pointerId)
      } else if (document.pointerLockElement === canvas && currentTarget.current) {
        callbacks.current.onInteract?.(currentTarget.current)
      } else if (document.pointerLockElement !== canvas && !pausedRef.current) {
        canvas.requestPointerLock?.()
      }
    }
    const onPointerMove = (event) => {
      if (event.pointerType !== 'touch' || touch.current.id !== event.pointerId) return
      const dx = event.clientX - touch.current.x
      const dy = event.clientY - touch.current.y
      touch.current.x = event.clientX
      touch.current.y = event.clientY
      if (climbingRef.current) ladderLookRef.current = THREE.MathUtils.clamp(ladderLookRef.current + dx * 0.004, -0.38, 0.38)
      else yaw.current -= dx * 0.005
      pitch.current = THREE.MathUtils.clamp(pitch.current - dy * 0.004, -1.18, 1.12)
      invalidate()
    }
    const onPointerUp = (event) => {
      if (touch.current.id === event.pointerId) touch.current.id = null
    }
    const onPointerLockChange = () => onLockChange?.(document.pointerLockElement === canvas)
    const onVirtualMove = (event) => {
      const { code, active } = event.detail || {}
      if (!code) return
      if (active) keys.current.add(code)
      else keys.current.delete(code)
      invalidate()
    }
    const clearKeys = () => { keys.current.clear(); invalidate() }

    window.addEventListener('keydown', onKeyDown, { passive: false })
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', clearKeys)
    window.addEventListener('explore-move', onVirtualMove)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('pointerlockchange', onPointerLockChange)
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', clearKeys)
      window.removeEventListener('explore-move', onVirtualMove)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('pointerlockchange', onPointerLockChange)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
      keys.current.clear()
    }
  }, [camera, enabled, gl, invalidate, onLockChange])

  useEffect(() => {
    if (!climbing || !ladderPlacement) return
    climbHeight.current = THREE.MathUtils.clamp(camera.position.y, 2.05, CLIMB_MAX_HEIGHT)
    if (ladderHeightRef) ladderHeightRef.current = climbHeight.current
    climbOffset.current = 0
    climbVerticalVelocity.current = 0
    climbLateralVelocity.current = 0
    ladderLookRef.current = 0
    pitch.current = THREE.MathUtils.clamp(pitch.current, -0.32, 0.42)
    placeCameraOnLadder(climbHeight.current)
    camera.position.copy(climbCameraTarget)
    camera.lookAt(climbLookTarget)
    camera.updateMatrixWorld(true)
    invalidate()
  }, [camera, climbing, climbCameraTarget, climbLookTarget, invalidate, ladderPlacement, placeCameraOnLadder])

  useFrame((_, frameDelta) => {
    if (!enabled) return
    const delta = Math.min(frameDelta, 0.05)
    const held = keys.current
    const targetFov = climbing ? 64 : 46
    if (Math.abs(camera.fov - targetFov) > 0.02) {
      camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 8.5, delta)
      camera.updateProjectionMatrix()
      invalidate()
    }
    if (climbing && ladderPlacement) {
      const climbInput = (held.has('KeyW') || held.has('ArrowUp') ? 1 : 0) - (held.has('KeyS') || held.has('ArrowDown') ? 1 : 0)
      const lateralInput = (held.has('KeyD') || held.has('ArrowRight') ? 1 : 0) - (held.has('KeyA') || held.has('ArrowLeft') ? 1 : 0)
      climbVerticalVelocity.current = THREE.MathUtils.damp(climbVerticalVelocity.current, climbInput * 1.85, 9.5, delta)
      climbLateralVelocity.current = THREE.MathUtils.damp(climbLateralVelocity.current, lateralInput * 1.3, 10.5, delta)
      climbHeight.current = THREE.MathUtils.clamp(climbHeight.current + climbVerticalVelocity.current * delta, 2.05, CLIMB_MAX_HEIGHT)
      if (ladderHeightRef) ladderHeightRef.current = climbHeight.current
      climbOffset.current = THREE.MathUtils.clamp(climbOffset.current + climbLateralVelocity.current * delta, -1.55, 1.55)
      if (ladderSlideRef) ladderSlideRef.current = climbOffset.current
      placeCameraOnLadder(climbHeight.current, climbOffset.current, ladderLookRef.current)
      camera.position.lerp(climbCameraTarget, 1 - Math.exp(-delta * 8.5))
      pitch.current = THREE.MathUtils.clamp(pitch.current, -0.48, 0.56)
      camera.lookAt(climbLookTarget)
      if (climbInput || lateralInput || Math.abs(climbVerticalVelocity.current) > 0.01 || Math.abs(climbLateralVelocity.current) > 0.01 || camera.position.distanceToSquared(climbCameraTarget) > 0.0002) invalidate()
    } else if (!paused) {
    const forwardInput = (held.has('KeyW') || held.has('ArrowUp') ? 1 : 0) - (held.has('KeyS') || held.has('ArrowDown') ? 1 : 0)
    const rightInput = (held.has('KeyD') || held.has('ArrowRight') ? 1 : 0) - (held.has('KeyA') || held.has('ArrowLeft') ? 1 : 0)
    const running = held.has('ShiftLeft') || held.has('ShiftRight')
    const speed = running ? 6.2 : 3.8
    desired.set(0, 0, 0)
    if (forwardInput || rightInput) {
      forward.set(-Math.sin(yaw.current), 0, -Math.cos(yaw.current))
      right.set(Math.cos(yaw.current), 0, -Math.sin(yaw.current))
      desired.addScaledVector(forward, forwardInput).addScaledVector(right, rightInput).normalize().multiplyScalar(speed)
    }
    velocity.current.lerp(desired, 1 - Math.exp(-delta * 9.5))
    if (velocity.current.lengthSq() < 0.0004) velocity.current.set(0, 0, 0)

    const nextX = camera.position.x + velocity.current.x * delta
    if (canExploreAt(nextX, camera.position.z)) camera.position.x = nextX
    else velocity.current.x = 0
    const nextZ = camera.position.z + velocity.current.z * delta
    if (canExploreAt(camera.position.x, nextZ)) camera.position.z = nextZ
    else velocity.current.z = 0
    camera.position.y = THREE.MathUtils.damp(camera.position.y, 2.05, 13, delta)
    camera.rotation.set(pitch.current, yaw.current, 0, 'YXZ')
    if (velocity.current.lengthSq() > 0.0001) invalidate()
    } else {
      velocity.current.set(0, 0, 0)
    }

    const now = performance.now()
    if (!paused && targetRoot?.current && now - lastRaycast.current > 75) {
      lastRaycast.current = now
      raycaster.setFromCamera({ x: 0, y: 0 }, camera)
      // A shelf is a room-scale destination and should announce itself from the
      // aisle. Individual books remain a close-reading interaction so distant
      // volumes never steal focus from the collection they belong to.
      raycaster.far = climbing ? 4.4 : 9.6
      const hits = raycaster.intersectObjects(targetRoot.current.children, true)
      const hit = hits.find((candidate) => {
        const type = candidate.object?.userData?.interactionType
        if (!type || (climbing && type === 'ladder')) return false
        const maximumDistance = climbing ? 4.4 : type === 'shelf' ? 9.6 : type === 'ladder' ? 7.2 : 5.8
        return candidate.distance <= maximumDistance
      })
      let target = null
      if (hit?.object?.userData?.interactionType) {
        const data = hit.object.userData
        target = { type: data.interactionType, id: data.interactionId, shelfId: data.shelfId, title: data.title, distance: hit.distance }
        if (data.interactionType === 'shelf') {
          const shelfPosition = new THREE.Vector3(...data.shelfPosition)
          const normal = new THREE.Vector3(Math.sin(data.rotationY), 0, Math.cos(data.rotationY))
          target.face = Math.sign(camera.position.clone().sub(shelfPosition).dot(normal)) || 1
          target.shelfPosition = data.shelfPosition
          target.rotationY = data.rotationY
        }
      }
      const key = target ? `${target.type}:${target.id}:${target.face || ''}` : ''
      currentTarget.current = target
      if (key !== lastTargetKey.current) {
        lastTargetKey.current = key
        callbacks.current.onTargetChange?.(target)
      }
    }
  })
  return null
}

function ExplorerLantern({ enabled, climbing }) {
  const { camera, scene, invalidate } = useThree()
  useEffect(() => {
    if (!enabled) return undefined
    const beam = new THREE.SpotLight('#f2ad62', climbing ? 108 : 44, climbing ? 24 : 18, climbing ? 0.52 : 0.43, 0.72, 1.55)
    const fill = new THREE.PointLight('#c97939', climbing ? 19 : 7.5, climbing ? 7.5 : 5.2, 1.8)
    beam.position.set(0.24, -0.2, -0.12)
    fill.position.set(-0.28, -0.18, -0.45)
    beam.target.position.set(0, -0.12, -8)
    camera.add(beam, fill, beam.target)
    scene.updateMatrixWorld(true)
    invalidate()
    return () => {
      camera.remove(beam, fill, beam.target)
      beam.dispose()
      fill.dispose()
      invalidate()
    }
  }, [camera, climbing, enabled, invalidate, scene])
  return null
}

function ClimberReadingLight({ enabled, placement, slideRef, heightRef, lookRef }) {
  const beamRef = useRef()
  const spillRef = useRef()
  const fillRef = useRef()
  const targetRef = useRef()
  const spillTargetRef = useRef()
  const { invalidate } = useThree()

  useLayoutEffect(() => {
    if (!enabled || !beamRef.current || !spillRef.current || !targetRef.current || !spillTargetRef.current) return
    beamRef.current.target = targetRef.current
    spillRef.current.target = spillTargetRef.current
    invalidate()
  }, [enabled, invalidate])

  useFrame(() => {
    if (!enabled || !placement || !beamRef.current || !spillRef.current || !fillRef.current || !targetRef.current || !spillTargetRef.current) return
    const face = placement.face || 1
    const rotationY = placement.rotationY + (face < 0 ? Math.PI : 0)
    const normalX = Math.sin(rotationY)
    const normalZ = Math.cos(rotationY)
    const tangentX = Math.cos(rotationY)
    const tangentZ = -Math.sin(rotationY)
    const lateral = slideRef.current
    const height = heightRef.current
    const gazeOffset = lateral + lookRef.current * 4.2

    beamRef.current.position.set(
      placement.position[0] + normalX * 1.48 + tangentX * (lateral - 0.18),
      height - 0.14,
      placement.position[2] + normalZ * 1.48 + tangentZ * (lateral - 0.18),
    )
    targetRef.current.position.set(
      placement.position[0] + normalX * 0.22 + tangentX * gazeOffset,
      height + 0.28,
      placement.position[2] + normalZ * 0.22 + tangentZ * gazeOffset,
    )
    spillRef.current.position.copy(beamRef.current.position)
    spillTargetRef.current.position.set(
      placement.position[0] + normalX * 0.18 + tangentX * (lateral + lookRef.current * 2.2),
      height + 0.2,
      placement.position[2] + normalZ * 0.18 + tangentZ * (lateral + lookRef.current * 2.2),
    )
    fillRef.current.position.set(
      placement.position[0] + normalX * 1.05 + tangentX * lateral,
      height - 0.42,
      placement.position[2] + normalZ * 1.05 + tangentZ * lateral,
    )
    beamRef.current.updateMatrixWorld()
    spillRef.current.updateMatrixWorld()
    fillRef.current.updateMatrixWorld()
    targetRef.current.updateMatrixWorld()
    spillTargetRef.current.updateMatrixWorld()
  })

  if (!enabled || !placement) return null
  return (
    <>
      <spotLight ref={beamRef} color="#ffc27c" intensity={5.5} distance={5.8} angle={0.5} penumbra={0.88} decay={1.92} castShadow={false} />
      <spotLight ref={spillRef} color="#c97036" intensity={1.45} distance={5.2} angle={0.88} penumbra={0.97} decay={2} castShadow={false} />
      <pointLight ref={fillRef} color="#8e4322" intensity={0.35} distance={3.4} decay={2} castShadow={false} />
      <object3D ref={targetRef} />
      <object3D ref={spillTargetRef} />
    </>
  )
}

function CameraRig({ progress, pointer }) {
  const { camera, invalidate } = useThree()
  const target = useMemo(() => new THREE.Vector3(), [])
  const lookTarget = useMemo(() => new THREE.Vector3(), [])
  const stopPosition = useMemo(() => new THREE.Vector3(), [])
  const stopLook = useMemo(() => new THREE.Vector3(), [])
  const smoothedProgress = useRef(progress.current)
  useFrame((_, delta) => {
    smoothedProgress.current = THREE.MathUtils.damp(smoothedProgress.current, progress.current, 4.15, delta)
    const p = smoothedProgress.current
    let a = cameraStops[0]
    let b = cameraStops[cameraStops.length - 1]
    for (let i = 0; i < cameraStops.length - 1; i += 1) if (p >= cameraStops[i].at && p <= cameraStops[i + 1].at) { a = cameraStops[i]; b = cameraStops[i + 1]; break }
    const local = THREE.MathUtils.smootherstep((p - a.at) / Math.max(0.001, b.at - a.at), 0, 1)
    stopPosition.fromArray(b.pos)
    target.fromArray(a.pos).lerp(stopPosition, local)
    target.x += pointer.current.x * 0.22
    target.y += pointer.current.y * 0.12
    camera.position.lerp(target, 1 - Math.exp(-delta * 4.4))
    stopLook.fromArray(b.look)
    lookTarget.fromArray(a.look).lerp(stopLook, local)
    lookTarget.x += pointer.current.x * 0.35
    camera.lookAt(lookTarget)
    if (Math.abs(smoothedProgress.current - progress.current) > 0.0001 || camera.position.distanceToSquared(target) > 0.00002) invalidate()
  })
  return null
}

function RenderController() {
  const { invalidate } = useThree()
  useEffect(() => setWorldInvalidator(invalidate), [invalidate])
  return null
}

function MoonlightShaft() {
  const lightRef = useRef()
  const targetRef = useRef()
  useLayoutEffect(() => {
    if (lightRef.current && targetRef.current) lightRef.current.target = targetRef.current
  }, [])
  return (
    <>
      <spotLight ref={lightRef} position={[0, 15.5, -69]} color="#b9d7e8" intensity={235} distance={58} angle={0.48} penumbra={0.88} decay={1.65} castShadow={false} />
      <object3D ref={targetRef} position={[0, 0.3, -38]} />
    </>
  )
}

function ScenePreparation({ onPrepared }) {
  const { camera, gl, invalidate, scene } = useThree()
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return undefined
    started.current = true
    const prepare = async () => {
      scenePreparationCount += 1
      const originalPosition = camera.position.clone()
      const originalQuaternion = camera.quaternion.clone()
      const visibility = new Map()
      scene.traverse((object) => {
        visibility.set(object, object.visible)
        object.visible = true
      })
      try {
        const entrance = scene.getObjectByName('entrance-scene')
        for (const entranceVisible of [true, false]) {
          if (entrance) entrance.visible = entranceVisible
          for (const stop of cameraStops) {
            camera.position.fromArray(stop.pos)
            camera.lookAt(new THREE.Vector3().fromArray(stop.look))
            camera.updateMatrixWorld(true)
            scene.updateMatrixWorld(true)
            if (gl.compileAsync) await gl.compileAsync(scene, camera)
            else gl.compile(scene, camera)
            gl.render(scene, camera)
          }
        }
      } finally {
        scenePreparationCount = Math.max(0, scenePreparationCount - 1)
        visibility.forEach((visible, object) => { object.visible = visible })
        camera.position.copy(originalPosition)
        camera.quaternion.copy(originalQuaternion)
        camera.updateMatrixWorld(true)
        invalidate()
        onPrepared?.()
      }
    }
    prepare()
    return undefined
  }, [camera, gl, invalidate, onPrepared, scene])
  return null
}

export default function LibraryWorld({
  progress,
  pointer,
  perfInteraction,
  benchmarkMode = false,
  onPrepared,
  exploreEnabled = false,
  explorePaused = false,
  onExploreLockChange,
  onExploreTargetChange,
  onExploreInteract,
  focusedTarget,
  libraryBooks = [],
  ladderPlacement,
  climbing = false,
  onDismount,
}) {
  const inspectionView = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('inspect') : null
  const interactionRoot = useRef()
  const [lanternEnabled, setLanternEnabled] = useState(true)
  const ladderSlideRef = useRef(0)
  const ladderHeightRef = useRef(2.05)
  const ladderLookRef = useRef(0)
  useEffect(() => { ladderSlideRef.current = 0 }, [ladderPlacement?.shelfId])
  useEffect(() => {
    const update = (event) => setLanternEnabled(event.detail?.enabled !== false)
    window.addEventListener('library-lantern', update)
    return () => window.removeEventListener('library-lantern', update)
  }, [])
  const shelves = useMemo(() => {
    const zBands = [2, -5, -12, -21, -28, -35, -44, -51, -62]
    const xLanes = [-13.4, -7.2, 7.2, 13.4]
    const districtShelves = zBands.flatMap((z, depthIndex) => xLanes
      .filter((x) => !(x === -13.4 && z === -21))
      .map((x, laneIndex) => ({
      position: [x, 0, z],
      rotation: [0, Math.PI / 2, 0],
      seed: depthIndex * xLanes.length + laneIndex,
      district: Math.min(4, Math.floor(depthIndex / 1.6)),
      id: `shelf-${depthIndex}-${laneIndex}`,
    })))
    const farWallShelves = [-15.2, -9.2, 9.2, 15.2].map((x, index) => ({
      position: [x, 0, -71.55],
      rotation: [0, 0, 0],
      seed: 100 + index,
      district: 4,
      alwaysVisible: true,
      id: `far-shelf-${index}`,
    }))
    const wallBayShelves = [-9, -23, -37, -51, -65].flatMap((z, bayIndex) => [-1, 1].flatMap((side) => [-2.65, 2.65]
      .filter(() => !(side === -1 && z === -23))
      .map((offset, shelfIndex) => ({
      position: [side * 21.95, 0, z + offset],
      rotation: [0, side > 0 ? -Math.PI / 2 : Math.PI / 2, 0],
      scale: 0.92,
      seed: 200 + bayIndex * 4 + (side > 0 ? 2 : 0) + shelfIndex,
      district: Math.min(4, bayIndex),
      id: `wall-shelf-${bayIndex}-${side > 0 ? 'east' : 'west'}-${shelfIndex}`,
    }))))
    return [...districtShelves, ...farWallShelves, ...wallBayShelves]
  }, [])
  return (
    <>
      <color attach="background" args={['#1a0f0b']} />
      <fog attach="fog" args={['#1a0f0b', 34, 108]} />
      <ambientLight color="#b7ada4" intensity={1.42} />
      <hemisphereLight color="#bac6ce" groundColor="#31231d" intensity={1.66} />
      <directionalLight position={[-5, 7.5, 11]} color="#ffc078" intensity={2.15} />
      <directionalLight position={[4, 18, -50]} color="#a6bdca" intensity={1.35} />
      <MoonlightShaft />
      {[-8, -34, -60].map((z) => <pointLight key={`warm-nave-${z}`} position={[0, 5.4, z]} color="#d48648" intensity={74} distance={24} decay={1.82} />)}
      <RenderController />
      <ScenePreparation onPrepared={onPrepared} />
      {benchmarkMode && <PerformanceProbe progress={progress} interaction={perfInteraction} />}
      {inspectionView
        ? <InspectionCameraRig view={inspectionView} />
        : !exploreEnabled && <CameraRig progress={progress} pointer={pointer} />}
      {!inspectionView && <FreeExploreRig enabled={exploreEnabled} paused={explorePaused} targetRoot={interactionRoot} onLockChange={onExploreLockChange} onTargetChange={onExploreTargetChange} onInteract={onExploreInteract} climbing={climbing} ladderPlacement={ladderPlacement} ladderSlideRef={ladderSlideRef} ladderHeightRef={ladderHeightRef} ladderLookRef={ladderLookRef} onDismount={onDismount} />}
      <ExplorerLantern enabled={exploreEnabled && lanternEnabled && !climbing} climbing={false} />
      <ClimberReadingLight enabled={exploreEnabled && lanternEnabled && climbing} placement={ladderPlacement} slideRef={ladderSlideRef} heightRef={ladderHeightRef} lookRef={ladderLookRef} />
      <EntranceScene progress={progress} exploreEnabled={exploreEnabled} />
      <InteriorScene progress={progress} shelves={shelves} exploreEnabled={exploreEnabled} forceVisible={Boolean(inspectionView)} />
      {exploreEnabled && <ShelfInteractionLayer rootRef={interactionRoot} shelves={shelves} books={libraryBooks} focusedTarget={focusedTarget} ladderPlacement={ladderPlacement} ladderSlideRef={ladderSlideRef} ladderHeightRef={ladderHeightRef} climbing={climbing} />}
    </>
  )
}

useGLTF.preload('/assets/models/brass-candleholders/brass_candleholders_1k.gltf')
useGLTF.preload('/assets/models/binder-notebook/binder_notebook_1k.gltf')
useGLTF.preload('/assets/models/encyclopedia-set/book_encyclopedia_set_01_1k.gltf')
useGLTF.preload('/assets/models/grandfather-clock/vintage_grandfather_clock_01_1k.gltf')
useGLTF.preload('/assets/models/lantern-01/Lantern_01_1k.gltf')
useGLTF.preload('/assets/models/shrub-03/shrub_03_1k.gltf')
useGLTF.preload('/assets/models/chandelier-03/Chandelier_03_1k.gltf')
