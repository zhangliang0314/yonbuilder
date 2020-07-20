cb.define(['common/common_VM.Extend.js'], function (common) {
  var RM_rm_retailvouchlist_filterVM_Extend = {
    doAction: function (name, viewmodel) {
      if (this[name])
        this[name](viewmodel);
    },
    init: function (viewmodel) {
		viewmodel.on('afterInit', function () {
			//viewmodel.set("billnum","rm_retailvouchlist");
      if (viewmodel.get("iMemberid.name")) {
          viewmodel.get('iMemberid.name').getFromModel().setState('placeholder', '姓名/手机号');
        }
			var storeid = cb.rest.AppContext.user.storeId;
			var condition =
			{
				"isExtend": true,
				simpleVOs: []
			};
			condition.simpleVOs.push({
				field: 'receipttype.name',
				op: 'eq',
				value1: '零售单'
			});
			var iBusinesstypename = viewmodel.get('iBusinesstypeid.name');
			if(iBusinesstypename != undefined)
				iBusinesstypename.getFromModel().setFilter(condition);
			var conditionuser =
			{
				"isExtend": true,
				simpleVOs: []
			};
			conditionuser.simpleVOs.push({
				field: 'stores.store',
				op: 'eq',
				value1: storeid
			});
			var iMakerName = viewmodel.get('iMaker.name');
			if(iMakerName != null)
				iMakerName.getFromModel().setFilter(conditionuser);

		});

    }
  }
  try {
    module.exports = RM_rm_retailvouchlist_filterVM_Extend;
  } catch (error) {

  }
  return RM_rm_retailvouchlist_filterVM_Extend;
});
