import _ from 'lodash'
import moment from 'moment'

const sum = arr => arr.reduce((a, num) => a + num)
const avg = arr => sum(arr) / arr.length
const round2 = num => +num.toFixed(2)
const millisToRoundedMinutes = num => round2(num / (60 * 1000))

const EventTypes = {
  STUDENT_PRESENT: 'Students present',
  TEACHER_TALK_START: 'teacher begin talking',
  TEACHER_TALK_END: 'teacher end talking',
  STUDENT_TALK_START: 'student begin talking',
  STUDENT_TALK_END: 'student end talking',
  CONTENT_QUESTION: 'Not bad TA Question',
  NON_CONTENT_QUESTION: 'Meaningless TA Question',
  COLD_CALL: 'Ice cold call',
  UNIQUE_STUDENT_TALK: 'First time student talks',
  HAND_RAISED: 'Hand raised',
  NAME_USED: 'Use of student name',
}

function rowMatchesType(eventType) {
  return row => row.type === eventType
}

function findRowMatchingType(rows, eventType) {
  return _.find(rows, rowMatchesType(eventType))
}

function doesEventTypeBreakSilence(eventType) {
  const eventTypesBreakingSilence = [
    EventTypes.TEACHER_TALK_START,
    EventTypes.STUDENT_TALK_START
  ]
  return eventTypesBreakingSilence.includes(eventType)
}

function isSilentBetween(rows) {
  return _.every(rows, row => !doesEventTypeBreakSilence(row.type))
}

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

    const indexOfTeacherTalkResume = _.findIndex(rows, rowMatchesType(EventTypes.TEACHER_TALK_START), i+1)
    const doesTeacherTalkResume = (indexOfTeacherTalkResume !== -1)

    // Check #2: Make sure teacher (eventually) starts talking again
    if (! doesTeacherTalkResume) { return }

    const indexOfTeacherTalkStop = _.findIndex(rows, rowMatchesType(EventTypes.TEACHER_TALK_END), i)

    const rowsBetweenTeacherStopAndResumeTalk = _.slice(rows, indexOfTeacherTalkStop, indexOfTeacherTalkResume)

    // Check #3: Make sure there's silence between when teacher stops
    // talking and when they start talking again
    if (! isSilentBetween(rowsBetweenTeacherStopAndResumeTalk)) { return }


    if (requireQuestionEvent) {
      // Find the question event between the start of the teacher
      // talking and when they start talking again (if one exists).
      const rowsBetweenTeacherTalking = _.slice(rows, i, indexOfTeacherTalkResume)
      const question = findRowMatchingType(rowsBetweenTeacherTalking, EventTypes.QUESTION)

      // Check #4: Make sure a question was actually asked!
      if (! question) { return }
    }

    const momentTalkStopped = moment(rows[indexOfTeacherTalkStop].dateTime)
    const momentTalkResumed = moment(rows[indexOfTeacherTalkResume].dateTime)
    waitTimes.push(momentTalkResumed.diff(momentTalkStopped))
    // console.log(`${rows[indexOfTeacherTalkStop]._id} to ${rows[indexOfTeacherTalkResume]._id}`)
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
    const endEvent = _.find(rows, rowMatchesType(endEventType), i)
    allTalkTimes.push({
      isTeacher,
      duration: moment(endEvent.dateTime).diff(moment(startEvent.dateTime)),
    })
  })

  const teacherTalkTimes = allTalkTimes.filter(tt => tt.isTeacher)
  const studentTalkTimes = allTalkTimes.filter(tt => !tt.isTeacher)

  const makeStats = talkTimes => {
    return {
      count: talkTimes.length,
      sum: round2(millisToRoundedMinutes(sum(_.map(talkTimes, 'duration')))),
      avg: round2(millisToRoundedMinutes(avg(_.map(talkTimes, 'duration')))),
    }
  }

  return {
    teacher: makeStats(allTalkTimes.filter(tt => tt.isTeacher)),
    student: makeStats(allTalkTimes.filter(tt => !tt.isTeacher)),
  }
}

function getColdCalls(rows) {
  return _.filter(rows, rowMatchesType(EventTypes.COLD_CALL)).length;
}

function getHandsRaised(rows) {
  return _.filter(rows, rowMatchesType(EventTypes.HAND_RAISED)).length;
}

function getNameUseds(rows) {
  return _.filter(rows, rowMatchesType(EventTypes.NAME_USED)).length;
}

function getSilenceStats(rows) {
  let silences = []
  let indexSilenceStarted = 0
  let isTeacherTalking = false
  let isStudentTalking = false

  rows.forEach((row, i) => {
    const noOneWasTalking = !isTeacherTalking && !isStudentTalking
    const peopleWereTalking = isTeacherTalking || isStudentTalking
    if (row.type == EventTypes.TEACHER_TALK_START) {
      isTeacherTalking = true
    }
    if (isTeacherTalking && row.type == EventTypes.TEACHER_TALK_END) {
      isTeacherTalking = false
    }

    if (row.type == EventTypes.STUDENT_TALK_START) {
      isStudentTalking = true
    }
    if (isStudentTalking && row.type == EventTypes.STUDENT_TALK_END) {
      isStudentTalking = false
    }

    const nowPeopleAreTalking = isTeacherTalking || isStudentTalking
    const nowNoOneIsTalking = !isTeacherTalking && !isStudentTalking

    if (noOneWasTalking && nowPeopleAreTalking) {
      const segment = _.slice(rows, indexSilenceStarted - 1, i + 1)
      if (segment.length > 0) {
        silences.push(segment)
      }
    }
    if (peopleWereTalking && nowNoOneIsTalking) {
      indexSilenceStarted = i
    }
  })

  const silenceDuration = segment => moment(_.last(segment).dateTime).diff(moment(_.first(segment).dateTime))

  return {
    count: silences.length,
    sum: millisToRoundedMinutes(sum(silences.map(silenceDuration))),
    avg: millisToRoundedMinutes(avg(silences.map(silenceDuration))),
  }
}

export {
  getTalkTimes,
  getWaitTimeOnes,
  getColdCalls,
  getSilenceStats,
  getHandsRaised,
  getNameUseds,
};
