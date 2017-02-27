import Papa from 'papaparse'
import Dropzone from 'react-dropzone'
import React, { Component } from 'react'
import logo from './logo.svg'
import ResetIcon from './ResetIcon.svg'

import VisMain from './VisMain'
import './App.css'

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
