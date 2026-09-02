import { bind, play, setEnabled, setVolume } from 'cuelume'

const SOUND_KEY = 'the-library:ui-sound'
const VOLUME_KEY = 'the-library:ui-volume'
let activePreferences = { enabled: true, volume: 0.42 }

export const readSoundPreferences = () => {
  try {
    return {
      enabled: localStorage.getItem(SOUND_KEY) !== 'off',
      volume: Math.max(0, Math.min(1, Number(localStorage.getItem(VOLUME_KEY) ?? 0.42))),
    }
  } catch {
    return { enabled: true, volume: 0.42 }
  }
}

export const initializeUiSound = () => {
  const preferences = readSoundPreferences()
  activePreferences = preferences
  setEnabled(preferences.enabled)
  setVolume(preferences.volume)
  bind()
  return preferences
}

export const updateUiSound = ({ enabled, volume }) => {
  activePreferences = { enabled, volume }
  setEnabled(enabled)
  setVolume(volume)
  try {
    localStorage.setItem(SOUND_KEY, enabled ? 'on' : 'off')
    localStorage.setItem(VOLUME_KEY, String(volume))
  } catch { /* Sound still works when persistent storage is unavailable. */ }
}

export const cue = (name, volume) => {
  const resolvedName = name === 'close' ? 'bloom' : name
  return play(resolvedName, volume == null ? undefined : { volume })
}
