// var dbName = 'off-lineDB',     // 数据库名
// daVer = 1              // 数据库版本号
var db = ''; // 用于数据库对象
var dbData = []; // 用于临时存放数据的数组

// 连接数据库
export function openDB (dbName, daVer, tables) {
  var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
  if(!indexedDB) {
    console.log('你的浏览器不支持IndexedDB');
  }
  var request = indexedDB.open(dbName, daVer);
  request.onsuccess = function (e) {
    db = e.target.result;
    window.__db = db
    console.log('连接数据库成功');
    // 数据库连接成功后渲染表格
    // vm.getData();
  }
  request.onerror = function () {
    console.log('连接数据库失败');
  }
  request.onupgradeneeded = function (e) {
    db = e.target.result;
    tables.forEach(name => {
      if(!db.objectStoreNames.contains(name)) {
        // var store = db.createObjectStore(name,{keyPath: 'indexedDB_id', autoIncrement: true});
        // var idx = store.createIndex('index','username',{unique: false}) 暂不建索引
      }
    })
  }
}

/**
 * 保存数据
 * @param {Object} data 要保存到数据库的数据对象
 */
export function IDB_saveData (data, dbTableName) {
  return new Promise((resolve, reject) => {
    const name = dbTableName || 'save_data';
    var tx = db.transaction(name, 'readwrite');
    var store = tx.objectStore(name);
    var req = store.put(data);
    req.onsuccess = function () {
      console.log('成功保存id为' + this.result + '的数据');
      resolve(true)
    }
    req.onerror = function (e) {
      console.log('保存失败')
      console.log(e.target.result.error)
      cb.utils.alert('缓存数据失败！', 'error')
      reject(e.target.result)
    }
  })
}

/**
 * 删除单条数据
 * @param {int} id 要删除的数据主键
 */
export function IDB_deleteOneData (id) {
  return new Promise(resolve => {
    var tx = db.transaction('save_data', 'readwrite');
    var store = tx.objectStore('save_data');
    var req = store.delete(id);
    req.onsuccess = function () {
      // 删除数据成功之后重新渲染表格
      // vm.getData();
      resolve('删除成功')
    }
    req.onerror = function () {
      resolve('删除失败')
    }
  })
}

/**
 * 检索全部数据
 * @param {boolean} onlyCheck 只判断数据库里是否有数据
 */
export function IDB_searchData (onlyCheck) {
  return new Promise((resolve, reject) => {
    var tx = db.transaction('save_data', 'readonly');
    var store = tx.objectStore('save_data');
    var range = IDBKeyRange.lowerBound(1);
    var req = store.openCursor(range, 'next');
    // 每次检索重新清空存放数据数组
    dbData = [];
    req.onsuccess = function () {
      var cursor = this.result;
      if(cursor) {
        if(onlyCheck) {
          dbData.push(cursor.value);
          resolve(dbData);
          return
        }
        // 把检索到的值push到数组中
        dbData.push(cursor.value);
        cursor.continue();
      }else{
        // 数据检索完成后执行回调函数
        // callback && callback();
        resolve(dbData)
      }
    }
    req.onerror = function (e) {
      reject(e.target.result)
    }
  })
}
