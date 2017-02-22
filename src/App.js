import Papa from 'papaparse'
import Dropzone from 'react-dropzone'
import React, { Component } from 'react'
import logo from './logo.svg'
import ResetIcon from './ResetIcon.svg'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import AppBar from 'material-ui/AppBar'
import FileCloudUpload from 'material-ui/svg-icons/file/cloud-upload'

import { Dashboard } from './Dashboard'
import './App.css'


const muiTheme = getMuiTheme({
  appBar: {
     color: '#093263',
   }
})

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
      <MuiThemeProvider muiTheme={muiTheme}>
        <div className="App">
          <AppBar title="Class InSight"></AppBar>
          {
            this.state.rows.length > 0
            ?
            <Dashboard rows={this.state.rows} fileName={this.state.fileName}/>
            :
            <div className="Main">
              <Dropzone
                onDrop={this.onDrop.bind(this)}
                className='Dropzone' activeClassName="Dropzone-active">
                  <img className="Main-Logo" src={logo} alt="ClassInsight"/>
                  <div className="Main-text">
                    To begin, upload a .csv file by clicking <FileCloudUpload color='#093263' style={{marginBottom:-5}}/> or dragging and dropping a file.
                  </div>
              </Dropzone>

            </div>
            }
        </div>
      </MuiThemeProvider>
    )

  }

}

export default App
