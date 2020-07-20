cb.define(['RM/retailBilling/Common.js'], function (common) {
  var RM_rm_retailvouchglist_VM_Extend = {

    doAction: function (name, viewmodel) {
      if (this[name]) {
        this[name](viewmodel);
      }
    },
    init: function (viewmodel) {
      viewmodel.addProperty('code', new cb.models.SimpleModel());
      var gridModel=viewmodel.getGridModel();
      gridModel.setPageSize(-1);
      gridModel.setState('showAggregates', false);
      gridModel.setReadOnly(false);
      var storeid = cb.rest.AppContext.user.storeId;
			var storeInfo = cb.rest.AppContext.user.userStores.filter(function(item){
				return item.store === storeid
      })
      var iCustomerid="";
      var iMemberid="";
      var iBusinesstypeid="";
      var iOwesState="";
			if(storeInfo.length>0&& storeInfo[0].storeType==3){
        gridModel.setColumnState('iCustomerid_name', 'visible', false);
			}else{
				gridModel.setColumnState('iCustomerid_name', 'visible', true);
      }

      gridModel.on('rowColChange', function (args){
        var colKey = args.value.columnKey;
        var currentRow = gridModel.getRow(args.value.rowIndex);

        if ((colKey == 'fMoneyPaySum')
        && (currentRow.iPresellState == '1' ||currentRow.iPresellState == '2' ||currentRow.iOwesState=='1')) {
          return true;
        }

        return false;
    });
    gridModel.on('beforeCellValueChange', function (data) {
        var curRowIndex = data.rowIndex;
        var currentRow = gridModel.getRow(curRowIndex);
        if(data.cellName=="fMoneyPaySum"){
          var value = data.value;
          var oldvalue=currentRow.fMoneySum-currentRow.fPresellPayMoney;
          oldvalue=parseFloat(oldvalue.toFixed(2));
          if(Math.abs(oldvalue)<Math.abs(value)){
            cb.utils.alert("未收款金额只能改小不能改大！", "warning");
            return false;
          }

          //如果是预定单 并且是严格控制输入金额必须大于预定比列
          if(currentRow.iPresellState==1){
             //是否严格控制
             var premoney= currentRow.fMoneySum*currentRow.iBusinesstypeid_MinPercentGiveMoneyPre/100;
             premoney= parseFloat(parseFloat(premoney).toFixed(2))
             if((value+currentRow.fPresellPayMoney)<premoney){

                if(typeof(currentRow.iBusinesstypeid_controlType) !="undefined" && currentRow.iBusinesstypeid_controlType==1){
                  cb.utils.alert("订金比例控制不能低于"+premoney, "warning");
                  return false;
                }else{
                  cb.utils.alert("订金低于预定比例金额"+premoney, "warning");
                }

              }

          }
        }
        return true ;
     });

      gridModel.on("beforeSelect",function(rowIndexes) {
        if((iCustomerid=="" && iMemberid==""&& iBusinesstypeid=="") || rowIndexes.length==1){
          iCustomerid= gridModel.getCellValue(rowIndexes[0],"iCustomerid");
          if(typeof(iCustomerid) =="undefined"){
            iCustomerid="";
          }
          iMemberid=gridModel.getCellValue(rowIndexes[0],"iMemberid");
          if(typeof(iMemberid) =="undefined"){
            iMemberid="";
          }
          iBusinesstypeid=gridModel.getCellValue(rowIndexes[0],"iPresellState");
          if(typeof(iBusinesstypeid) =="undefined"){
            iBusinesstypeid="";
          }
          iOwesState=gridModel.getCellValue(rowIndexes[0],"iOwesState");
          if(typeof(iOwesState) =="undefined"){
            iOwesState="";
          }
        }
        var tempiCustomerid="";
        var tempiMemberid="";
        var tempiBusinesstypeid="";
        var tempiOwesState="";
        if(( iCustomerid==""|| iCustomerid=="0" )&& (iMemberid=="" || iMemberid=="0")){
            if( rowIndexes.length>1){
              if(rowIndexes[0]!=rowIndexes[1]){
                cb.utils.alert('非会员和客户的单据只能选择一张单据进行结算','warning');
                return false;
              }
            }
        }
        for(var i=0;i<rowIndexes.length;i++){
          tempiCustomerid=gridModel.getCellValue(rowIndexes[i],"iCustomerid");
          if(typeof(tempiCustomerid) =="undefined"){
            tempiCustomerid="";
          }
          tempiMemberid=gridModel.getCellValue(rowIndexes[i],"iMemberid");
          if(typeof(tempiMemberid) =="undefined"){
            tempiMemberid="";
          }
          tempiBusinesstypeid=gridModel.getCellValue(rowIndexes[i],"iPresellState");
          if(typeof(tempiBusinesstypeid) =="undefined"){
            tempiBusinesstypeid="";
          }
          tempiOwesState=gridModel.getCellValue(rowIndexes[i],"iOwesState");
          if(typeof(tempiOwesState) =="undefined"){
            tempiOwesState="";
          }
          if(iCustomerid!="" || tempiCustomerid!=""){
              //比较客户是否相同
            if(tempiCustomerid!=iCustomerid)
            {
              cb.utils.alert('请选择相同的客户进行结算','warning');
              return false;
            }
        }
        else if(tempiMemberid!=iMemberid){
            //比较会员是否相同
            cb.utils.alert('请选择相同的会员进行结算','warning');
            return false;
        }

        //   if((tempiOwesState!=iOwesState) || (iOwesState!="1" && tempiBusinesstypeid!=tempiBusinesstypeid)){
        //     //比较业务类型是否相同
        //     cb.utils.alert('请选择相同的业务类型进行结算','warning');
        //     return false;
        // }
        }
      });
      gridModel.on("beforeSelectAll",function(rowIndexes) {

        iCustomerid= gridModel.getCellValue(0,"iCustomerid");
        if(typeof(iCustomerid) =="undefined"){
          iCustomerid="";
        }
        iMemberid=gridModel.getCellValue(0,"iMemberid");
        if(typeof(iMemberid) =="undefined"){
          iMemberid="";
        }
        iBusinesstypeid=gridModel.getCellValue(0,"iPresellState");
        if(typeof(iBusinesstypeid) =="undefined"){
          iBusinesstypeid="";
        }
        iOwesState=gridModel.getCellValue(0,"iOwesState");
        if(typeof(iOwesState) =="undefined"){
          iOwesState="";
        }
        var tempiCustomerid="";
        var tempiMemberid="";
        var tempiBusinesstypeid="";
        var tempiOwesState="";
        if(( iCustomerid==""|| iCustomerid=="0" )&& (iMemberid=="" || iMemberid=="0")){
          if( rowIndexes.length>1){
            if(rowIndexes[0]!=rowIndexes[1]){
              cb.utils.alert('非会员和客户的单据只能选择一张单据进行结算','warning');
              return false;
            }
          }
        }
        for(var i=0;i<gridModel.getRows().length;i++){
          tempiCustomerid=gridModel.getCellValue(i,"iCustomerid")
          if(typeof(tempiCustomerid) =="undefined"){
            tempiCustomerid="";
          }
          tempiBusinesstypeid=gridModel.getCellValue(i,"iPresellState");
          if(typeof(tempiBusinesstypeid) =="undefined"){
            tempiBusinesstypeid="";
          }
          tempiOwesState=gridModel.getCellValue(i,"iOwesState");
          if(typeof(tempiOwesState) =="undefined"){
            tempiOwesState="";
          }

            if(iCustomerid!="" ||tempiCustomerid!=""  ){
              //比较客户是否相同
              if(tempiCustomerid!=iCustomerid) {
                cb.utils.alert('请选择相同的客户进行结算','warning');
                return false;
              }
            }else{
                  tempiMemberid=gridModel.getCellValue(i,"iMemberid");
                  if(typeof(tempiMemberid) =="undefined"){
                    tempiMemberid="";
                  }
                  //比较会员是否相同
                  if(tempiMemberid!=iMemberid)  {
                    cb.utils.alert('请选择相同的会员进行结算','warning');
                    return false;
                  }
            }

          // if((tempiOwesState!=iOwesState) || (iOwesState!="1" && tempiBusinesstypeid!=tempiBusinesstypeid)){
          //   //比较业务类型是否相同
          //   cb.utils.alert('请选择相同的业务类型进行结算','warning');
          //   return false;
          // }
        }
      });

      /* 新增结算方式 */
      gridModel.on('AfterAllPaymentTypeInStorage', common.AfterAllPaymentTypeInStorage)

      /* 拓展 新的pos结算方式所需参数 */
      gridModel.on('afterOrganizePosParams', common.afterOrganizePosParams)

      /* 拓展pos支付失败时候的撤销操作 */
      gridModel.on('afterSaveAndHandleError', common.afterSaveAndHandleError)

      /* 扩展pos当天退货走撤销 */
      gridModel.on('extendPseuDoBack', common.extendPseuDoBack)
      gridModel.on("beforeSendSave", function(args){
          for(var i=0;i<args.pays.length;i++){
            if(args.pays[i].paymentType ==5) {
              cb.utils.alert('不能使用会员钱包结算','warning');
              return false;
            }
            if(args.pays[i].paymentType ==18) {
              cb.utils.alert('不能储值卡结算','warning');
              return false;
            }
          }
      })

      gridModel.on('afterPayTabsClick', function (args) {
      })
	}
  }
  try {
    module.exports = RM_rm_retailvouchglist_VM_Extend;
  } catch (error) {

  }
  return RM_rm_retailvouchglist_VM_Extend;
});

// WEBPACK FOOTER //
// ./src/client/business/RM/RM_rm_retailvouchglist_VM.Extend.js
