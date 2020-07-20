export function saveCode (obj, callback) {
  const { barCodeActions } = obj.props;
  const objCode = findCodeObj(obj, obj.state.barCode);
  if(objCode === null) {
    barCodeActions.addBarCode(obj.state.barCode);
  }else{
    barCodeActions.modifyBarCode(objCode);
  }
  callback();
  // dispatch(push('/codeNum'));
}

export function findCodeObj (obj, code) {
  const { barCodes } = obj.props;
  let temItem = null;
  barCodes.get('codes').find((item) => {
    if(item.code === code) {
      temItem = item;
    }
  });
  return temItem;
}

export function goodsNum (obj) {
  const { goodsRefer } = obj.props;
  let num = 0;
  const vals = goodsRefer.getIn(['cartInfo', 'numObj']).values();
  console.log(vals);
  for(const i of vals) {
    num = num + i;
  }
  return num;
}
