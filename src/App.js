import _ from 'lodash'
import Papa from 'papaparse'
import { getTalkTimes, getWaitTimeOnes } from './parsers.js'
import Dropzone from 'react-dropzone'
import React, { Component } from 'react'
import * as RC from 'recharts'
import logo from './logo.svg'
import ResetIcon from './ResetIcon.svg'
import './App.css'

const sum = arr => arr.reduce((a, sum) => a + sum)
const avg = arr => sum(arr) / arr.length

class TalkTime extends Component {

  render() {
    const teacherTimes = _.filter(this.props.talkTimes, t => t.isTeacher)
    const studentTimes = _.filter(this.props.talkTimes, t => !t.isTeacher)

    const data = [
      {
        name: "Student talk time",
        time: Math.round(sum(_.map(studentTimes, 'duration')) / (60 * 60)),
      },
      {
        name: "Teacher talk time",
        time: Math.round(sum(_.map(teacherTimes, 'duration')) / (60 * 60)),
      }
    ]
    return (
      <RC.BarChart unit="seconds" width={600} height={300} data={data}
            margin={{top: 5, right: 30, left: 20, bottom: 5}}>
         <RC.XAxis dataKey="name"/>
         <RC.YAxis label="minutes"/>
         <RC.CartesianGrid strokeDasharray="3 3"/>
         <RC.Tooltip/>
         <RC.Legend />
         <RC.Bar dataKey="time" fill="#8884d8" />
      </RC.BarChart>
    )
  }

}

class WaitTimeVis extends Component {

  render() {
    return (
      <span>
        <strong>avg: </strong>
        <span>{(avg(this.props.waitTimes) / 1000).toFixed(2)}</span>
        <span> seconds</span>
      </span>
    )
  }

}

class VisMain extends Component {

  constructor(props) {
    super(props)
    this.state = {
      waitTimeOnes: getWaitTimeOnes(props.rows),
      talkTimes: getTalkTimes(props.rows),
    }
  }

  render() {
    console.log(this.state.talkTimes)
    return (
      <div className="VisMain">
        <h3>Total talk time</h3>
        <TalkTime talkTimes={this.state.talkTimes}/>
        <h3>Wait time 1</h3>
        <WaitTimeVis waitTimes={this.state.waitTimeOnes}/>
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
    console.log(this.state)
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo"></img>
        </div>
        {
          this.state.rows.length > 0
          ?
          <div>
            <img className="App-reset" src={ResetIcon} onClick={() => this.setState({rows: []})}/>
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

// const waitTimeOnes = getWaitTimeOnes(rows)
//
// console.log(waitTimeOnes)
// console.log(avg(waitTimeOnes))

export default App;
