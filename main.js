const { dialog } = require('electron')
const electron = require('electron');
const path = require('path');
const url = require('url');
const db = require('./database')

// SET ENV
process.env.NODE_ENV = 'development';

const {app, BrowserWindow, Menu, ipcMain} = electron;

let mainWindow;
let addWindow;
const options = {
  type: 'info',
  buttons: [],
  defaultId: 2,
  title: 'Details',
  message: 'To Get products: File->Get Item \nTo Add products: File-> Add Item \nTo Delete product: Double click the product \nTo clear the list window: File->Clear Item'
};

// Listen for app to be ready
app.on('ready', function(){
  // Create new window
  mainWindow = new BrowserWindow({});
  // Load html in window
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'mainWindow.html'),
    protocol: 'file:',
    slashes:true
  }));
  dialog.showMessageBox(null, options, (response, checkboxChecked) => {
    console.log(response);
    console.log(checkboxChecked);
  });
  
  // Quit app when closed
  mainWindow.on('closed', function(){
    app.quit();
  });
  // Build menu from template
  const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
  // Insert menu
  Menu.setApplicationMenu(mainMenu);
});


// Handle add item window
function createAddWindow(){
  addWindow = new BrowserWindow({
    width: 400,
    height:400,
    title:'Add Shopping List Item'
  });
  addWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'addWindow.html'),
    protocol: 'file:',
    slashes:true
  }));

  // Handle garbage collection
  addWindow.on('close', function(){
    addWindow = null;
  });
}

// Catch product:add
ipcMain.on('product:add', function(e, product){   
  
  var sql = `INSERT INTO product (item,price) VALUES (\'${product.name}\',\'${product.price}\')`;    
  db.query(sql,function(err,result){
    if(err) throw err;
    console.log(result.affectedRows);      
  });
  mainWindow.webContents.send('product:add', product);
  addWindow.close(); 
});

// Get products:get
function getData(){
  var sql = `SELECT * FROM product`;    
  db.query(sql,function(err,result){
    if(err) throw err;
    mainWindow.webContents.send('product:get', result);  
  });
  
}

//Delete product:delete
ipcMain.on('product:delete',function(e,product){
  var sql = `DELETE FROM product WHERE item = \'${product}\'`;    
  db.query(sql,function(err,result){
    if(err) throw err;
    console.log(result.affectedRows);
});
})



// Create menu template
const mainMenuTemplate =  [
  // Each object is a dropdown
  {
    label: 'File',
    submenu:[
      {
        label:'Add Item',
        click(){
          createAddWindow();
        }
      },
      {
        label:'Get Item',
        click(){
          getData();
        }
      },
      {
        label:'Clear Items',
        click(){
          mainWindow.webContents.send('item:clear');
        }
      },
      {
        label: 'Quit',
        accelerator:process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
        click(){
          app.quit();
        }
      }
    ]
  }
];

// If OSX, add empty object to menu
if(process.platform == 'darwin'){
  mainMenuTemplate.unshift({});
}

// Add developer tools option if in dev
if(process.env.NODE_ENV !== 'production'){
  mainMenuTemplate.push({
    label: 'Developer Tools',
    submenu:[
      {
        role: 'reload'
      },
      {
        label: 'Toggle DevTools',
        accelerator:process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
        click(item, focusedWindow){
          focusedWindow.toggleDevTools();
        }
      }
    ]
  });
}