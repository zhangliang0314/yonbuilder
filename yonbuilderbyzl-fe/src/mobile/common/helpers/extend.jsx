export const promiseExecute1 = function (check, eventName) {
  return new Promise((resolve, reject) => {
    var name = check;
    var sliceStart = 1;
    if (typeof check === 'boolean') {
      name = eventName;
      sliceStart = 2;
    }
    if (!name) return;
    var args = Array.prototype.slice.call(arguments, sliceStart);
    if (!args.length) return;
    args.unshift(name);
    var returnData = this.execute1.apply(this, args);
    if (returnData instanceof cb.promise) {
      returnData.then(function () {
        resolve(...arguments)
      }, function () {
        resolve('ABORT_PROCESS')
      });
    } else {
      if (returnData === 'ABORT_PROCESS')
        resolve('ABORT_PROCESS')
      resolve(returnData)
    }
  })
};

export const execute1 = function (name) {
  if (!name) return;
  var events = this._get_data('events')[name];
  if (!events) return true;
  var result = true;
  var args = Array.prototype.slice.call(arguments, 1);
  events.forEach(function (event) {
    if (result === false) return;
    var returnData;
    if (cb.rest.nodeEnv === 'development') {
      returnData = event.callback.apply(event.context || this, args);
    } else {
      try {
        returnData = event.callback.apply(event.context || this, args);
      } catch (e) {
        console.error('execute[' + name + '] exception: ' + e.stack);
      }
    }
    result = returnData instanceof cb.promise ? returnData : (returnData === false ? 'ABORT_PROCESS' : returnData);
  }, this);
  return result;
};

export const warpPromiseExecute = async function (eventName, param) {
  let result
  try {
    result = await this.promiseExecute1(eventName, param)
  } catch (e) {
    console.error('promiseExecute1内部出错：' + e)
  }
  if (result === 'ABORT_PROCESS')
    return false
  return { result }
}
