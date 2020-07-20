cb.define(['common/common_VM.Extend.js'], function (common) {
  var RM_rm_retailvouchglist_filterVM_Extend = {
    doAction: function (name, viewmodel) {
      if (this[name])
        this[name](viewmodel);
    },
    init: function (viewmodel) {
		viewmodel.on('afterInit', function () {
      //viewmodel.set("billnum","rm_retailvouchlist");
      var storeid = cb.rest.AppContext.user.storeId;
      var orgid =  cb.rest.AppContext.user.orgId;
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

        var conditionuoperator =
        {
          "isExtend": true,
          simpleVOs: []
        };
        conditionuoperator.simpleVOs.push({
          field: 'operatorStore.iStoreId',
          op: 'eq',
          value1: storeid
        });
        var ioperatorName = viewmodel.get('retailVouchDetails.iEmployeeid');
        if(ioperatorName != null)
        ioperatorName.getFromModel().setFilter(conditionuoperator);

        var conditioniCustomerid =
        {
          "isExtend": true,
          simpleVOs: []
        };
        conditioniCustomerid.simpleVOs.push({
          field: 'iDeleted',
          op: 'eq',
          value1: 0
        });
        conditioniCustomerid.simpleVOs.push({
          field: 'bValid',
          op: 'eq',
          value1: 1
        });
        conditioniCustomerid.simpleVOs.push({
          field: 'agent.bURetailFinal',
          op: 'eq',
          value1: 1
        });
        // conditioniCustomerid.simpleVOs.push({
        //   field: 'iYxyOrgId',
        //   op: 'eq',
        //   value1:orgid
        // });
        var iCustomeridName = viewmodel.get('iCustomerid');
        if(iCustomeridName != null){
          iCustomeridName.getFromModel().setFilter(conditioniCustomerid);
        }

      if (viewmodel.get("iMemberid.name")) {
          viewmodel.get('iMemberid.name').getFromModel().setState('placeholder', '姓名/手机号');
        }
     if (!viewmodel.get('iCustomerid')) return;

      var storeInfo = cb.rest.AppContext.user.userStores.find(function (item) {
        return item.store === storeid
      })
      if (storeInfo && storeInfo.storeType == 3)
        viewmodel.get('iCustomerid').setVisible(false);
		});

    }
  }
  try {
    module.exports = RM_rm_retailvouchglist_filterVM_Extend;
  } catch (error) {

  }
  return RM_rm_retailvouchglist_filterVM_Extend;
});
