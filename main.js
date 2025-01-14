require('v8-compile-cache');
const { app, BrowserWindow, Menu, ipcMain, Tray } = require('electron')
const path = require('path')
var fs = require('fs')
// var client = require('node-rest-client-promise').Client();


var Model = require('./model').Model;
var Profile = require('./model').Profile;

let windowReady = false;

function l(a) {
	console.log('\n')
	console.log(a)
	function sendLog() {
		// mainWindow.webContents.send('log-add' , {msg:a})
		windowReady == false ? {} : mainWindow.webContents.send('log-add', { msg: a })
	}
	sendLog()

}
l('main run')



let mainWindow

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
	app.quit()
} else {
	app.on('second-instance', (event, commandLine, workingDirectory) => {
		// Someone tried to run a second instance, we should focus our window.
		if (windowReady) {
			if (mainWindow.isMinimized()) mainWindow.restore()
			mainWindow.focus()
		} else {
			createWindow();
		}
	})
}

function createWindow() {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		width: 900,
		height: 600,
		webPreferences: {
			//   preload: path.join(__dirname, 'preload.js'),
			nodeIntegration: true
		},
		icon: path.join(__dirname, 'logo.png')
	})

	mainWindow.loadFile('index.html')

	// Open the DevTools.
	//   mainWindow.webContents.openDevTools()

	mainWindow.setMenu(null);

	mainWindow.on('closed', function () {
		// app.quit()
		mainWindow = null;
		windowReady = false;
	})

	console.log('window run');
}
let tray = null



app.on('ready', () => {
	createWindow()
	tray = new Tray(path.join(__dirname, 'logo.png'))
	const contextMenu = Menu.buildFromTemplate([
		{
			label: 'Показать окно', click() {
				windowReady == true ? {} : createWindow();
				windowReady = true;
			}
		},
		{
			label: 'Запустить', click() {
				if (controller.data.started == true) {
					l('started')
					return
				}
				l('Interval add')
				controller.loopStart(3)
				setTimeout(() => {
					controller.processAll()
				}, 500);
			}
		},
		{
			label: 'Остановить', click() {
				l('Interval cleared')
				controller.loopStop();
			}
		},
		{
			label: 'Выход', click() {
				app.quit()
			}
		}
	])
	tray.setToolTip('Field fuck Mod')
	tray.setContextMenu(contextMenu)
	tray.on("double-click", () => {
		l('clicked')
		windowReady == true ? {} : createWindow();
		windowReady = true;
	})
})

app.on('window-all-closed', function () {
	//   if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
	if (mainWindow === null) createWindow()
})




