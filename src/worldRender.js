let invalidateWorld = null

export function setWorldInvalidator(invalidate) {
  invalidateWorld = invalidate
  return () => {
    if (invalidateWorld === invalidate) invalidateWorld = null
  }
}

export function requestWorldRender() {
  invalidateWorld?.()
}
