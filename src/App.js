import _ from 'lodash'
import Papa from 'papaparse'
import calculateStatistics from './statistics.js'
import Dropzone from 'react-dropzone'
import React, { Component } from 'react'
import * as RC from 'recharts'
import logo from './logo.svg'
import ResetIcon from './ResetIcon.svg'
import './App.css'

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

class WaitTimeVis extends Component {

  render() {
    return (
      <span>
        <strong>avg: </strong>
        <span>{ _.mean(this.props.waitTimes) / 1000 }</span>
        <span> seconds</span>
      </span>
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
        <h3>Wait time 1</h3>
        <WaitTimeVis waitTimes={this.state.stats.waitTimeOnes}/>

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

class App extends Component {

  constructor(props) {
    super(props)
    this.state = {
      fileName: null,
      rows: [],
    }
  }

  onDrop(files) {
    if (files.length > 1) {
      alert('only one CSV at a time!')
      return
    }
    if (files.length === 0) {
      alert('you didn\'t upload anything?')
      return
    }
    this.setState({
      fileName: files[0].name,
    })
    Papa.parse(files[0], {
      header: true,
      dynamicTyping: true,
      complete: results => {
        this.setState({rows: results.data})
      }
    })
  }

  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} alt="ClassInsight" className="App-logo"></img>
        </div>
        {
          this.state.rows.length > 0
          ?
          <div>
            <img className="App-reset" alt="reset" src={ResetIcon} onClick={() => this.setState({rows: []})}/>
            <div className="App-title">{this.state.fileName}</div>
            <VisMain rows={this.state.rows}/>
          </div>
            :
            <div className="Drop-center">
              <Dropzone onDrop={this.onDrop.bind(this)} className='Dropzone' activeClassName="Dropzone-active">
              </Dropzone>
            </div>
          }

      </div>
    );

  }

}

export default App;
