import intel from './Intel'
import { kernel, restartThread } from './kernel';
import { Logger } from './log';
import { createTicket } from './SpawnManager';
import C from './constants'

const log = new Logger('[ExpansionPlanner]')

kernel.createThread('expansionPlanner', restartThread(expansionPlanner))

function * expansionPlanner () {
  while (true) {
    const targets = new Set(Memory.targets || [])
    const rooms = Object.values(Game.rooms).filter(r => r.controller && r.controller.my)
    log.info(`Settling: ${targets.size ? Array.from(targets).map(a => a[1]) : 'Nowhere'}`)
    const timeout = Game.time + 1000
    for (const target of targets) {
      const [src, dest, expire] = target
      const key = `createNest_${dest}`
      if (Game.time >= expire || (Game.rooms[dest] && Game.rooms[dest].controller.my && Game.rooms[dest].spawn)) {
        if (kernel.hasThread(key)) {
          kernel.destroyThread(key)
        }
        targets.delete(target)
        Memory.targets = Array.from(targets)
      }
      if (!kernel.hasThread(key)) {
        log.info(`Creating nest thread for ${dest}`)
        kernel.createThread(key, createNest(src, dest, timeout))
      }
      yield true
    }
    if (targets.size > 2 || Game.gcl.level <= rooms.length + targets.size) {
      yield
      continue
    }
    const candidates = new Set()
    for (const int of Object.values(intel.rooms)) {
      if (!int.controller) continue // Not claimable
      if (int.owner || int.level) continue // Not claimable, already owned
      if (int.sources.length < 2) continue // We want at least 2 sources
      const [room, lRange] = rooms
        .filter(r => r.level >= 3)
        .map(r => [r, Game.map.findRoute(r.name, int.name, { routeCallback: avoidHostile })])
        .filter(r => r[1])
        .reduce((l, n) => l && l[1].length < n[1].length ? l : n, null) || []
      if (!room) continue
      if (lRange > 8) continue
      const route = Game.map.findRoute(room.name, int.name, { routeCallback: avoidHostile })
      if (route.length > 12) continue // Avoid settling too far
      if (route.length < 6) continue // Avoid settling too close
      // kernel.createThread(`settle_${int.name}`, settleRoom(room.name, int.name))
      log.info(`Found room to settle: ${int.name} ${lRange} ${route.length}`)
      candidates.add([room.name, int.name, timeout])
      yield true
    }
    if (candidates.size) {
      const arr = Array.from(candidates)
      targets.add(arr[Math.floor(Math.random() * arr.length)])
    }
    Memory.targets = Array.from(targets)
    yield
  }
}

function avoidHostile (roomName, fromRoomName) {
  const int = intel.rooms[roomName]
  if (!int) return 8
  if (int.hostile) return Infinity
  if (int.sources.length > 2) return 30 // Avoid SK rooms
  return 1
}

function * createNest (src, target, expire) {
  const log = new Logger(`[Nesting${target}]`)
  while (true) {
    if (Game.time >= expire) return
    if (!Game.rooms[target] || !Game.rooms[target].controller.my) {
      const int = intel.rooms[target]
      const room = Game.rooms[target]
      const timeout = Math.min(expire, Game.time + 200)
      console.log(`Wanted: Claimer. Where: ${target}`)
      createTicket(`claimer_${target}`, {
        valid: () => Game.time < timeout,
        count: 1,
        body: [MOVE, CLAIM],
        memory: {
          role: 'claimer',
          room: src,
          stack: [['claimRoom', target]]
        }
      })
    } else {
      const room = Game.rooms[target]
      if (!room) {
        yield
        continue
      }
      if (Game.rooms[target].spawn) {
        return
      }
    }
    yield
  }
}