class Controller {
	constructor(data) {
		this.data = { started: false, date:null };
	}
	checkUser(login) {
		return model.getitem(login)
	}
	findUser(data) {
		model.checkAuthData(data.login, data.password)
			.then(a => {
				// send data
				l(a)
			}).catch(a => {
				// send retry or check  correct
				l(a)
				fs.appendFile('error.json', '\n' + (new Date()).toLocaleTimeString() + ' ' + ' ' + a, function (err) {
					if (err) throw err;
					console.log('Saved!');
				});
			})
	}
	addUser(data) {
		model.additem(data);
		l(`User ${data.login} addded to the system`)
	}
	deleteUser(key) {
		model.removeitem(key)
		l(`User ${dta.login} deleted from the system`)
	}
	updateUser(key, index) {
		windowReady == false ? {} : mainWindow.webContents.send('status', { msg: 'обновление данных', status: true })
		let profile = model.getitem(key);
		return new Promise(function (resolve, reject) {
			index == undefined ? index = 1 : {};
			profile.status = 'Авторизация';
			this.viewUpdateUsersData();
			model.login(key)
				.then((a) => {
					l(a)
					profile.status = 'Загрузка активностей';
					this.viewUpdateUsersData();
					return model.loadActivityData(key)
				})
				.then(a => {
					l(a)
					profile.status = 'Обновлено:  ' + (new Date().toTimeString()).substring(0, 5);
					this.viewUpdateUsersData();
					resolve('Update done for: ' + key)
				})
				.catch(a => {
					l("error " + a);
					fs.appendFile('error.json', '\n' + (new Date()).toLocaleTimeString() + ' ' + key + ' ' + a, function (err) {
						if (err) throw err;
						console.log('Saved!');
					});
					profile.status = 'Ошибка:  ' + (new Date().toTimeString()).substring(0, 5);
					this.viewUpdateUsersData();
					if (index >= 3) {
						reject(a)
					} else {
						resolve(this.processUser(key, ++index))
					}
				});
		}.bind(this))
	}
	processUser(key, index) {
		windowReady == false ? {} : mainWindow.webContents.send('status', { msg: 'обработка', status: true })
		let data = {};
		let profile = model.getitem(key);

		let isActivityChanged = false;
		let isTsiVisitAdded = false;
		let isConnectionTypeAdded = false;
		let isLocationAdded = false;

		return new Promise(function (resolve, reject) {
			index == undefined ? index = 1 : {};
			profile.status = 'Авторизация';
			this.viewUpdateUsersData();
			model.login(key)
				.then((a) => {
					l(a)
					profile.status = 'Загрузка активностей';
					this.viewUpdateUsersData();
					return model.loadActivityData(key)
				})
				
				.then(a => {
					l(a)
					profile.status = 'Обработка данных';
					this.viewUpdateUsersData();
					return model.processActivityData(key)
				})
				.then(a => {
					data = a;
					l(data)
					if (a == "Nothnt") {
						resolve('Nothn\'t to process');
						profile.status = 'Обновлено:  ' + (new Date().toTimeString()).substring(0, 5);
						this.viewUpdateUsersData();
						throw "olgud"
					} else if (a == 'w8') {
						resolve('Wait fo next step');
						profile.status = 'Обновлено:  ' + (new Date().toTimeString()).substring(0, 5);
						this.viewUpdateUsersData();
						throw "olgud"
					} else {
						l(isActivityChanged)
						profile.status = 'Изменение активности';
						this.viewUpdateUsersData();
						if (isActivityChanged) {
							return 'fastforward'
						} else {
							return model.changeActivityState(data)
						}
					}
				})
				.then(a => {
					isActivityChanged = true;
					l(isTsiVisitAdded)
					l(a);
					profile.status = 'Добавление визита';
					this.viewUpdateUsersData();
					if (isTsiVisitAdded) {
						return 'fast forward'
					} else {
						return model.sendTsiVisit(data)
					}
				})
				.then(a => {
					isTsiVisitAdded = true;
					l(isConnectionTypeAdded)
					l(a);
					profile.status = 'Добавление типа соединения';
					this.viewUpdateUsersData();
					if (isConnectionTypeAdded) {
						return 'fast forward'
					} else {
						return model.sendConnectionType(data)
					}
				})
				.then(a => {
					isConnectionTypeAdded = true;
					l(isLocationAdded)
					l(a)
					profile.status = 'Обновление местоположения';
					this.viewUpdateUsersData();
					if (isLocationAdded) {
						return 'fast forward'
					} else {
						return model.updateLocation(key)
					}
				})
				.then((a) => {
					isLocationAdded = true;
					l(a)
					profile.status = 'Загрузка данных';
					this.viewUpdateUsersData();
					return model.loadActivityData(key)
				})
				.then(a => {
					l(a)
					resolve('All done for: ' + key)
					profile.status = 'Обновлено:  ' + (new Date().toTimeString()).substring(0, 5);
					this.viewUpdateActivityes();
				})
				.catch(a => {
					if (a == 'olgud') {
						l('accepted olgud')
						return
					}
					l("error " + a);
					fs.appendFile('error.json', '\n' + (new Date()).toLocaleTimeString() + ' ' + key + ' ' + a, function (err) {
						if (err) throw err;
						console.log('Saved!');
					});
					profile.status = 'Ошибка:  ' + (new Date().toTimeString()).substring(0, 5);
					this.viewUpdateUsersData();
					if (index >= 3) {
						reject(a)
					} else {
						resolve(this.processUser(key, ++index))
					}
				});
		}.bind(this))
	}
	updateAll() {
		let arr = model.getarr();
		arr.reduce((p, c) =>
			p.then(d => new Promise(resolve =>

				// setTimeout(function () {
				// 	console.log(c.login);
				// 	resolve();
				// }, 1000)
				this.updateUser(c.login)
					.then(a => {
						resolve()
						l('tru loopped: ' + c.login)
						this.viewUpdateActivityes();
						windowReady == false ? {} : mainWindow.webContents.send('status', { msg: 'обновлено: ' + (new Date().toTimeString()).substring(0, 5), status: false })
					})
					.catch(a => {
						resolve()
						l('no tru loopped: ' + c.login)
						windowReady == false ? {} : mainWindow.webContents.send('status', { msg: 'обновлено c ошибками : ' + (new Date().toTimeString()).substring(0, 5), status: false })
					})


			)), Promise.resolve());
	}
	processAll() {
		let arr = model.getarr();
		arr.reduce((p, c) =>
			p.then(d => new Promise(resolve =>

				// setTimeout(function () {
				// 	console.log(c.login);
				// 	resolve();
				// }, 1000)
				this.processUser(c.login)
					.then(a => {
						resolve()
						l('tru loopped fo: ' + c.login)
						this.viewUpdateActivityes();
						if (this.data.started == true) {
							windowReady == false ? {} : mainWindow.webContents.send('status', { msg: 'Запущен', status: false })
						} else {
							windowReady == false ? {} : mainWindow.webContents.send('status', { msg: 'Остановлен', status: false })
						}
					})
					.catch(a => {
						resolve()
						l('no tru loopped: ' + c.login)
						if (this.data.started == true) {
							windowReady == false ? {} : mainWindow.webContents.send('status', { msg: 'Запущен', status: false })
						} else {
							windowReady == false ? {} : mainWindow.webContents.send('status', { msg: 'Остановлен', status: false })
						}
					})


			)), Promise.resolve());
	}
	viewUpdateUsers() {
		windowReady == false ? {} : mainWindow.webContents.send('updateUsers', { msg: 'hello from main process' })
	}
	viewUpdateUsersData() {
		windowReady == false ? {} : mainWindow.webContents.send('updateUsersData', { msg: 'hello from main process' })
	}
	viewUpdateActivityes() {
		windowReady == false ? {} : mainWindow.webContents.send('updateActivityes', { msg: 'hello from main process' })
	}
	loopStart(minutes) {
		if (this.data.started == true) {
			l('already')
			return
		}
		this.data.started = true;
		this.data.date = new Date().toTimeString().substr(0,8);
		this.data.timer = setInterval(() => { controller.processAll() }, minutes * 60 * 1000)
		windowReady == false ? {} : mainWindow.webContents.send('status', { msg: 'Запущен' })
	}
	loopStop() {
		this.data.started = false;
		clearInterval(this.data.timer)
		windowReady == false ? {} : mainWindow.webContents.send('status', { msg: 'Остановлен' })
	}
	getLoopStatus() {
		return this.data;
	}
	saveUsers() {
		let arr = model.getarr();
		let newArr = []
		arr.forEach(element => {
			newArr.push(element)
		});
		console.log(newArr)
		fs.writeFile('savedUsers.json', JSON.stringify(newArr), function (err) {
			if (err) throw err;
			console.log('Saved!');
		});
	}
	readUsers() {
		let arr = JSON.parse(fs.readFileSync('savedUsers.json'));
		arr.forEach(el => {
			if (controller.checkUser(el.login)) {
				l(`User ${el.login} already loaded`)
			} else {
				l(`User ${el.login} loaded from file`)
				controller.addUser(el)
			}
		})
	}
}



