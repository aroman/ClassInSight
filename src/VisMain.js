import _ from 'lodash'
import * as RC from 'recharts'
import React, { Component } from 'react'
import calculateStatistics from './statistics.js'


class TalkTime extends Component {

  render() {
    const data = [
      {
        name: "Student talk time",
        time: this.props.talkTimes.student.sum,
      },
      {
        name: "Teacher talk time",
        time: this.props.talkTimes.teacher.sum,
      }
    ]
    return (
      <div>
        <div>
          <strong>count (TA): </strong>
          <span>{this.props.talkTimes.teacher.count}</span>
        </div>
        <div>
          <strong>sum (TA): </strong>
          <span>{this.props.talkTimes.teacher.sum} minutes</span>
        </div>
        <div>
          <strong>average (TA): </strong>
          <span>{_.round(this.props.talkTimes.teacher.avg * 60)} seconds</span>
        </div>

        <div>
          <strong>count (student): </strong>
          <span>{this.props.talkTimes.student.count}</span>
        </div>
        <div>
          <strong>sum (student): </strong>
          <span>{this.props.talkTimes.student.sum} minutes</span>
        </div>
        <div style={{marginBottom: 20}}>
          <strong>average (student): </strong>
          <span>{_.round(this.props.talkTimes.student.avg * 60)} seconds</span>
        </div>

        <RC.BarChart unit="seconds" width={600} height={300} data={data}
              margin={{top: 5, right: 30, left: 20, bottom: 5}}>
           <RC.XAxis dataKey="name"/>
           <RC.YAxis label="minutes"/>
           <RC.CartesianGrid strokeDasharray="3 3"/>
           <RC.Tooltip/>
           <RC.Legend />
           <RC.Bar dataKey="time" fill="#8884d8" />
        </RC.BarChart>
      </div>
    )
  }

}

class VisMain extends Component {

  constructor(props) {
    super(props)

    this.state = {
      stats: calculateStatistics(props.rows),
    }
  }

  render() {
    return (
      <div className="VisMain">
        <h3>Total talk time</h3>
        <TalkTime talkTimes={this.state.stats.talkTimes}/>

        <h3>Wait time I</h3>
        <pre>{JSON.stringify(this.state.stats.waitTimeOne, null, 4)}</pre>

        <h3>Cold calls</h3>
        <strong>count: </strong>
        <span>{this.state.stats.coldCallsCount}</span>

        <h3>Hands raised</h3>
        <strong>count: </strong>
        <span>{this.state.stats.handsRaisedCount}</span>

        <h3>Name used</h3>
        <strong>count: </strong>
        <span>{this.state.stats.nameUsedCount}</span>

        <h3>Silences</h3>
        <div>
          <strong>count: </strong>
          <span>{this.state.stats.silenceStats.count}</span>
        </div>
        <div>
          <strong>sum: </strong>
          <span>{this.state.stats.silenceStats.sum} minutes</span>
        </div>
        <div>
          <strong>avg: </strong>
          <span>{this.state.stats.silenceStats.avg} minutes</span>
        </div>
      </div>
    )
  }

}

export default VisMain
