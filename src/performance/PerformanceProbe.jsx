import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const SEGMENTS = [
  { id: 'hero', min: 0, max: 0.06 },
  { id: 'approach', min: 0.06, max: 0.15 },
  { id: 'threshold', min: 0.15, max: 0.26 },
  { id: 'libraryNear', min: 0.26, max: 0.5 },
  { id: 'libraryMid', min: 0.5, max: 0.75 },
  { id: 'libraryDeep', min: 0.75, max: 1.001 },
]

const percentile = (values, ratio) => {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))]
}

const round = (value, digits = 2) => Number(value.toFixed(digits))

function createBucket() {
  return {
    frameTimes: [],
    drawCalls: [],
    triangles: [],
    cameraSpeeds: [],
    scrollLatencies: [],
    longTasks: [],
    heap: [],
    visibleMeshes: [],
    visibleLights: [],
    programs: [],
  }
}

function summarizeBucket(bucket) {
  const frames = bucket.frameTimes.length
  const average = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
  return {
    frames,
    frameMs: {
      average: round(average(bucket.frameTimes)),
      p50: round(percentile(bucket.frameTimes, 0.5)),
      p95: round(percentile(bucket.frameTimes, 0.95)),
      p99: round(percentile(bucket.frameTimes, 0.99)),
      max: round(Math.max(0, ...bucket.frameTimes)),
    },
    droppedFrameRatio: round(frames ? bucket.frameTimes.filter((value) => value > 20).length / frames : 0, 4),
    severeFrameRatio: round(frames ? bucket.frameTimes.filter((value) => value > 34).length / frames : 0, 4),
    drawCalls: { average: round(average(bucket.drawCalls)), max: Math.max(0, ...bucket.drawCalls) },
    triangles: { average: Math.round(average(bucket.triangles)), max: Math.max(0, ...bucket.triangles) },
    cameraSpeed: { average: round(average(bucket.cameraSpeeds), 3), p95: round(percentile(bucket.cameraSpeeds, 0.95), 3), max: round(Math.max(0, ...bucket.cameraSpeeds), 3) },
    scrollToRenderMs: { average: round(average(bucket.scrollLatencies)), p95: round(percentile(bucket.scrollLatencies, 0.95)), max: round(Math.max(0, ...bucket.scrollLatencies)) },
    longTasks: { count: bucket.longTasks.length, totalMs: round(bucket.longTasks.reduce((sum, value) => sum + value, 0)), maxMs: round(Math.max(0, ...bucket.longTasks)) },
    heapMB: { average: round(average(bucket.heap) / 1048576), max: round(Math.max(0, ...bucket.heap) / 1048576) },
    visibleMeshes: { average: round(average(bucket.visibleMeshes)), max: Math.max(0, ...bucket.visibleMeshes) },
    visibleLights: { average: round(average(bucket.visibleLights)), max: Math.max(0, ...bucket.visibleLights) },
    shaderPrograms: { average: round(average(bucket.programs)), max: Math.max(0, ...bucket.programs) },
  }
}

function segmentFor(progress) {
  return SEGMENTS.find((segment) => progress >= segment.min && progress < segment.max) || SEGMENTS.at(-1)
}

export default function PerformanceProbe({ progress, interaction }) {
  const { camera, gl, scene } = useThree()
  const buckets = useMemo(() => ({ load: createBucket(), ...Object.fromEntries(SEGMENTS.map((segment) => [segment.id, createBucket()])) }), [])
  const lastFrame = useRef(0)
  const lastCameraPosition = useRef(new THREE.Vector3().copy(camera.position))
  const lastScrollSequence = useRef(-1)
  const lastHeapSample = useRef(0)
  const lastPublish = useRef(0)
  const longTasks = useRef([])

  useEffect(() => {
    if (!('PerformanceObserver' in window)) return undefined
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        longTasks.current.push({ duration: entry.duration, progress: progress.current, phase: document.documentElement.dataset.performancePhase || 'load' })
      })
    })
    try { observer.observe({ type: 'longtask', buffered: true }) } catch { return undefined }
    return () => observer.disconnect()
  }, [progress])

  useFrame(() => {
    const now = performance.now()
    const currentProgress = progress.current
    const segment = segmentFor(currentProgress)
    const bucket = buckets[segment.id]
    const frameTime = lastFrame.current ? now - lastFrame.current : 0
    const running = document.documentElement.dataset.performancePhase === 'running'

    if (running && frameTime > 0 && frameTime < 1000) {
      bucket.frameTimes.push(frameTime)
      const cameraDistance = camera.position.distanceTo(lastCameraPosition.current)
      bucket.cameraSpeeds.push(cameraDistance / (frameTime / 1000))
    }
    lastFrame.current = now
    lastCameraPosition.current.copy(camera.position)
    bucket.drawCalls.push(gl.info.render.calls)
    bucket.triangles.push(gl.info.render.triangles)
    bucket.programs.push(gl.info.programs?.length || 0)

    if (interaction.current.scrollSequence !== lastScrollSequence.current) {
      if (interaction.current.scrollTimestamp > 0) bucket.scrollLatencies.push(now - interaction.current.scrollTimestamp)
      lastScrollSequence.current = interaction.current.scrollSequence
    }

    if (performance.memory && now - lastHeapSample.current >= 500) {
      bucket.heap.push(performance.memory.usedJSHeapSize)
      lastHeapSample.current = now
    }

    if (longTasks.current.length) {
      longTasks.current.splice(0).forEach((task) => {
        const target = task.phase === 'running' ? buckets[segmentFor(task.progress).id] : buckets.load
        target.longTasks.push(task.duration)
      })
    }

    if (currentProgress >= 0.999 && lastPublish.current === 0) {
      let visibleMeshes = 0
      let visibleLights = 0
      scene.traverseVisible((object) => {
        if (object.isMesh || object.isInstancedMesh) visibleMeshes += 1
        if (object.isLight) visibleLights += 1
      })
      bucket.visibleMeshes.push(visibleMeshes)
      bucket.visibleLights.push(visibleLights)
      const resources = performance.getEntriesByType('resource')
      const payload = {
        capturedAt: new Date().toISOString(),
        viewport: { width: gl.domElement.clientWidth, height: gl.domElement.clientHeight, renderWidth: gl.domElement.width, renderHeight: gl.domElement.height },
        renderer: { geometries: gl.info.memory.geometries, textures: gl.info.memory.textures, programs: gl.info.programs?.length || 0 },
        assets: {
          count: resources.length,
          transferKB: round(resources.reduce((sum, entry) => sum + (entry.transferSize || 0), 0) / 1024),
          decodedKB: round(resources.reduce((sum, entry) => sum + (entry.decodedBodySize || 0), 0) / 1024),
          slowestMs: round(Math.max(0, ...resources.map((entry) => entry.duration))),
        },
        load: summarizeBucket(buckets.load),
        segments: Object.fromEntries(SEGMENTS.map((item) => [item.id, summarizeBucket(buckets[item.id])])),
      }
      gl.domElement.dataset.performanceReport = JSON.stringify(payload)
      let reportNode = document.getElementById('performance-report')
      if (!reportNode) {
        reportNode = document.createElement('output')
        reportNode.id = 'performance-report'
        reportNode.setAttribute('aria-label', 'Performance report')
        Object.assign(reportNode.style, { position: 'fixed', width: '1px', height: '1px', overflow: 'hidden', clipPath: 'inset(50%)' })
        document.body.appendChild(reportNode)
      }
      reportNode.textContent = JSON.stringify(payload)
      lastPublish.current = Number.POSITIVE_INFINITY
    }
  })

  return null
}
