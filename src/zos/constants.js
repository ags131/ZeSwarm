import {
  INT_STAGE,
  INT_TYPE,
  INT_FUNC
} from './InterruptHandler'

const KERNEL_SEGMENT = 1
const INTERRUPT_SEGMENT = 2

const PROC_RUNNING = 1
const PROC_KILLED = 2
const PROC_CRASHED = 3

const PINFO = {
  ID: 'i',
  PID: 'p',
  NAME: 'n',
  STATUS: 's',
  STARTED: 'S',
  WAIT: 'w',
  ENDED: 'e',
  PROCESS: 'P',
  ERROR: 'E'
}

export default {
  INT_FUNC,
  INT_STAGE,
  INT_TYPE,
  KERNEL_SEGMENT,
  INTERRUPT_SEGMENT,
  PROC_RUNNING,
  PROC_KILLED,
  PROC_CRASHED,
  PINFO
}
