import _ from 'lodash'
import moment from 'moment'
import EventTypes from './EventTypes.js'
import F from 'lodash/fp'

const millisToMinutes = num => num / 60 * 1000
// const millisToRoundedMinutes = F.compose(F.round(2), millisToMinutes)
// const millisToRoundedMinutes = num => _.round(millisToMinutes(num), 2)
const millisToRoundedMinutes = num => _.round(num / (60 * 1000), 2)

const rowTypeIs = eventType => F.compose(F.isEqual(eventType), F.get('type'))

const doesEventTypeBreakSilence = type => _.includes([
  EventTypes.TEACHER_TALK_START,
  EventTypes.STUDENT_TALK_START
], type)

const isSilentBetween = F.every(row => !doesEventTypeBreakSilence(row.type))

// This function walks through the provided rows
// and calculates average wait time 1 duration. (Currently, it only prints
// the IDs of the rows where wait time will be calculated from).
// This function uses a "return early" strategy, where we start by assuming
// every row can be the start of a question-asking period, and
// then check each condititon to make sure this is the case, skipping
// the row as soon as it fails a check. That is, if the row makes it through
// all the checks without causing the function to return, it is section we care
// about.
function getWaitTimeOnes(rows, requireQuestionEvent = false) {

  let waitTimes = []

  rows.forEach((row, i) => {
    const teacherStartTalking = (row.type === EventTypes.TEACHER_TALK_START)

    // Check #1: Make sure teacher started talking
    if (! teacherStartTalking) { return }

    const indexOfTeacherTalkResume = _.findIndex(rows, rowTypeIs(EventTypes.TEACHER_TALK_START), i+1)
    const doesTeacherTalkResume = (indexOfTeacherTalkResume !== -1)

    // Check #2: Make sure teacher (eventually) starts talking again
    if (! doesTeacherTalkResume) { return }

    const indexOfTeacherTalkStop = _.findIndex(rows, rowTypeIs(EventTypes.TEACHER_TALK_END), i)

    const rowsBetweenTeacherStopAndResumeTalk = _.slice(rows, indexOfTeacherTalkStop, indexOfTeacherTalkResume)

    // Check #3: Make sure there's silence between when teacher stops
    // talking and when they start talking again
    if (! isSilentBetween(rowsBetweenTeacherStopAndResumeTalk)) { return }


    if (requireQuestionEvent) {
      // Find the question event between the start of the teacher
      // talking and when they start talking again (if one exists).
      const rowsBetweenTeacherTalking = _.slice(rows, i, indexOfTeacherTalkResume)
      const question = _.find(rowsBetweenTeacherTalking, rowTypeIs(EventTypes.QUESTION))

      // Check #4: Make sure a question was actually asked!
      if (! question) { return }
    }

    const momentTalkStopped = moment(rows[indexOfTeacherTalkStop].dateTime)
    const momentTalkResumed = moment(rows[indexOfTeacherTalkResume].dateTime)
    waitTimes.push(momentTalkResumed.diff(momentTalkStopped))
  })

  return waitTimes
}

function getTalkTimes(rows) {

  let allTalkTimes = []

  rows.forEach((row, i) => {
    if (! doesEventTypeBreakSilence(row.type)) {
      return
    }

    const isTeacher = (row.type === EventTypes.TEACHER_TALK_START)
    const endEventType = (
      isTeacher ? EventTypes.TEACHER_TALK_END : EventTypes.STUDENT_TALK_END
    )
    const startEvent = row
    const endEvent = _.find(rows, rowTypeIs(endEventType), i)
    allTalkTimes.push({
      isTeacher,
      duration: moment(endEvent.dateTime).diff(moment(startEvent.dateTime)),
    })
  })

  const makeStats = talkTimes => {
    return {
      count: talkTimes.length,
      sum: millisToRoundedMinutes(_.sum(_.map(talkTimes, 'duration'))),
      avg: millisToRoundedMinutes(_.mean(_.map(talkTimes, 'duration'))),
    }
  }

  return {
    teacher: makeStats(allTalkTimes.filter(tt => tt.isTeacher)),
    student: makeStats(allTalkTimes.filter(tt => !tt.isTeacher)),
  }
}

function getSilenceStats(rows) {
  let silentSegments = []
  let indexSilenceStarted = 0
  let isTeacherTalking = false
  let isStudentTalking = false

  rows.forEach((row, i) => {
    const noOneWasTalking = !isTeacherTalking && !isStudentTalking
    const peopleWereTalking = isTeacherTalking || isStudentTalking
    if (row.type === EventTypes.TEACHER_TALK_START) {
      isTeacherTalking = true
    }
    if (isTeacherTalking && row.type === EventTypes.TEACHER_TALK_END) {
      isTeacherTalking = false
    }

    if (row.type === EventTypes.STUDENT_TALK_START) {
      isStudentTalking = true
    }
    if (isStudentTalking && row.type === EventTypes.STUDENT_TALK_END) {
      isStudentTalking = false
    }

    const nowPeopleAreTalking = isTeacherTalking || isStudentTalking
    const nowNoOneIsTalking = !isTeacherTalking && !isStudentTalking

    if (noOneWasTalking && nowPeopleAreTalking) {
      const segment = _.slice(rows, indexSilenceStarted - 1, i + 1)
      if (segment.length > 0) {
        silentSegments.push(segment)
      }
    }
    if (peopleWereTalking && nowNoOneIsTalking) {
      indexSilenceStarted = i
    }
  })

  const silenceDuration = segment => _.last(segment).moment.diff(_.first(segment).moment)

  return {
    count: silentSegments.length,
    sum: millisToRoundedMinutes(_.sum(silentSegments.map(silenceDuration))),
    avg: millisToRoundedMinutes(_.mean(silentSegments.map(silenceDuration))),
  }
}

const removePauses = rows => F.compose(F.get('list'), F.reduce((acc, row) => {
  acc.inPause = (row.type === EventTypes.PAUSE_BEGIN)
  if (!acc.inPause) acc.list.push(row)
  return acc
}, {list: [], inPause: false}))(rows)

const addMoments = F.map(row => _.assign(row, {moment: moment(row.dateTime)}))

const countRowsOfType = type => F.compose(F.size, F.filter(rowTypeIs(type)))

const calculateStatistics = rows => {
  rows = F.compose(removePauses, addMoments)(rows)

  console.log(countRowsOfType(EventTypes.NAME_USED)(rows))
  console.log(_.mean(getWaitTimeOnes(rows, true)))

  return {
    nameUsedCount: countRowsOfType(EventTypes.NAME_USED)(rows),
    uniqueStudentTalkCount: countRowsOfType(EventTypes.UNIQUE_STUDENT_TALK)(rows),
    handsRaisedCount: countRowsOfType(EventTypes.HAND_RAISED)(rows),
    coldCallsCount: countRowsOfType(EventTypes.COLD_CALL)(rows),
    silenceStats: getSilenceStats(rows),
    talkTimes: getTalkTimes(rows),
    waitTimeOnes: getWaitTimeOnes(rows),
  }
}


export default calculateStatistics
