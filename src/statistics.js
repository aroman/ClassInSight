import _ from 'lodash'
import moment from 'moment'
import ET from './EventTypes.js'
import F from 'lodash/fp'

const millisToRoundedMinutes = num => _.round(num / (60 * 1000), 2)

const rowTypeIs = eventType => F.compose(F.isEqual(eventType), F.get('type'))

const doesEventTypeBreakSilence = type => _.includes([
  ET.TEACHER_TALK_START,
  ET.STUDENT_TALK_START,
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
function waitTimeOne(rows) {

  let waitTimes = []

  rows.forEach((row, i) => {

    // Check #1: Make sure teacher started talking
    const teacherStartTalking = (row.type === ET.TEACHER_TALK_START)
    const indexOfTeacherStopTalking = _.findIndex(rows, rowTypeIs(ET.TEACHER_TALK_END), i)
    if (!teacherStartTalking) { return }

    // Check #2: Make sure teacher or student eventually starts talking again between
    // the end of
    const indexOfNextTalkStart = _.findIndex(rows, r => (r.type === ET.TEACHER_TALK_START) || (r.type === ET.STUDENT_TALK_START), indexOfTeacherStopTalking)
    if (indexOfNextTalkStart === -1) return

    const rowsBetweenTeacherStopAndNextTalkStart = _.slice(rows, indexOfTeacherStopTalking, indexOfNextTalkStart)

    // Check #3: Make sure there's silence between when teacher stops
    // talking and when the next event occurs
    if (! isSilentBetween(rowsBetweenTeacherStopAndNextTalkStart)) { return }


    // Find the question event between the start of the teacher
    // talking and when they start talking again (if one exists).
    const rowsWhereQuestionMustOccur = _.slice(rows, i, indexOfNextTalkStart)
    const contentQuestion = _.find(rowsWhereQuestionMustOccur, rowTypeIs(ET.CONTENT_QUESTION))
    const nonContentQuestion = _.find(rowsWhereQuestionMustOccur, rowTypeIs(ET.NON_CONTENT_QUESTION))
      // let contentQuestion = true
    // Check #4: Make sure a question was actually asked!
    if (!contentQuestion && !nonContentQuestion ) { return }

    waitTimes.push({
      followedBy: (rows[indexOfNextTalkStart].type === ET.TEACHER_TALK_START) ? 'TA' : 'Student',
      type: contentQuestion ? 'content' : 'non-content',
      duration: rows[indexOfNextTalkStart].moment.diff(rows[indexOfTeacherStopTalking].moment),
      timestamp: rows[indexOfTeacherStopTalking].moment,
    })
  })

  return waitTimes
}

function getTalkTimes(rows) {
  let allTalkTimes = []

  rows.forEach((row, i) => {
    if (!_.includes([ET.TEACHER_TALK_START, ET.STUDENT_TALK_START], row.type)) {
      return
    }

    const isTeacher = (row.type === ET.TEACHER_TALK_START)
    const endEventType = (
      isTeacher ? ET.TEACHER_TALK_END : ET.STUDENT_TALK_END
    )
    const startEvent = row
    const endEvent = _.find(rows, rowTypeIs(endEventType), i)
    allTalkTimes.push({
      isTeacher,
      duration: endEvent.moment.diff(startEvent.moment),
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

function markSilence(rows) {
  let isTeacherTalking = false
  let isStudentTalking = false
  return _.map(rows, (row, i) => {
    if (row.type === ET.TEACHER_TALK_START)
      isTeacherTalking = true
    else if (row.type === ET.TEACHER_TALK_END)
      isTeacherTalking = false
    else if (row.type === ET.STUDENT_TALK_START)
      isStudentTalking = true
    else if (row.type === ET.STUDENT_TALK_END)
      isStudentTalking = false
    row.isDuringSilence = !isTeacherTalking && !isStudentTalking
    return row
  })
}

// XXX: This doesn't work properly -- it over-counts silence.
// It's probably worth re-writing this from scratch.
function getSilenceStats(rows) {
  let silentSegments = []
  let indexSilenceStarted = 0
  let isTeacherTalking = false
  let isStudentTalking = false

  rows.forEach((row, i) => {
    const noOneWasTalking = !isTeacherTalking && !isStudentTalking
    const peopleWereTalking = isTeacherTalking || isStudentTalking
    if (row.type === ET.TEACHER_TALK_START)
      isTeacherTalking = true
    else if (row.type === ET.TEACHER_TALK_END)
      isTeacherTalking = false
    else if (row.type === ET.STUDENT_TALK_START)
      isStudentTalking = true
    else if (row.type === ET.STUDENT_TALK_END)
      isStudentTalking = false

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
    rows: _.flatten(silentSegments),
    count: silentSegments.length,
    sum: millisToRoundedMinutes(_.sum(silentSegments.map(silenceDuration))),
    avg: millisToRoundedMinutes(_.mean(silentSegments.map(silenceDuration))),
  }
}

const removePauses = rows => F.compose(F.get('list'), F.reduce((acc, row) => {
  acc.inPause = (row.type === ET.PAUSE_BEGIN)
  if (!acc.inPause && row.type !== ET.PAUSE_END) acc.list.push(row)
  return acc
}, {list: [], inPause: false}))(rows)

const addMoments = F.map(row => _.assign(row, {moment: moment(row.dateTime)}))

const countRowsOfType = type => F.compose(F.size, F.filter(rowTypeIs(type)))

const calculateStatistics = rows => {
  if (_.last(rows)._id !== "") {
    console.error("bad format")
    return
  }

  // pre-process rows
  rows = F.compose(
    markSilence,
    addMoments,
    removePauses,
    F.dropLast(1)
  )(rows)

  return {
    nameUsedCount: countRowsOfType(ET.NAME_USED)(rows),
    uniqueStudentTalkCount: countRowsOfType(ET.UNIQUE_STUDENT_TALK)(rows),
    handsRaisedCount: countRowsOfType(ET.HAND_RAISED)(rows),
    coldCallsCount: countRowsOfType(ET.COLD_CALL)(rows),
    studentsPresentCount: countRowsOfType(ET.STUDENT_PRESENT)(rows),
    silenceStats: getSilenceStats(rows),
    talkTimes: getTalkTimes(rows),
    waitTimeOne: waitTimeOne(rows),
  }
}

export default calculateStatistics
