cb.define([], function () {
  var RM_rm_dayEndReceiptlist_VM_Extend = {
    doAction: function (name, viewmodel) {
      if (this[name])
        this[name](viewmodel);
    },

    init: function (viewmodel) {
		viewmodel.getGridModel().setShowCheckbox(false);//设置复选框不显示
    let gridModel = viewmodel.getGridModel();
	gridModel.setState('showAggregates', false);
    if (cb.rest.interMode === 'touch') {
      gridModel.on('afterMount', function () {
      gridModel.setColumnState('saleReportShow', 'visible', false);
      gridModel.setColumnState('stockReportShow', 'visible', false);
    });
    }
	  gridModel.on('afterSetDataSource', function(data){
    if (cb.rest.interMode === 'touch') return;
		data.forEach(function(row, index) {
			if(typeof(row.saleReportName) != "undefined"){
				gridModel.setCellValue(index, 'saleReportShow', "点击查询销售静态报表");
			}
			if(typeof(row.stockReportName) != "undefined"){
				gridModel.setCellValue(index, 'stockReportShow', "点击查询库存静态报表");
			}
		}, this);

	});

      viewmodel.getGridModel().on('jointQuery', function (args) {
      	var cellName = args.cellName;
        var rowData = args.rowData;
        if (cellName === 'saleReportShow') {
        viewmodel.communication({
          type: 'menu',
          payload: {
            menuCode: 'SJ0106',
            carryData: {
              query: {
                key: 'reportId',
                value: rowData.saleReportId
              },
              title: rowData.saleReportName
            }
          }
        });
        } else if (cellName==='stockReportShow'){
        	viewmodel.communication({
          type: 'menu',
          payload: {
            menuCode: 'SJ0201',
            carryData: {
              query: {
                key: 'reportId',
                value: rowData.stockReportId
              },
              title: rowData.stockReportName
            }
          }
        });
        }
      });
    }
  }
  try {
    module.exports = RM_rm_dayEndReceiptlist_VM_Extend;
  } catch (error) {

  }
  return RM_rm_dayEndReceiptlist_VM_Extend;
});

//////////////////
// WEBPACK FOOTER
// ./src/client/business/RM/RM_rm_dayEndReceiptlist_VM.Extend.js
// module id = 578
// module chunks = 0
