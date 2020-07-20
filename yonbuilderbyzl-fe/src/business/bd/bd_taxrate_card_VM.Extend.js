cb.define(['common/common_VM.Extend.js'], function (common) {
    var bd_taxrate_card_VM_Extend = {
        doAction: function (name, viewmodel) {
            if (this[name])
                this[name](viewmodel);
        },
        init: function (viewmodel) {
            viewmodel.on("afterLoadData",function(){
                let mode = viewmodel.getParams().mode;
                if($("#rateUnit").length<=0){
                    //增加税率单位
                    $("#taxrate_card-ntaxRate .ant-row").append("<span id='rateUnit' style='margin-left: 5px;'>%</span>");
                }
                if(mode=='add'){//新增态，不显示审计信息
                    viewmodel.execute('updateViewMeta', { code:'auditInfoCode', visible: false });
                }
            })
            //免税与不征税不能同时勾选“是”
            viewmodel.get("taxFree").on("beforeSelect", function(data) {
                if(data.value=="true"){
                    let noTaxationValue = viewmodel.get("noTaxation").getValue();
                    if(noTaxationValue == "false"){
                        return true;
                    }else{
                        cb.utils.alert('免税与不征税不能同时勾选“是”', 'warning');
                        return false;
                    }
                }else{
                    return true;
                }
              });
              viewmodel.get("noTaxation").on("beforeSelect", function(data) {
                if(data.value=="true"){
                    let taxFreeValue = viewmodel.get("taxFree").getValue();
                    if(taxFreeValue == "false"){
                        return true;
                    }else{
                        cb.utils.alert('免税与不征税不能同时勾选“是”', 'warning');
                        return false;
                    }
                }else{
                    return true;
                }
              });
        }
    }
    try {
        module.exports = bd_taxrate_card_VM_Extend;
    } catch (error) {

    }
    return bd_taxrate_card_VM_Extend;
});
