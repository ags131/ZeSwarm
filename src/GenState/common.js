import SafeObject from "../lib/SafeObject"
import { Logger } from "../log"

export const log = new Logger('[GenState] ')

export function resolveTarget(tgt) {
  if (!tgt) return tgt
  if (typeof tgt === 'string') {
    return new SafeObject(tgt)
  }
  if (tgt.roomName && !(tgt instanceof RoomPosition)) {
    return new RoomPosition(tgt.x, tgt.y, tgt.roomName || tgt.room)
  }
  if (tgt instanceof SafeObject && !tgt.valid) {
    return false
  }
  return tgt
}