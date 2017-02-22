import _ from 'lodash'
import * as RC from 'recharts'
import React, { Component } from 'react'
import calculateStatistics from './statistics.js'
import {Card, CardTitle, CardText} from 'material-ui/Card'
import {Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn} from 'material-ui/Table'

class Metric extends Component {
  render() {
    const { title, subtitle } = this.props
    return (
      <Card className="Metric" style={{minWidth:280,minHeight:200}}>
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

class WaitTimeMetric extends Component {

  render() {
    const {title, waitTimes} = this.props

    return (
      <div className="WaitTimeMetric">
        <Metric title={title}>
          <Table selectable={false}>
           <TableHeader displaySelectAll={false} enableSelectAll={false} adjustForCheckbox={false}>
             <TableRow>
               <TableHeaderColumn>Time</TableHeaderColumn>
               <TableHeaderColumn>Time (raw)</TableHeaderColumn>
               <TableHeaderColumn>Duration</TableHeaderColumn>
               <TableHeaderColumn>Type</TableHeaderColumn>
               <TableHeaderColumn>Followed by</TableHeaderColumn>
             </TableRow>
           </TableHeader>
           <TableBody displayRowCheckbox={false}>
             {
               waitTimes.map(waitTime => {
                 return (
                   <TableRow key={waitTime.timestamp.valueOf()}>
                     <TableRowColumn>{waitTime.timestamp.format("M/D/YYYY @ h:mm:ss a")}</TableRowColumn>
                     <TableRowColumn>{waitTime.timestamp.valueOf()}</TableRowColumn>
                     <TableRowColumn>{(waitTime.duration / 1000).toFixed(2)} sec</TableRowColumn>
                     <TableRowColumn>{waitTime.type}</TableRowColumn>
                     <TableRowColumn>{waitTime.followedBy}</TableRowColumn>
                   </TableRow>
                 )
               })
             }

           </TableBody>
         </Table>
        </Metric>
      </div>
    )
  }

}


class Dashboard extends Component {

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
        <WaitTimeMetric title="Wait time 1" waitTimes={this.state.stats.waitTimeOne}/>
        <CountMetric title="Hands raised" count={this.state.stats.handsRaisedCount}/>
        <CountMetric title="Name used" count={this.state.stats.nameUsedCount}/>
        <CountMetric title="Cold calls" count={this.state.stats.coldCallsCount}/>
        <CountMetric title="Unique student talk" count={this.state.stats.uniqueStudentTalkCount}/>
        <CountMetric title="Students present" count={this.state.stats.studentsPresentCount}/>
        {/* <CASMetric title="Silence" stats={this.state.stats.silenceStats}/> */}
        <TalkTime title="Talk time 1" talkTimes={this.state.stats.talkTimes}/>
      </div>
    )
  }

}



class DashboardStatic extends Component {

  render() {

    return (
      <div className="Metrics">
        <div className="TitleMain">{'Friday, March 11 (10:30am—11:20am)'}</div>
        <div className="SubtitleMain">{'Calculus in 3D, Section E'}</div>
        <Metric title="Hand raising" subtitle="When students raised their hands">
          <div>
            <strong>total hand raises: </strong>
            <span>19 times</span>
          </div>
          <div>
            <strong>most raised simultaneously: </strong>
            <span>4 hands</span>
          </div>
          <div>
            <strong>average time in air: </strong>
            <span>9.3 seconds</span>
          </div>
        </Metric>
        <CountMetric title="Name used" subtitle="When you used a student's name" count={"9 times"}/>
        <CountMetric title="Cold calls" subtitle="Calling on students who weren't raising their hands" count={"3 times"}/>
        <CountMetric title="Students present" subtitle="How many students attended this class" count={"14 students"}/>
        <Metric title="Wait time" subtitle="Ideally, you should wait at least 3 seconds after posing a question before moving on">
          <img src="waittime.svg" />
        </Metric>
        <Metric title="Talk time" subtitle="How long you spoke compared to how long your students spoke">
          <img src="talktime.svg"/>
          <div style={{marginTop: 30}}>
            <strong>count (you): </strong>
            <span>145 times</span>
          </div>
          <div>
            <strong>sum (you): </strong>
            <span>38 minutes</span>
          </div>
          <div>
            <strong>average (you): </strong>
            <span>14 seconds</span>
          </div>

          <div style={{marginTop: 10}}>
            <strong>count (students): </strong>
            <span>21 times</span>
          </div>
          <div>
            <strong>sum (students): </strong>
            <span>3 minutes</span>
          </div>
          <div style={{marginBottom: 20}}>
            <strong>average (students): </strong>
            <span>2 seconds</span>
          </div>
        </Metric>
        <Metric title="Silence" subtitle="When neither you or nor students were speaking">
          <div>
            <strong>count: </strong>
            <span>54 instances</span>
          </div>
          <div>
            <strong>average silence: </strong>
            <span>7.3 seconds</span>
          </div>
          <div>
            <strong>total silence: </strong>
            <span>9.8 minutes</span>
          </div>
        </Metric>
        {/* <TalkTime title="Talk time" subtitle="How long you spoke compared to how long your students spoke" talkTimes={{
        student: {count: 21, sum: 3.03, avg: .03,},
        teacher: {count: 179, sum: 38.87, avg: 0.23,},
        }}/> */}

      </div>
    )
  }

}

export { Dashboard, DashboardStatic }
