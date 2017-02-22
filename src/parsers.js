import _ from 'lodash'
import moment from 'moment'

const EventTypes = {
  STUDENT_PRESENT: 'Students present',
  TEACHER_TALK_START: 'teacher begin talking',
  TEACHER_TALK_END: 'teacher end talking',
  STUDENT_TALK_START: 'student begin talking',
  STUDENT_TALK_END: 'student end talking',
  QUESTION: 'Question asked',
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
  let getTalkTimes = []

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
    getTalkTimes.push({
      isTeacher,
      duration: moment(endEvent.dateTime).diff(moment(startEvent.dateTime)),
    })

    // console.log(`${row._id}–${endEvent._id}`)
  })

  return getTalkTimes
}

export { getTalkTimes, getWaitTimeOnes };
