import _ from 'lodash'
import * as RC from 'recharts'
import React, { Component } from 'react'
import calculateStatistics from './statistics.js'
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card'
import Paper from 'material-ui/Paper';

class Metric extends Component {
  render() {
    const { title, subtitle } = this.props
    return (
      <Card className="Metric">
        <CardTitle title={title} subtitle={subtitle} />
        <CardText>
          {this.props.children}
        </CardText>
      </Card>
    )
  }
}

class TalkTime extends Component {

  render() {
    const {title, subtitle, talkTimes} = this.props
    const data = [
      {
        name: "Student talk time",
        time: talkTimes.student.sum,
      },
      {
        name: "Teacher talk time",
        time: talkTimes.teacher.sum,
      }
    ]
    return (
      <Metric title={title} subtitle={subtitle} className="TalkTimeMetric">
        <div>
          <strong>count (TA): </strong>
          <span>{talkTimes.teacher.count}</span>
        </div>
        <div>
          <strong>sum (TA): </strong>
          <span>{talkTimes.teacher.sum} minutes</span>
        </div>
        <div>
          <strong>average (TA): </strong>
          <span>{_.round(talkTimes.teacher.avg * 60)} seconds</span>
        </div>

        <div>
          <strong>count (student): </strong>
          <span>{talkTimes.student.count}</span>
        </div>
        <div>
          <strong>sum (student): </strong>
          <span>{talkTimes.student.sum} minutes</span>
        </div>
        <div style={{marginBottom: 20}}>
          <strong>average (student): </strong>
          <span>{_.round(talkTimes.student.avg * 60)} seconds</span>
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
      </Metric>
    )
  }

}


class CountMetric extends Component {

  render() {
    const { title, subtitle, count } = this.props
    return (
      <div className="CountMetric">
        <Metric title={title} subtitle={subtitle} >
          <strong>count: </strong>
          <span>{count}</span>
        </Metric>
      </div>
    )
  }

}


// Count, average, sum
class CASMetric extends Component {

  render() {
    const { title, subtitle, stats } = this.props
    return (
      <div className="CASMetric">
        <Metric title={title} subtitle={subtitle} className="CASMetric">
          <div>
            <strong>count: </strong>
            <span>{stats.count}</span>
          </div>
          <div>
            <strong>sum: </strong>
            <span>{stats.sum} minutes</span>
          </div>
          <div>
            <strong>avg: </strong>
            <span>{stats.avg} minutes</span>
          </div>
        </Metric>
      </div>
    )
  }

}


class JSONMetric extends Component {

  render() {
    const {title, data} = this.props

    return (
      <div className="JSONMetric">
        <Metric title={title}>
          <pre>{JSON.stringify(data, null, 4)}</pre>
        </Metric>
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
      <div className="Metrics">
        <div className="FileName">{this.props.fileName}</div>
        <CountMetric title="Hands raised" count={this.state.stats.handsRaisedCount}/>
        <CountMetric title="Name used" count={this.state.stats.nameUsedCount}/>
        <CountMetric title="Cold calls" count={this.state.stats.coldCallsCount}/>
        <CountMetric title="Unique student talk" count={this.state.stats.uniqueStudentTalkCount}/>
        <CountMetric title="Students present" count={this.state.stats.studentsPresentCount}/>
        <CASMetric title="Silence" stats={this.state.stats.silenceStats}/>
        <JSONMetric title="Wait time 1" data={this.state.stats.waitTimeOne}/>
        <TalkTime title="Talk time 1" talkTimes={this.state.stats.talkTimes}/>
      </div>
    )
  }

}

export default VisMain