const model = new Model();
const controller = new Controller();


// controller.addUser({
// 	login:'vkomelkov',
// 	password:"Qwer4444",
// 	intervals:{
// 		aTob:5,
// 		bToc:10,
// 		cTod:60
// 	},
// 	gpsPattern:[
// 		{lat:48.4646372,long:37.0812746}
// 	],
//     gpsSettings:{
//         randomSorting:true,
//         randomizePosition:true,
//         currentPosition:0
//     }
// })

// controller.addUser({
// 	login:'vvitriv',
// 	password:"Qwer3333",
// 	intervals:{
// 		aTob:5,
// 		bToc:10,
// 		cTod:60
// 	},
// 	gpsPattern:[
// 		{lat:48.4646372,long:37.0812746}
// 	],
//     gpsSettings:{
//         randomSorting:true,
//         randomizePosition:true,
//         currentPosition:0
//     }
// })
// controller.addUser({
// 	login:'smyhydiuk',
// 	password:"Qwer3333",
// 	intervals:{
// 		aTob:5,
// 		bToc:10,
// 		cTod:60
// 	},
// 	gpsPattern:[
// 		{lat:48.4646372,long:37.0812746}
// 	],
//     gpsSettings:{
//         randomSorting:true,
//         randomizePosition:true,
//         currentPosition:0
//     }
// })
// controller.addUser({
// 	login:'AVSemenyuk',
// 	password:"Qwer4949",
// 	intervals:{
// 		aTob:5,
// 		bToc:10,
// 		cTod:60
// 	},
// 	gpsPattern:[
// 		{lat:48.4646372,long:37.0812746}
// 	],
//     gpsSettings:{
//         randomSorting:true,
//         randomizePosition:true,
//         currentPosition:0
//     }
// })

// controller.processUser('vnikolin').then(a=>{l(a)}).catch(a => {l('error ' + a)})
// controller.updateAll()
// controller.loopStart(2)
// setTimeout(() => {
// 	controller.viewUpdateUsers();
// 	controller.updateAll()
// }, 4000);

// controller.findUser({login:'vkomelkov',password:'Qwer2222'})

global.sharedObject = {
	modelArray: model.getarr(),
	checkUser: controller.checkUser,
	modelFinder: model.checkAuthData,
	addUser: controller.addUser,
	removeUser: controller.deleteUser,
	getLoopStatus: controller.getLoopStatus()
}


ipcMain.on('started', (event, arg) => {
	console.log('received started')
	setTimeout(() => {
		// controller.loopStart(2)
		controller.viewUpdateUsers();
		controller.viewUpdateUsersData();
		controller.viewUpdateActivityes();
		// controller.updateAll()
	}, 100);
	windowReady = true;
})

ipcMain.on('loop-start', (event, arg) => {
	l('Interval add')
	controller.loopStart(3)
	setTimeout(() => {
		controller.processAll()
	}, 500);
})
ipcMain.on('loop-stop', (event, arg) => {
	l('Interval cleared')
	controller.loopStop();
})
ipcMain.on('processNow', (event, arg) => {
	controller.processAll()
})
ipcMain.on('updateNow', (event, arg) => {
	controller.updateAll();
})

ipcMain.on('leave-window', () => {
	l('haha')
	mainWindow.close()

})
ipcMain.on('loadUsers', () => {
	l('Read from local file')
	controller.readUsers()
})
ipcMain.on('saveUsers', () => {
	l('Saved to local file')
	controller.saveUsers()
})
ipcMain.on('devTools', () => {
	l('Hi there dev')
	mainWindow.webContents.openDevTools()
})
