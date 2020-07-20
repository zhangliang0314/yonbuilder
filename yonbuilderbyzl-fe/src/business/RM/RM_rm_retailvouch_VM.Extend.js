cb.define(['common/common_VM.Extend.js'], function (common) {
  var RM_rm_retailvouch_VM_Extend = {

    doAction: function (name, viewmodel) {
      if (this[name]) {
        this[name](viewmodel);
      }
    },
    formatter: function(eInvoicesGridModel, viewModel) {
      //设置发票地址超链接样式
			eInvoicesGridModel.setColumnState('cEInvoiceURL', 'formatter', function(rowInfo, rowData) {
        var EInvoiceURL = rowData.cEInvoiceURL;
        if (EInvoiceURL!=undefined){
            return {
              override: true,
              className:'URL',
              html: '<a href="'+EInvoiceURL+'">'+EInvoiceURL+'</a>'
          }
				}
			});
			eInvoicesGridModel.setColumnState('cEInvoiceCode', 'formatter', function(rowInfo, rowData) {
        var EInvoiceURL = rowData.cEInvoiceURL;
        var EInvoiceCode = rowData.cEInvoiceCode;
        if (EInvoiceURL!=undefined){
            return {
              override: true,
              className:'URL',
              html: '<a href="'+EInvoiceURL+'">'+EInvoiceCode+'</a>'
          }
        }
			});
		},
    init: function (viewmodel) {
      viewmodel.on('processstatus', function(args){
				var code =  viewmodel.get('code').getValue();
				var params = {
						code: code
					};
					var data = {
						billtype: 'voucher',
						billno: 'rm_processingstatus',
						params: params
					};
					cb.loader.runCommandLine('bill', data, viewmodel);
			});

      var self = this;

      //卡券号相关
      var bShowCouponSn = false;

      //序列号相关
      var bShowSn = false;
			var detailsModel = viewmodel.get('retailVouchDetails');
			common.snformatter(detailsModel, viewmodel);
			detailsModel.on('afterSetColumns', function () {
				common.snformatter(detailsModel, viewmodel);
			});
        //家具行业才显示
        if (cb.rest.AppContext.tenant.industry!=19 || cb.rest.AppContext.tenant.industry!='19'){
          detailsModel.setColumnState("optionalvalue","visible",false);
          detailsModel.setColumnState("bomAttrValue_attrValueName","visible",false);
        }

      if (cb.rest.interMode === 'touch' && viewmodel.getParams().mode !== 'browse') {
        common.touchFormatter(detailsModel, viewmodel, "quantity");
        detailsModel.on('afterSetColumns', function () {
            common.touchFormatter(detailsModel, viewmodel, "quantity");
        });
    }

      common.initSnCheckbox(viewmodel);
      common.initCouponSnCheckbox(viewmodel);

      var eInvoicesGridModel = viewmodel.get('retailVouchEInvoices');
      if (eInvoicesGridModel != null){
        this.formatter(eInvoicesGridModel, viewmodel);
      }
      //if (viewmodel.get('cEInvoiceURL'))
      //  viewmodel.get('cEInvoiceURL').setValue(cb.rest.AppContext.serviceUrl + '/uniform');
      common.initRegionAndPosition(viewmodel);
      var detailModel = viewmodel.getGridModel("retailVouchDetails");
      var jewelleryIndustry = true; //是否珠宝行业
      // common.initRegionAndPosition(viewmodel);
      var btnCheckModel = viewmodel.get('btnCheck');
      if (btnCheckModel != null) {
        btnCheckModel.setState('valueField', 'iGatheringid');
        btnCheckModel.setState('textField', 'gatheringName');
      }
      viewmodel.addProperty('fNoGatheringMoney', new cb.models.SimpleModel({cShowCaption:'未收款金额'}));
      var self = this;
      viewmodel.on('beforeMovenext', function (data) {
        data.data['listBillNum'] = "rm_retailvouchlist";
      });
      viewmodel.on('beforeMoveprev', function (data) {
        data.data['listBillNum'] = "rm_retailvouchlist";
      });

      viewmodel.on('afterLoadData', function (data) {

        if (viewmodel.get('btnProcessStatus')) {
          if (cb.rest.AppContext.option.ERPsysaddress == 4 && data.iTakeway == 2 && data.fbitReport == 1) {
            viewmodel.get('btnProcessStatus').setVisible(true);
          }else{
            viewmodel.get('btnProcessStatus').setVisible(false);
          }
        }

        //未启用货位管理参数时所有单据隐藏货位字段
				common.goodsPositionVisible(viewmodel,detailsModel);
        common.showSnVisible(viewmodel, detailsModel);
        common.showCouponSnVisible(viewmodel, detailsModel);
				var snRow = common.findSnRowIndex(detailsModel);
				if (snRow != -1) { detailsModel.select(snRow); }

        if(viewmodel.get('btnMakeElectronicTicket')){ //隐藏开电票按钮
          viewmodel.get('btnMakeElectronicTicket').setVisible(false);
        }
        if (!data) return;

        //控制货位仓可编辑货位参照
        var detailsRows = detailsModel.getRows();
        for (let i = 0; i < detailsRows.length; i++) {
            let row = detailsRows[i];
            if (row["warehouse_isGoodsPosition"]) {
              detailsModel.setCellState(i, 'goodsposition_cName', 'disabled', false);
            }else{
              detailsModel.setCellState(i, 'goodsposition_cName', 'disabled', true);
            }
        }

        // ====== 2018-08-14 Added by ZhaoZhe ======
        if (cb.rest.terminalType === 3) {

          var proxy = cb.rest.DynamicProxy.create({
            get: {
              url: "/bill/list?terminalType=1",
              method: "POST"
            }
          });

          let commonVO = {
            itemName: 'iRetailid',
            value1: viewmodel.get('id').getValue()
          };

          let condition = {
            commonVOs: [commonVO]
          };

          let params = {
            billnum: 'rm_paymentwritedetaillist',
            condition: condition
          };

          proxy.get(params, (err, result) => {
            if (err) {
              return;
            }

            if (result === undefined) {
              return;
            }

            let newDataSource = [];
            let resultRecords = result.recordList;

            if (null != resultRecords && resultRecords !== undefined && resultRecords.length > 0) {
              resultRecords.forEach(row => {
                let newRow = {
                  iPaymentid_name: row.iPaymentid_name,
                  fMoney: row.fAmount
                };

                newDataSource.push(newRow);
              });

              viewmodel.get('retailVouchGatherings').setDataSource(newDataSource);
            }
          });
        }

        var mode = viewmodel.getParams().mode;

        if (mode == 'browse') {

          if (btnCheckModel != null) {
            btnCheckModel.setState('dataSourceMode', 'remote');
            btnCheckModel.setDataSource({
              url: 'bill/queryGatherVouch',
              method: 'GET'
            }, {
              id: viewmodel.get('id').getValue(),
              billnum: 'rm_retailvouch'
            });
          }
        }

        var fPresellPayMoney = viewmodel.get('fPresellPayMoney').getValue();
        var fMoneySum = viewmodel.get('fMoneySum').getValue();

        // fbitSettle ==> fbitReport "日结状态"改成根据“日报状态”来判断
        var fbitReport = viewmodel.get('fbitReport').getValue();
        if (fbitReport) {
          viewmodel.get('btnEdit').setVisible(false);
        }

        var price = 0;
        var amountofdecimal = cb.rest.AppContext.option.amountofdecimal;
        price = parseFloat(parseFloat(fMoneySum) - parseFloat(fPresellPayMoney)).toFixed(2);
        if (parseFloat(amountofdecimal).toString() != "NaN") {
          price = parseFloat(parseFloat(fMoneySum) - parseFloat(fPresellPayMoney)).toFixed(amountofdecimal);
        }

        var money = viewmodel.get('fNoGatheringMoney');
        money.setValue(price);
        money.setReadOnly(true);
        var PresellState = viewmodel.get('iPresellState').getValue();
        var DeliveryState = viewmodel.get('iDeliveryState').getValue();
        if (PresellState === 1 && DeliveryState === 0) {} else {
          viewmodel.get('cDeliveradd').setDisabled(true);
          viewmodel.get('cCusperson').setDisabled(true);
          viewmodel.get('cMobileNo').setDisabled(true);
          // viewmodel.get('region').setDisabled(true);
        }

        //预订单状态// 1预订状态（预定）// 4原预定单已退订（预定（退订）由原来1变为4）// 5原预定单已交货（预定（交货）由原来1变为5）
        if (PresellState == 1 || PresellState == 2 || PresellState == 3 || PresellState == 4 || PresellState == 5) {
          viewmodel.get("iBusinesstypeid_name").setDisabled(true);
        }

        //查询是否为珠宝行业，如果是珠宝行业，那么不显示重量
        var isJewelleryIndustry = cb.rest.DynamicProxy.create({
          settle: {
            url: '/billingretail/isJewelleryIndustry',
            method: 'POST'
          }
        });
        isJewelleryIndustry.settle((err, result) => {
          if (err) {
            return;
          }

          if (result === undefined) {
            return;
          }

          jewelleryIndustry = result;

        });

        //获取主键，门店id
        let alldatats = viewmodel.getAllData();
        var url = '/yxyStoreEletroinvoic/findInvOrVis';
        var params33 = {
          storeId: alldatats.store
          //iEInvoiceState: alldatats.iEInvoiceState
        }
        var proxy1 = cb.rest.DynamicProxy.create({
          ensure: {
            url: url,
            method: "POST"
          }
        });
        proxy1.ensure(params33, function (err, result) {
          if (err) {
            cb.utils.alert(err.message, 'error');
            return;
          }
          if(viewmodel.get('btnMakeElectronicTicket')){
            if(result != null && JSON.stringify(result)!='{}' && (alldatats.iEInvoiceState == 1 || alldatats.iEInvoiceState == 4 || alldatats.iEInvoiceState == 0)){
              if(result.electroinvoicebizofstore == 1){
                viewmodel.get('btnMakeElectronicTicket').setVisible(true);
              }
            }
          }
        });

      });

      detailModel.on('beforeBrowse', function (data) {
        switch (data.cellName) {
          case "cBatchno":
            {
              if (this.getRowsByIndexes(data.rowIndex)[0].fQuantity > 0) {
                data.context.setState("checkValid", true);
              } else {
                data.context.setState("checkValid", false);
              }
              break;
            }
          case "cSerialNo":
            {
              if (this.getRowsByIndexes(data.rowIndex)[0].fQuantity > 0) {
                data.context.setState("checkValid", true);
              } else {
                data.context.setState("checkValid", false);
              }
              break;
            }
        }
      });

      viewmodel.on('afterEdit', function (data) {

        common.showSnVisible(viewmodel, detailsModel);
        common.showCouponSnVisible(viewmodel, detailsModel);

      });

      viewmodel.on('fillsn', function (args) {
        var detailsModel = viewmodel.get("retailVouchDetails");
        var snModel = viewmodel.get("retailVouchDetailSN");
        var qtyfildname = "quantity";
        common.autofillsn(args, viewmodel, detailsModel, snModel, qtyfildname);
    });
    viewmodel.on('beforeAddRow', function (data) {
      if (data.params.cItemName == 'btnAddRowSN') { //序列号新增
          var detailsModel = viewmodel.get("retailVouchDetails");
          return common.checkBeforeAddSn(detailsModel);
      }
  });

      // //选择批次带出有存量货位
      // viewmodel.get('retailVouchDetails').on('afterCellValueChange', function (data) {
      //   let selectedRow = detailsModel.getSelectedRows()[0];
      //   if(selectedRow['warehouse_isGoodsPosition']){
      //   if(data.cellName === 'batchno'){
      //     let row = detailsModel.getRows()[data.rowIndex];
      //     let proxy = cb.rest.DynamicProxy.create({
      //     detail: {
      //       url: '/goodsposition/getGoodsPositionByBatchNo',
      //       method: 'POST'
      //     }
      //     });
      //     let parms = {
      //     productId: row['product'],
      //     quantity: row['quantity'],
      //     batchno: row['batchno']
      //     };
      //     proxy.detail(parms, (err, result) => {
      //     if(err) {
      //       cb.utils.alert(err.message, 'error');
      //       return;
      //     }
      //     if(result){
      //       detailsModel.setCellValue(data.rowIndex, 'goodsposition',  result.goodsposition);
      //       detailsModel.setCellValue(data.rowIndex, 'goodsposition_cName',  result.goodspositionName);
      //     }else{
      //       detailsModel.setCellValue(data.rowIndex, 'goodsposition',  null);
      //       detailsModel.setCellValue(data.rowIndex, 'goodsposition_cName',  null);
      //     }
      //     });
      //   }
      //   }
      // });

      viewmodel.on('beforeSave', function (args) {
        // var detailsModel = viewmodel.get("othInRecords");
        var detailsModelName = "retailVouchDetails";
        var snModelName = 'retailVouchDetailSN';
        var qtyfildname = 'fQuantity';
        // var billDto = JSON.parse(args.data.data);
        //var busi = viewmodel.get('bustype_name').getValue();
        //var stockStart = viewmodel.get('stockStart').getValue();
        // var detailsModel = viewmodel.get("details");
        //let iSerialManage = viewmodel.get('warehouse_iSerialManage').getValue();
        // console.log(iSerialManage);

        //货位仓校验货位必输
        let detailsModels = viewmodel.get(detailsModelName);
        let detailsRows = detailsModels.getRows();
        for (let i = 0; i < detailsRows.length; i++) {
            let row = detailsRows[i];
            if(row["warehouse_isGoodsPosition"]){
              if (!row["goodsposition_cName"]) {
                cb.utils.alert('启用货位管理的仓库行的货位不能为空,请检查!', 'error');
                return false;
              }
            }
        }

        if (cb.rest.AppContext.option.serialManage ) {
            //if (busi == '期初入库' && (stockStart == false || stockStart == 'false')) return;

            let detailsModel = viewmodel.get(detailsModelName);
            let rows = detailsModel.getRows();
            for (let i = 0; i < rows.length; i++) {
                let row = rows[i];
                if (!row.isSerialNoManage || row._status == 'Delete'  || row.isSerialNoManage == "0") continue;
                if (!row[snModelName]) {
                    cb.utils.alert('存在未录入序列号的序列号商品行,请检查!', 'error');
                    return false;
                }
                if (row[snModelName].sn == '') {
                    cb.utils.alert('序列号商品行的序列号不能为空,请检查!', 'error');
                    return false;
                }
            }
            let bflg = common.checkSnBeforeSave(args, detailsModelName, snModelName, qtyfildname,viewmodel);
            if (bflg == 1) {
                return false; //序列号重复
            }

            if (bflg == 2) {
               /* let returnPromise = new cb.promise();
                //cb.utils.confirm('商品行数量与序列号不一致，是否修改单据商品数量！', function () {  //王总建议提示语修改成下面提示语
                  cb.utils.confirm('序列号数量和商品数量不符！', function () {
                    common.updateRowQtyBySnNum(args, detailsModelName, snModelName, qtyfildname);
                    return returnPromise.resolve();
                });
                return returnPromise;*/

                cb.utils.alert('序列号数量和商品数量不符！', 'error');
                return false;
            }

            return true;
        }

        var detail = viewmodel.getGridModel("retailVouchDetails");
        var rows = detail.getRows();

        var productIsEmpty = false;
        var employeeIsEmpty = false;
        let backIdIsEmpty = false;
        let wareIsEmpty = false;
        let batchIsEmpty = false;
        let invaliddateIsEmpty = false;
        rows.forEach(function (item, index) {
          if (item.product == undefined || cb.utils.isEmpty(item.product)) productIsEmpty = true; //"商品行不能为空！";
          if (item.iEmployeeid == undefined || cb.utils.isEmpty(item.iEmployeeid)) employeeIsEmpty = true; //;
          if (item.iWarehouseid == undefined || cb.utils.isEmpty(item.iWarehouseid)) wareIsEmpty = true; //;
          if (item.product_productOfflineRetail_isBatchManage == true && (item.iBathid == undefined || cb.utils.isEmpty(item.iBathid))) {
            batchIsEmpty = true;

            if (item.product_productOfflineRetail_isExpiryDateManage == true) {
              if (item.invaliddate == undefined || cb.utils.isEmpty(item.invaliddate)) invaliddateIsEmpty = true;
              if (!item.producedate && item.invaliddate) detailModel.setCellValue(index, 'invaliddate', item.invaliddate, true);
            }
          }

          if ((item.iBackid == undefined || cb.utils.isEmpty(item.iBackid)) && item.fQuantity < 0) backIdIsEmpty = true;
        })

        if (productIsEmpty) {
          cb.utils.alert('商品行不能为空！', 'error');
          return false;
        }

        if (employeeIsEmpty) {
          cb.utils.alert('表体行营业员不能为空!', 'error');
          return false;
        }

        if (backIdIsEmpty && cb.rest.AppContext.option.returnseasonentry) {
          cb.utils.alert('退货行退货原因不能为空!', 'error');
          return false;
        }

        if (wareIsEmpty) {
          cb.utils.alert('表体行仓库不能为空！', 'error');
          return false;
        }

        if (batchIsEmpty) {
          cb.utils.alert('启用批次管理的表体行批号不能为空！', 'error');
          return false;
        }

        if (invaliddateIsEmpty) {
          cb.utils.alert('启用效期管理的表体行,有效期至不能为空!', 'error');
          return false;
        }

        return true;

      });

      viewmodel.get("vouchdate").on("afterValueChange", function (data) {
        viewmodel.get("dDate").setValue(viewmodel.get("vouchdate").getValue());
      });

      detailModel.on('afterCellValueChange', function (data) {
        switch (data.cellName) {
          case "product_cName":
          case "product_cCode":
          case "productsku_cCode":
          case "productsku_cName":
            {
              if (detailModel.getCellValue(data.rowIndex, 'product_productOfflineRetail_isBatchManage') == false) { //非批次管理的清空批次字段
                detailModel.setCellValue(data.rowIndex, 'cBatchno', null);
                detailModel.setCellValue(data.rowIndex, 'producedate', null);
                detailModel.setCellValue(data.rowIndex, 'invaliddate', null);
                for (let i = 0; i < 30; i++) {
                  detailModel.setCellValue(data.rowIndex, 'retailVouchDetailBatch!define' + i, null);
                }
              }

              break;
            }
            // case "cBatchno":
            //   {
            //   }
          case 'retailVouchDetailCustom!define1':
            if (jewelleryIndustry) {
              let val = detailModel.getCellValue(data.rowIndex, 'retailVouchDetailCustom!define1');
              detailModel.setCellValue(data.rowIndex, 'retailVouchDetailBatch!define1', val);
            }
          case 'cSerialNo':
            detailModel.setCellValue(data.rowIndex, 'retailVouchDetailSN!sn', detailModel.getCellValue(data.rowIndex, 'cSerialNo'));
        }

        //更换仓库清空货位 控制货位是否可编辑
        if(data.cellName === 'iWarehouseid_name'){
          detailsModel.setCellValue(data.rowIndex, 'goodsposition',  null);
          detailsModel.setCellValue(data.rowIndex, 'goodsposition_cName',  null);
          let selectedRow = detailsModel.getSelectedRows()[0];
          if(selectedRow['warehouse_isGoodsPosition']){
            detailsModel.setCellState(data.rowIndex, 'goodsposition_cName', 'disabled', false);
          }else{
            detailsModel.setCellState(data.rowIndex, 'goodsposition_cName', 'disabled', true);
          }
        }
      });

      detailModel.on('rowColChange', function (args) {
        var currentRow = detailModel.getRow(args.value.rowIndex);

        if (args.value.columnKey == 'invaliddate' || args.value.columnKey == 'producedate') { // 有效期至 生产日期
          // 有效期至（启用效期管理的商品，退货行可修改，销售行只读）
          if (currentRow.product_productOfflineRetail_isExpiryDateManage == true) {
            if (currentRow.fQuantity >= 0) { //销售行
              return false;
            } else { //退货行
              return true;
            }
          } else { //未启用批次管理
            return false;
          }

        } else if (args.value.columnKey == 'cBatchno') {
          // 销售行只能参照，退货行可参照可手工录入
          // return true;
          return currentRow.product_productOfflineRetail_isBatchManage;
        } else if (args.value.columnKey == 'cSerialNo') {
          return true;
        } else if (args.value.columnKey == 'retailVouchDetailSN!sn') { //冗余字段 暂时不能编辑
          return false;
        } else if (args.value.columnKey.indexOf('retailVouchDetailBatch!define') >= 0) {
          //批次属性（启用批次管理的商品，退货行可修改，销售行只读
          if (currentRow.product_productOfflineRetail_isBatchManage == true) {
            if (currentRow.fQuantity >= 0) { //销售行
              return false;
            } else { //退货行
              return true;
            }
          } else { //未启用批次管理
            return false;
          }
        } else if (args.value.columnKey == 'iBackid_reason') {
          if (currentRow.fQuantity >= 0) { //销售行
            return false;
          } else { //退货行
            return true;
          }
        } else if (args.value.columnKey.indexOf('retailVouchDetailCustom!define') >= 0) {

          if (jewelleryIndustry) {
            if (args.value.columnKey == 'retailVouchDetailCustom!define1') { //重量
              if (currentRow["product_productProps!define2"] == '是') { //珠宝行业  回收品
                return true;
              } else {
                return false;
              }
            } else if (args.value.columnKey == 'retailVouchDetailCustom!define2' || args.value.columnKey == 'retailVouchDetailCustom!define3' ||
              args.value.columnKey == 'retailVouchDetailCustom!define4' || args.value.columnKey == 'retailVouchDetailCustom!define5' ||
              args.value.columnKey == 'retailVouchDetailCustom!define6' || args.value.columnKey == 'retailVouchDetailCustom!define7' ||
              args.value.columnKey == 'retailVouchDetailCustom!define10' || args.value.columnKey == 'retailVouchDetailCustom!define11' ||
              args.value.columnKey == 'retailVouchDetailCustom!define12' || args.value.columnKey == 'retailVouchDetailCustom!define13' ||
              args.value.columnKey == 'retailVouchDetailCustom!define14') {
              return false;
            }
          }
          return true;
        }
      });

      viewmodel.on('uquery', function (args) {
        var code = args.params;
        if (code != undefined) {
          var params = {
            mode: 'edit',
            readOnly: true,
            id: code
          };
          var data = {
            billtype: 'voucher',
            billno: 'rm_gatheringvouch',
            params: params
          };
          cb.loader.runCommandLine('bill', data, viewmodel)
        }
      });

      //触屏端添加开电票按钮，修改action动作
        viewmodel.on('makeTicket', function () {
          let datas = viewmodel.getAllData();
          var tenant = cb.rest.AppContext.tenant.id;
          var serviceUrl = cb.rest.AppContext.serviceUrl;
          var token = cb.rest.AppContext.token;
          //张琳哥判断是否可开电票逻辑
          var url = serviceUrl + '/uniform/api/invoice/getinvoiceinfo?terminalType=1&token=' + token;
          var params1 = {
            id: datas.id
          };
          var proxy = cb.rest.DynamicProxy.create({
            settle: {
              url: url,
              method: "POST"
            }
          });
          proxy.settle(params1, function (err, result) {
            if (err) {
              cb.utils.alert(err.message, 'error');
              return;
            }
            var mone = JSON.parse(result);
            var params = {
              mode: 'add',
              params: {
                storeId: datas.store,
                money: mone.money,
                //清空表头开票失败原因时，调张琳哥开电票借口会用到
                id: datas.id,
                iMemberid: datas.iMemberid,
                iRelatingRetailid: datas.iRelatingRetailid,
                iCoRetailid: datas.iCoRetailid,
                iEInvoiceState: datas.iEInvoiceState,
                tenantid: tenant
              }
            };
            var data = {
              billtype: 'voucher',
              billno: 'rm_makeelectronicticket',
              params: params
            };
            cb.loader.runCommandLine('bill', data, viewmodel)
          });
        });

      viewmodel.on("modeChange", function (data) {
        common.bsnTabShow(data, viewmodel, 'rm_retailvouch_body_page_sn_2', 'rm_retailvouch_head_page_2', bShowSn);
        common.bsnTabShow(data, viewmodel, 'rm_retailvouch_body_page_sn_1', 'rm_retailvouch_head_page_1', bShowSn);
        common.bCouponTabShow(data, viewmodel, 'rm_retailvouch_body_page_coupon_2', 'rm_retailvouch_head_page_2', bShowCouponSn);
        common.bCouponTabShow(data, viewmodel, 'rm_retailvouch_body_page_coupon_1', 'rm_retailvouch_head_page_1', bShowCouponSn);
        });

			viewmodel.on("showsn", function (data) {
				bShowSn = !bShowSn;
				if (!common.bsnTabShow(data, viewmodel, 'rm_retailvouch_body_page_sn_2', 'rm_retailvouch_head_page_2', bShowSn)) {
					bShowSn = !bShowSn; //恢复原值
        }
        if (!common.bsnTabShow(data, viewmodel, 'rm_retailvouch_body_page_sn_1', 'rm_retailvouch_head_page_1', bShowSn)) {
					bShowSn = !bShowSn; //恢复原值
				}
      });

      viewmodel.on("showcouponsn", function (data) {
				bShowCouponSn = !bShowCouponSn;
				if (!common.bCouponTabShow(data, viewmodel, 'rm_retailvouch_body_page_coupon_2', 'rm_retailvouch_head_page_2', bShowCouponSn)) {
					bShowCouponSn = !bShowCouponSn; //恢复原值
        }
        if (!common.bCouponTabShow(data, viewmodel, 'rm_retailvouch_body_page_coupon_1', 'rm_retailvouch_head_page_1', bShowCouponSn)) {
					bShowCouponSn = !bShowCouponSn; //恢复原值
				}
      });

      viewmodel.on('relating', function () {
        var proxy = cb.rest.DynamicProxy.create({
          settle: {
            url: 'bill/relating',
            method: 'GET'
          }
        });
        var params = {
          billnum: "rm_retailvouch",
          id: viewmodel.get('id').getValue()
        };
        proxy.settle(params, function (err, result) {
          if (err) {
            cb.utils.alert(err.message, 'error');
            return;
          }
          if (result != undefined) {
            var resInfo = JSON.parse(result);
            var params = {
              mode: 'edit',
              readOnly: true,
              id: resInfo
            };
            var sbillno;
            if (viewmodel.get('iPresellState').getValue() == "6") {
              sbillno = 'sh_aftersale';
            } else {
              sbillno = 'rm_retailvouch';
            }
            var data = {
              billtype: 'voucher',
              billno: sbillno,
              params: params
            };
            cb.loader.runCommandLine('bill', data, viewmodel)
          } else {
            cb.utils.alert('没有关联单据', 'error');
          }

        });
      });
      viewmodel.on('beforeLoad', function (data) {
        data.isDistinct = true;
      });
      viewmodel.on('PreRepeat', function () {
        self.localPrint(viewmodel);
      });
    },
    localPrint: function (viewModel) {
      var id = viewModel.get('id').getValue();
      if (cb.utils.isEmpty(id)) {
        cb.utils.alert('请选择具体单据', 'error');
        return;
      }
      var templateCode = cb.rest.AppContext.option.billdefaulttype;
      // 判断是否是储值单据----存在商品行有储值卡号和余额
      let retailVouch = viewModel.getAllData();
      let retailVouchDetails = retailVouch.retailVouchDetails;
      let isCardRecharge = false;
      if(retailVouch.iBusinesstypeid_name === '储值'){
        isCardRecharge = retailVouchDetails.some(item => item.cStorageCardNum && item.fBalance != null);
      }
      if(isCardRecharge){ // 设置储值模板
        templateCode = cb.rest.AppContext.option.storageDefaultTemplate;
      }
      if (cb.utils.isEmpty(templateCode)) {
        cb.utils.alert('没有设置打印模板，请检查', 'error');
        return;
      }
      var cachePrintTemplate = localStorage.getItem('billing_printTemplate');
      if(isCardRecharge){ // 不取缓存模板
        cachePrintTemplate = null;
      }
      var url = cachePrintTemplate ? 'report/getPrintDataAsJson' : 'report/getTemplateStructure';
      var proxy = cb.rest.DynamicProxy.create({
        print: {
          url: url,
          method: 'POST',
          options: {
            mask: true
          }
        }
      });
      var params = {
        billno: viewModel.getParams().billNo,
        templateCode: templateCode,
        ids: [id]
      };
      proxy.print(params, function (err, result) {
        if (err) {
          cb.utils.alert(err.message, 'error');
          return;
        }
        var data;
        if (cachePrintTemplate) {
          data = JSON.parse(cachePrintTemplate);
          data.data = result;
        } else {
          data = result;
          localStorage.setItem('billing_printTemplate', JSON.stringify({
            dataSource: data.dataSource,
            tempJson: data.tempJson
          }));
        }
        data.billingcopiesofprintcopies = 1; // cb.rest.AppContext.option.billingcopiesofprintcopies || 1;
        cb.utils.localPrint(data);
      });
    }
  }
  try {
    module.exports = RM_rm_retailvouch_VM_Extend;
  } catch (error) {

  }
  return RM_rm_retailvouch_VM_Extend;
});
