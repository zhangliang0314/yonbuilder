
cb.define(['common/common_VM.Extend.js'], function (common) {
  var RM_rm_retailvouchadjust_filterVM_extend = {

    doAction: function (name, viewmodel) {
      if (this[name]) {
        this[name](viewmodel);
      }
    },

    init: function (viewmodel) {
      //获取ERP系统来源
      var ERPsysaddress = cb.rest.AppContext.option.ERPsysaddress;

      viewmodel.on('afterInit', function () {
        if (viewmodel.get("iMemberid.name")) {
          viewmodel.get('iMemberid.name').getFromModel().setState('placeholder', '姓名/手机号');
        }
      });

      viewmodel.on('beforeSearch', function (args) {
        args.isExtend = true;
        if (ERPsysaddress == 4) { //渠道云-----4
          args.simpleVOs = [{
            field: 'iDeliveryState',   //交货状态：未交货
            op: 'eq',
            value1: '0'
          }];
          args.simpleVOs.push({
            field: 'iNegative',       //销售的零售单
            op: 'eq',
            value1: 0
          });
          args.simpleVOs.push({
            field: 'iPayState',
            op: 'neq',                //收款状态为非‘待收款’
            value1: 2
          });
          args.simpleVOs.push({
            field: 'bAmountAdjustment',
            op: 'neq',
            value1: 1
          });
          // args.simpleVOs.push({
          //   field: 'retailVouchDetails.fCoQuantity',   //商品行存在已退货数量为0的零售单
          //   op: 'eq',
          //   value1: 0
          // });
        }
        // if(ERPsysaddress == 1){ //U813.0----1
        //     args.simpleVOs = [{
        //       field: 'iDeliveryState',
        //       op: 'neq',
        //       value1: 2
        //     }];
        //     args.simpleVOs.push({
        //       field: 'iNegative',
        //       op: 'eq',
        //       value1: 0
        //     });
        //     args.simpleVOs.push({
        //       field: 'retailVouchDetails.fCoQuantity',
        //       op: 'eq',
        //       value1: 0
        //     });
        //     args.simpleVOs.push({
        //       field: '	bAmountAdjustment',
        //       op: 'neq',
        //       value1: 1
        //     });
        // }

      });

    }

  }
  try {
    module.exports = RM_rm_retailvouchadjust_filterVM_extend;
  } catch (error) {

  }
  return RM_rm_retailvouchadjust_filterVM_extend;
});
