import BaseProcess from './BaseProcess'
import C from '/include/constants'
import map from 'lodash-es/map'
import each from 'lodash-es/each'
import filter from 'lodash-es/filter'

export default class Swarm extends BaseProcess {
  constructor (context) {
    super(context)
    this.context = context
    this.kernel = context.queryPosisInterface('baseKernel')
    this.mm = context.queryPosisInterface('memoryManager')
  }

  get nests () {
    this.memory.nests = this.memory.nests || {}
    return this.memory.nests
  }

  run () {
    each(Game.rooms, (room, name) => {
      if (!room.controller || !room.controller.my) return
      if (!this.nests[name]) {
        this.nests[name] = {}
      }
    })
    each(this.nests, (nest, room) => {
      let proc = this.kernel.getProcessById(nest.pid)
      if (!Game.rooms[room] || !Game.rooms[room].controller || !Game.rooms[room].controller.my) {
        if (proc) {
          this.kernel.killProcess(nest.pid)
        }
        delete this.nests[room]
      }
      if (!proc) {
        this.log.info(`Nest not managed, beginning management of ${room}`)
        let { pid } = this.kernel.startProcess('nest', { room })
        nest.pid = pid
      }
    })
    for (let i = 0; i < 5; i++) {
      let cid = this.ensureCreep(`creep_${i}`, {
        rooms: map(filter(Game.rooms, r => r.controller && r.controller.my), 'name'),
        body: [[TOUGH, MOVE]],
        priority: 10
      })
      this.ensureChild(`creep_${i}_${cid}`, 'stackStateCreep', {
        spawnTicket: cid,
        base: ['scout']
      })
    }
    this.ensureChild('intel', 'intel')
    this.kernel.sleep(5)
  }

  interrupt ({ hook: { type, stage }, key }) {
    this.log.info(`INT ${type} ${stage} ${key}`)
  }

  wake () {
    this.log.info('I Have awoken!')
  }

  toString () {
    let rooms = Object.keys(this.nests)
    return `Rooms: ${rooms.length}`
  }
}
