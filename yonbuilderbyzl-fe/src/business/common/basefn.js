/**
 * 带 _ 的函数是viemodel 基本对象
 * 不带的是基本函数
 */
/**
 * 强化检测数据类型  return false  
 * type-> 当没有检测到数据 或检测到数据类型是 undefined null 'undefined' 'null' 时， 返回false
 */
const typeBool = (bool, type) => {
  switch (bool) {
    case undefined:
    case null:
      console.warn('检测到的数据类型是 ' + bool + ',不过我还会反给你->false')
      return type || false
      break;
    case 'undefined':
    case 'null':
      console.warn('检测到的数据类型是字符串 ' + bool + ',不过我还会反给你->false')
      return type || false
    default:
      if (bool === '0' || bool == 'false') {
        console.warn('检测到的数据类型是字符串 ' + bool + ',不过我还会反给你->false')
        return false
      } else {
        return !!bool
      }
  }
}
// 公共函数，设置某个vm 为空
const _setNull = (viewmodel, val) => {
  viewmodel.get(val).setValue(null);
}
const _getValue = (viewmodel, val) => {
  return viewmodel.get(val).getValue()
}
const createNumberList = (num) => {
  return Array.from(Array(num), (v, k) => k)
}
// 生成笛卡尔积数组
const combine = (arr) => {
  var r = [];
  (function f(t, a, n) {
    if (n == 0) return r.push(t);
    for (var i = 0; i < a[n - 1].length; i++) {
      f(t.concat(a[n - 1][i]), a, n - 1);
    }
  })([], arr, arr.length);
  r = r.map(v => {
    let obj = {};
    v.map(val => {
      obj = Object.assign(obj, val);
    })
    return obj
  })
  return r;
}
const indexOf = (arr, val) => {
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] == val) { return i; }
  }
  return -1;
}
const remove = (arr, val) => {
  let index = indexOf(arr, val);
  if (index > -1) { arr.splice(index, 1); }
  return arr
}
module.exports = {
  typeBool,
  _setNull,
  _getValue,
  remove,
  combine, // 笛卡尔积
  createNumberList
}