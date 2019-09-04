const {app, BrowserWindow} = require('electron')
const path = require('path')
var fs = require('fs')
// var client = require('node-rest-client-promise').Client();

var Model = require('./model').Model;
var Profile = require('./model').Profile;

function l(a){
    console.log(a)
}
l('main run')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 200,
    height: 100,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
  console.log('window run');
  // setTimeout(dothat,5000);
  // setInterval(dothat,30000);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow()
})




class Controller{
	constructor (data) {
		
	}
	findUser(data){
		model.checkAuthData(data.login,data.password)
		.then(a => {
			// send data
		}).catch(a => {
			// send retry or check  correct
		})
	}
	addUser(data){
		model.additem(data);
	}
	deleteUser(key){
		model.removeitem(key)
	}
	processUser(key,index){
		let data = {};
		return new Promise(function(resolve,reject){
		  index == undefined ? index = 1 : {};
		  model.login(key)
		  .then((a) => {
				l(a)
				return model.loadActivityData(key)
		  })
		  .then(a => {
				l(a)
				return model.processActivityData(key)
		  })
		  .then(a => {
			  data = a;
				l(data)
				if(a == "Nothnt"){
				  resolve('Nothn\'t to process');
				  throw "olgud"	
				} else if (a == 'w8'){
				  resolve('Wait fo next step');
				  throw "olgud"	
				} else {
				  return model.changeActivityState(data)
				}
		  })
		  .then(a => {
			  l(a);
			  return model.sendTsiVisit(data)
		  })
		  .then(a => {
			  l(a)
			  return model.updateLocation(key)
		  })
		  .then(a => {
				l(a)
				resolve('All done for: ' + key)
		  })
		  .catch(a => {
			  if(a == 'olgud'){
				  l('accepted olgud')
				  return
			  }
				l("error " + a);
				fs.writeFile('error.json', a , function (err) {
					  if (err) throw err;
					  console.log('Saved!');
				});
				if(index >= 3){
					  reject(a)
				} else {
					  resolve(this.processUser(key,++index))
				}
		  });
		}.bind(this))
	}
	loop(){
		let arr = [one,two,three];

	}
}

[2,4,5,3,24,2].reduce( (p, c) => 
	p.then(d => new Promise(resolve =>
		
        setTimeout(function () {
			console.log(c);
            resolve();
		}, 1000)
		
    ))
, Promise.resolve() );


const model = new Model();
const controller = new Controller();


controller.addUser({
	login:'vkomelkov',
	password:"Qwer1111",
	intervals:{
		aTob:30,
		bToc:30,
		cTod:30
	},
	gpsPattern:[
		{lat:50.7505280,long:26.0437980},
		{lat:59.1861080,long:39.3101440},
		{lat:-1.6027450,long:12.3030920},
		{lat:56.7562580,long:60.4282630}
	]}
)



controller.processUser('vkomelkov').then(a=>{l(a)}).catch(a => {l('error ' + a)})