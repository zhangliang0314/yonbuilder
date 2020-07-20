cb.define(['common/common_VM.Extend.js'], function (common) {
  var ST_st_storein_VM_Extend = {
    doAction: function (name, viewmodel) {
      if (this[name])
        this[name](viewmodel);
    },
    init: function (viewmodel) {

      var bShowSn = false;
      var scanedSns = {};
      var detailsModel = viewmodel.get("details");
      if (cb.rest.interMode === 'touch' && viewmodel.getParams().mode !== 'browse') {
        common.touchFormatter(detailsModel, viewmodel, "qty");
        detailsModel.on('afterSetColumns', function () {
          common.touchFormatter(detailsModel, viewmodel, "qty");
        });
      }

      common.snformatter(detailsModel, viewmodel);

      //电子秤称重
      common.elecBalanceWeigh(detailsModel, viewmodel, "qty");

      //初始化barcode wangyda
      common.initBarcodeModel(viewmodel);
      common.initSnCheckbox(viewmodel);
      var inspectionModel = new cb.models.SimpleModel({ needClear: false });
      viewmodel.addProperty('inspection', inspectionModel);

      inspectionModel.on('filter', function (args) {
        filterData(args);
      });

      var detailRows = [];
      var filterData = function (isfilter) {
        if (isfilter == true) {
          //只显示未验货数据
          var rows = detailsModel.getRows();
          // var rows = detailsModel.getRows();
          var newRows = [];
          rows.forEach(function (item) {
            if (item.recqty != item.qty) {
              newRows.push(item);
            }
          });
          detailsModel.setDataSource(newRows);
        } else {
          //显示全部数据
          detailsModel.setDataSource(detailRows);
        }
      }

      var errorGridModel = new cb.models.GridModel({
        "columns": {
          "barcode": {
            "cItemName": "barcode",
            "cShowCaption": "条码",
            "bHidden": false,
            "bCanModify": false,
            "iColWidth": 120,
            "bShowIt": true,
            "cControlType": "Input"
          },
          "skucode": {
            "cItemName": "skucode",
            "cShowCaption": "商品编码",
            "bHidden": false,
            "bCanModify": false,
            "iColWidth": 120,
            "bShowIt": true,
            "cControlType": "Input"
          },
          "skuname": {
            "cItemName": "skuname",
            "cShowCaption": "商品名称",
            "bHidden": false,
            "bCanModify": false,
            "iColWidth": 200,
            "bShowIt": true,
            "cControlType": "Input"
          },
          "errorcount": {
            "cItemName": "errorcount",
            "cShowCaption": "错误数量",
            "bHidden": false,
            "bCanModify": false,
            "iColWidth": 80,
            "bShowIt": true,
            "cControlType": "Input"
          },
          "reason": {
            "cItemName": "reason",
            "cShowCaption": "错误原因",
            "bHidden": false,
            "bCanModify": false,
            "iColWidth": 120,
            "bShowIt": true,
            "cControlType": "Input"
          }
        },
        "showCheckBox": false,
        "showRowNo": false,
        "showAggregates": false,
        "showColumnSetting": false,
        "bCanModify": false,
        "bIsNull": true,
        "pagination": false
      });
      viewmodel.addProperty('error', errorGridModel);

      var checkWarehouse = function (viewmodel) {
        if (!viewmodel.get('inwarehouse').getValue()) {
          cb.utils.alert('请先录入仓库!', 'warning');
          return false;
        }
        return true;
      }
      //============================================================barcode related
      //扫码
      viewmodel.get("barcode").on('enter', function (data) {

        // if(inspectionFlag == false){
        //   cb.utils.alert('验货前请先点验货按钮!');
        // }
        var isSnChecked = false;
        if (viewmodel.get('sncheckbox')) {
          isSnChecked = viewmodel.get('sncheckbox').getValue();
        }

        //字段对照
        var fields = {
          mainid: 'storein',
          product: 'product',
          productcode: 'product_cCode',
          productname: 'product_cName',
          productsku: 'productsku',
          barcode: 'barcode',
          batchno: 'batchno',
          producedate: 'producedate',
          invaliddate: 'invaliddate',
          productskucode: 'productsku_cCode',
          weight: 'weight',
          quantity: 'num',
          unit: 'unit',
          unitname: 'unitName',//'',product_unitName
          product_modelDescription: 'product_modelDescription',
          isbatch: 'isBatchManage'
        };
        var snWarehouse = viewmodel.get('inwarehouse').getValue();
        var iSerialManage = viewmodel.get('inwarehouse_iSerialManage').getValue();
        var curInputValue = data ? data : viewmodel.get("barcode").getValue();
        curInputValue = curInputValue.trim();
        if (!viewmodel.getGridModels()) {
          return;
        }

        var findRowBySn = function (detailsModel, val) {
          let rows = detailsModel.getRows();
          let snModelName = 'storeInDetailSNs';
          for (let i = 0; i < rows.length; i++) {
            let sns = rows[i][snModelName];
            if (sns) {
              // let snRows = sns.filter(row => row._status != 'Delete');
              for (let j = 0; j < sns.length; j++) {
                if (val == sns[j].sn) {
                  let qty = rows[i].qty == null ? 0 : rows[i].qty;
                  let recqty = rows[i].recqty;
                  if (qty + 1 > recqty) return -2;//超数量

                  detailsModel.select(i);
                  return i;
                }
              }
            }
          }
          return -1;
        }

        var findRow = function (detailsModel, productsku, isBatchManage, pData, codeType) {
          var rowIndex = -1;
          var rows = detailsModel.getRows();
          var rowLength = rows.length;
          for (var i = 0; i < rowLength; i++) {
            if (rows[i]._status == 'Delete') {
              continue;
            }
            if (detailsModel.getCellValue(i, fields.unit) != pData.oUnitId) { //单位不相同认为不是同一行
              continue;
            }

            if (pData.isBatchManage) {
              if (pData.productskus[0]) {
                if (pData.productskus[0].batchno && detailsModel.getCellValue(i, fields.batchno) != pData.productskus[0].batchno) {
                  continue;
                }
                if (pData.isExpiryDateManage) {
                  if (pData.productskus[0].producedate && detailsModel.getCellValue(i, fields.producedate) != pData.productskus[0].producedate) {
                    continue;
                  }
                  if (pData.productskus[0].invaliddate && detailsModel.getCellValue(i, fields.invaliddate) != pData.productskus[0].invaliddate) {
                    continue;
                  }
                }
              } else {
                if (pData.batchno && detailsModel.getCellValue(i, fields.batchno) != pData.batchno) {
                  continue;
                }
                if (pData.isExpiryDateManage) {
                  if (pData.producedate && detailsModel.getCellValue(i, fields.producedate) != pData.producedate) {
                    continue;
                  }
                  if (pData.invaliddate && detailsModel.getCellValue(i, fields.invaliddate) != pData.invaliddate) {
                    continue;
                  }
                }
              }

            }

            let qty = rows[i].qty == null ? 0 : rows[i].qty;
            let recqty = rows[i].recqty;
            let barcodeQty = pData.quantity;
            if (!barcodeQty) barcodeQty = 1;
            qty = Number(qty) + Number(barcodeQty);
            let scale = cb.rest.AppContext.option.quantitydecimal;
            qty = Number(qty.toFixed(scale));
            recqty = Number(recqty.toFixed(scale));
            let val = curInputValue;
            if (codeType == 'sn') {

              if (scanedSns[val]) {
                cb.utils.alert('已扫描过该序列号[' + val + ']');
                return -1;
              }
              // let rows = detailsModel.getRows();
              // for (let i = 0; i < rows.length; i++) {
              let snModelName = 'storeInDetailSNs';
              let sns = rows[i][snModelName];
              // let sns = rows[i][snmodeln]
              if (sns) {
                // let snRows = sns.filter(row => row._status != 'Delete');
                for (let j = 0; j < sns.length; j++) {
                  if (val == sns[j].sn) {
                    // cb.utils.alert('序列号重复!','error');
                    // return false;
                    // sns[j].sninspect = 1;
                    // detailsModel.
                    viewmodel.get(snModelName).setCellValue(j, 'sninspect', 1, true, false);
                    scanedSns[val] = true;
                    break;
                  }
                }
              }
              if (!scanedSns[val]) continue;//序列号没有匹配上,继续查找下一商品行
              // }
            }

            if (productsku == detailsModel.getCellValue(i, fields.productsku)) {
              if (isBatchManage) {
                //if (batchNo == detailsModel.getCellValue(i, fields.batchno)) {
                if (qty > recqty) {
                  scanedSns[val] = false;
                  rowIndex = -2;//超数量
                  continue;
                } else {
                  rowIndex = i;
                  break;
                }

                // }
              } else {
                if (detailsModel.getCellValue(i, fields.batchno) == undefined) {
                  if (qty > recqty) {
                    scanedSns[val] = false;
                    rowIndex = -2;//超数量
                    continue;
                  } else {
                    rowIndex = i;
                    break;
                  }
                }
              }
            }
          }
          return rowIndex;
        };

        var getUpdateQty = function (curRowIndex, qtyField, barcodeQty) {
          if (!barcodeQty) barcodeQty = 1;
          let newQuantity = null;
          let tempQty = detailsModel.getCellValue(curRowIndex, qtyField);
          if (null == tempQty || tempQty === undefined) {
            newQuantity = barcodeQty;
          } else {
            // newQuantity = parseInt(tempQty) + barcodeQty;
            newQuantity = Number(tempQty) + barcodeQty;
          }
          return newQuantity;
        };

        //更新行上数量
        var updateRowQty = function (detailsModel, curRowIndex, curInputValue, pData, viewmodel) {
          let qty = getUpdateQty(curRowIndex, "qty", pData.quantity);
          let recqty = getUpdateQty(curRowIndex, "recqty", pData.quantity);
          let rowindex = curRowIndex + 1;
          let scale = cb.rest.AppContext.option.quantitydecimal;
          qty = Number(qty.toFixed(scale));
          recqty = Number(recqty.toFixed(scale));

          if (qty >= recqty) {
            // cb.utils.alert("第" + rowindex + "行条码为[" + curInputValue + "]的商品入库数量大于待入库数量！", 'error');
            setInspectionInfo(curInputValue, pData, 3);
            viewmodel.get("barcode").setValue(null);
            return;
          }
          detailsModel.select(curRowIndex);//选中行
          // detailsModel.setCellValue(curRowIndex, "qty", qty, true, false); //触发cellcheck
          detailsModel.setCellValue(curRowIndex, "qty", qty, false, false);

          var snModel = viewmodel.get('storeInDetailSNs');
          if (!!snModel && snModel.getRows()) {
            let snRows = snModel.getRows();
            for (let i = 0; i < snRows.length; i++) {
              let snRow = snModel.getRows()[i];
              if (scanedSns[snRow.sn]) {
                snModel.setCellValue(i, 'sninspect', 1, true, false);
              }
            }
          }

          //更新原数据源数量
          var srcBillRow = detailsModel.getCellValue(curRowIndex, 'srcBillRow');
          for (let i = 0; i < detailRows.length; i++) {
            if (detailRows[i].srcBillRow == srcBillRow) {
              detailRows[i].qty = qty;
              //这里不更新,在保存前更新 序列号 验货结果
              // if(detailRows[i].storeInDetailSNs){
              //   for(let j=0;j<detailRows[i].storeInDetailSNs.length;j++){
              //     if(scanedSns[detailRows[i].storeInDetailSNs[j].sn]){
              //       detailRows[i].storeInDetailSNs[j].sninspect = 1;
              //     }
              //   }
              // }
              break;
            }
          }
          setInspectionInfo(curInputValue, pData, 0);
          viewmodel.get("barcode").setValue(null);
        };

        if (isSnChecked) { //如果扫描序列号的话,需要先录入仓库
          if (!checkWarehouse(viewmodel)) {
            viewmodel.get("barcode").setValue(null);
            return;
          }
          if (!iSerialManage) { //不严格管理
            let rowIndex = findRowBySn(detailsModel, curInputValue);
            if (rowIndex == -1) {
              // cb.utils.alert("表体行没有条码为[" + curInputValue + "]的商品！", 'error');
              // inspectionModel.setState('productInfo', curInputValue);
              // inspectionModel.setState('promptMessage', '超入库范围');
              // inspectionModel.setState('errorCount', 1);
              // eslint-disable-next-line no-undef
              setInspectionInfo(curInputValue, pData, 2);
            } else if (rowIndex == -2) {
              // eslint-disable-next-line no-undef
              setInspectionInfo(curInputValue, pData, 3);
            } else {
              // updateRowQty(detailsModel, rowIndex, curInputValue, pData);
              let qty = getUpdateQty(rowIndex, "qty", 1);
              detailsModel.setCellValue(rowIndex, "qty", qty, true, true);
            }
            viewmodel.get("barcode").setValue(null);
            return;
          }
        }

        var queryProductProxy = cb.rest.DynamicProxy.create({
          settle: {
            url: '/bill/ref/getBarcodeResult.do',
            method: 'POST'
          }
        });

        var params = {
          isReturn: 0,
          keyword: curInputValue,
          billnum: viewmodel.originalViewMeta.cBillNo,
          codeType: isSnChecked ? 'snOnly' : '',
          snWarehouse: snWarehouse,
          iSerialManage: iSerialManage
        };

        if (curInputValue && detailsModel) {
          queryProductProxy.settle(params, (err, result) => {
            if (err) {
              cb.utils.alert(err.message, 'error');
              viewmodel.get("barcode").setValue(null);
              return;
            }

            if (result === undefined || JSON.stringify(result) == "{}") {
              // cb.utils.alert("条码为[" + curInputValue + "]的商品档案不存在！", 'error');
              // inspectionModel.setState('productInfo', curInputValue);
              // inspectionModel.setState('promptMessage', '商品不存在');
              // inspectionModel.setState('errorCount', 1);
              setInspectionInfo(curInputValue, null, 1);
              viewmodel.get("barcode").setValue(null);
              return;
            } else if (result.errtype == 'multirecord') {
              setInspectionInfo(curInputValue, null, 4);
              viewmodel.get("barcode").setValue(null);
              return;
            }

            let codeType = result.codeType;
            let pData = result.data[0];
            let isBatchManage = pData.isBatchManage;
            let resultSku = pData.productskus["0"].skuId;
            // let batchno = isBatchManage ? pData.productskus[0].batchno : undefined;
            var curRowIndex = -1;

            curRowIndex = findRow(detailsModel, resultSku, isBatchManage, pData, codeType);

            if (curRowIndex == -1) {
              // cb.utils.alert("表体行没有条码为[" + curInputValue + "]的商品！", 'error');
              // inspectionModel.setState('productInfo', curInputValue);
              // inspectionModel.setState('promptMessage', '超入库范围');
              // inspectionModel.setState('errorCount', 1);
              setInspectionInfo(curInputValue, pData, 2);
            } else if (curRowIndex == -2) {
              setInspectionInfo(curInputValue, pData, 3);
            } else {
              updateRowQty(detailsModel, curRowIndex, curInputValue, pData, viewmodel);
            }
            viewmodel.get("barcode").setValue(null);
          });
        }
      });

      //=====验货================
      var inspectionFlag = false; //验货标识
      // var errorCount = 0;
      var progressData = [0, 0, 0];
      var totalErrQty = 0;
      //var saveRows = [];//保存前的验货
      var setInspectionInfo = function (barcode, pData, errflag) {
        var errInfo = {};
        var scanQuantity = 1;

        errInfo.barcode = barcode;
        if (pData) {
          // var skus = pData.productskus;
          // if (skus) {
          //   errInfo.skucode = skus[0].skuCode;
          //   errInfo.skuname = skus[0].skuName;
          // } else {
          errInfo.skucode = pData.cCode;
          errInfo.skuname = pData.cName;
          // }

          // if (pData.quantity != undefined && pData.quantity != null) {
          //   scanQuantity = pData.quantity;
          // }
          scanQuantity = pData.quantity;
          if (!scanQuantity) {
            scanQuantity = 1;
          }

          errInfo.errorcount = scanQuantity;
        } else {
          errInfo.skucode = '';
          errInfo.skuname = '';
          errInfo.errorcount = 1;
        }

        if (errflag == 0) {

          progressData[1] = progressData[1] + scanQuantity;
          setProgressData(progressData);

          inspectionModel.setState('productInfo', pData.cName);
          // inspectionModel.setState('promptMessage', { type: 'success', message: '匹配正确' });
          setPromoteMsg({ type: 'success', message: '匹配正确' });
          // inspectionModel.setState('errorCount', 0);

        } else {

          let promotMsg = {};
          totalErrQty++;
          if (errflag == 1) {
            errInfo.reason = '商品不存在';
            promotMsg = { type: 'error', message: errInfo.reason };
            inspectionModel.setState('productInfo', errInfo.barcode);
          } else if (errflag == 2) {
            errInfo.reason = '超入库范围';
            promotMsg = { type: 'warning', message: errInfo.reason };
            inspectionModel.setState('productInfo', pData.cName);
          } else if (errflag == 3) {
            errInfo.reason = '超待入库数量';
            promotMsg = { type: 'warning', message: errInfo.reason };
            inspectionModel.setState('productInfo', pData.cName);
          } else if (errflag == 4) {
            errInfo.reason = '匹配到多个商品';
            promotMsg = { type: 'error', message: errInfo.reason };
          }

          // inspectionModel.setState('promptMessage', promotMsg);
          setPromoteMsg(promotMsg);
          inspectionModel.setState('errorCount', totalErrQty);
          errorGridModel.appendRow(errInfo);
        }

      };

      var setPromoteMsg = function (promotMsg) {
        inspectionModel.setState('promptMessage', promotMsg);
      };

      var setProgressData = function (progressData) {
        if (progressData[2] !== 0) {
          progressData[0] = progressData[1] * 100 / progressData[2];
        }

        progressData[0] = Math.round(progressData[0]);//百分比
        progressData[1] = Math.round(progressData[1] * 100) / 100;//入库数量
        inspectionModel.setState('progressData', progressData);
      };

      // var detailsModel = viewmodel.get("details");
      //向后台传递行号
      detailsModel.setState('orderField', 'rowno');
      detailsModel.on('rowColChange', function (args) {
        if (args.value.columnKey == 'batchno' || args.value.columnKey == 'define1' || args.value.columnKey == 'define2' || args.value.columnKey == 'define3' ||
          args.value.columnKey == 'define4' || args.value.columnKey == 'define5' || args.value.columnKey == 'define6' || args.value.columnKey == 'define7' ||
          args.value.columnKey == 'define8' || args.value.columnKey == 'define9' || args.value.columnKey == 'define10' || args.value.columnKey == 'define11' ||
          args.value.columnKey == 'define12' || args.value.columnKey == 'define13' || args.value.columnKey == 'define14' || args.value.columnKey == 'define15' ||
          args.value.columnKey == 'define16' || args.value.columnKey == 'define17' || args.value.columnKey == 'define18' || args.value.columnKey == 'define19' ||
          args.value.columnKey == 'define20' || args.value.columnKey == 'define21' || args.value.columnKey == 'define22' || args.value.columnKey == 'define23' ||
          args.value.columnKey == 'define24' || args.value.columnKey == 'define25' || args.value.columnKey == 'define26' || args.value.columnKey == 'define27' ||
          args.value.columnKey == 'define28' || args.value.columnKey == 'define29' || args.value.columnKey == 'define30') {
          return false;
        }

        var cellName = args.value.columnKey;
        var rowIndex = args.value.rowIndex;
        var unitExchangeType = detailsModel.getCellValue(rowIndex, 'unitExchangeType');
        if (cellName == 'stockUnit_code' || cellName == 'stockUnit_name') {
          common.setInvExchRateState(detailsModel, rowIndex);
          if (unitExchangeType == 0) {
            return true;
          } else {
            return false;
          }
        }

        if (cellName == 'invExchRate') {
          common.setInvExchRateState(detailsModel, rowIndex);
          if (unitExchangeType == 0) {
            return false;
          } else {
            return true;
          }
        }
      });

      if (detailsModel) {
        detailsModel.on('afterSetColumns', function (columns) {
          common.fieldVisble(viewmodel.get('srcBillType').getValue(), detailsModel);
          common.snformatter(detailsModel, viewmodel);
        });
        detailsModel.on('beforeInsertRow', function (data) {
          if(this.getParent().get("srcBillNO")&&this.getParent().get("srcBillNO").getValue()){
            return false;
          }
        });
        //单元格值改变以前
				detailsModel.on('beforeCellValueChange', function (data) {
					switch (data.cellName) {
					  case "qty":
					  case "subQty":
					  case "contactsQuantity":
					  case "contactsPieces":
					  {
						if (cb.utils.isEmpty(data.value)) return;
						if (data.value <= 0 || data.value == '-') {
						  cb.utils.alert("[" + detailsModel.getColumn(data.cellName).cShowCaption + "]只能录入大于0的值，请检查后重试！");
						  return false;
						}
						break;
					  }
					}
				  });
      }

      detailsModel.on('afterCellValueChange', function (data) {
        console.log(data);
        switch (data.cellName) {
          case "qty": {
            if (inspectionFlag == false) return;

            var rowindex = data.rowIndex;
            var recqty = detailsModel.getCellValue(rowindex, 'recqty');
            var value = data.value;
            if (!isNaN(value)) {
              if (Number(value) >= 0 && Number(value) <= Number(recqty)) {
                //detailsModel.setCellValue(rowindex,'recqty',data.oldValue);
                progressData[1] = progressData[1] + Number(value) - Number(data.oldValue);

                setProgressData(progressData);

                //更新原数据源数量
                var srcBillRow = detailsModel.getCellValue(rowindex, 'srcBillRow');
                for (let i = 0; i < detailRows.length; i++) {
                  if (detailRows[i].srcBillRow == srcBillRow) {
                    detailRows[i].qty = data.value;
                    break;
                  }
                }
                return;
              }
            }
            detailsModel.setCellValue(rowindex, 'qty', data.oldValue);
            break;
          }
          case "natUnitPrice":
          case "natMoney": {
            if (data.cellName == 'natUnitPrice' || data.cellName == 'natMoney') { //财务联查，控制自动计算成本
              if (detailsModel.getCellValue(data.rowIndex, 'autoCalcCost') != undefined)
                detailsModel.setCellValue(data.rowIndex, 'autoCalcCost', 'false');
            }
            break;
          }
        }
      });

      var setDeleteRowButtonVisible = function () {
        if (inspectionFlag) {
          let gridModel = viewmodel.get('details');
          const actions = gridModel.getCache('actions');
          const actionsStates = [];
          var rows = gridModel.getRows();
          rows.forEach(function (item) {
            const actionState = {};
            actions.forEach(action => {
              if (action.cItemName == 'btnDeleteRow') {
                if (actionState["btnDeleteRow"]) actionState["btnDeleteRow"] = { visible: false };
              }
            });
            actionsStates.push(actionState);
          });
          gridModel.setActionsState(actionsStates);
          return false;
        }
      }
      // let gridModel = viewmodel.getGridModel();

      detailsModel.on('afterSetDataSource', () => {
        setDeleteRowButtonVisible();
      });

      //验货
      viewmodel.on('checkRow', function (args) {
        if (inspectionFlag == true) {
          cb.utils.alert('当前已处于验货状态!');
          return;
        }

        initInspectInfo();

      });

      var initInspectInfo = function () {

        inspectionFlag = true;
        if (inspectionModel) inspectionModel.setVisible(true);
        //viewmodel.get('btnCheckRow').setDisabled(true);
        viewmodel.get('btnCheckRow').setValue('验货中');
        viewmodel.get('btnCheckRow').setState('className', 'btn-inspecting');
        if (viewmodel.get("barcode")) viewmodel.get("barcode").setVisible(true);
        if (viewmodel.get("sncheckbox")) viewmodel.get("sncheckbox").setVisible(true);

        inspectionModel.setState('errorGridModel', errorGridModel);
        inspectionModel.setState('productInfo', '商品名称');

        setPromoteMsg({ type: 'success', message: '' });
        inspectionModel.setState('errorCount', 0);

        var rows = detailsModel.getRows();
        detailRows = rows.slice();//用于保存的数据备份

        var newRows = [];
        rows.forEach(function (item) {
          //待入库数量
          if (item.recqty > 0) {
            item.qty = null;
            // item.qty = 0;
            newRows.push(item);
            progressData[2] += item.recqty;
          }
        });
        detailsModel.setDataSource(newRows);

        // inspectionModel.setState('progressData', progressData);
        setProgressData(progressData);

        // setDeleteRowButtonVisible();会提示错误
      };

      // var setSnCheckBoxVisible = function(viewmodel){
      //   if (viewmodel.get('sncheckbox')) {
      //     var mode = viewmodel.getParams().mode;
      //     if (mode == 'add' || mode == 'edit') {
      //       viewmodel.get('sncheckbox').setVisible(true);
      //     } else {
      //       viewmodel.get('sncheckbox').setVisible(false);
      //     }
      //   }
      // };

       viewmodel.on('afterEdit', function() {
      //   setSnCheckBoxVisible(viewmodel);
         //财务联查模板，隐藏按钮
         common.hiddenFiSearchButton(viewmodel);
         //成对推单生成的入库单，单价金额不可改
         common.hiddenFiSearchFields(viewmodel,detailsModel);
         viewmodel.get("btnAddRow")&&viewmodel.get("btnAddRow").setDisabled(true);

         viewmodel.get("btnCheckRow").setDisabled(true);
       });

       viewmodel.on('relating', function () {
          var code = viewmodel.get('srcBill').getValue();
          var params = {
              mode: 'edit',
              readOnly: true,
              id: code
          };
          var sbillno;
          sbillno = 'st_storeout';
          var data = {
              billtype: 'voucher',
              billno: sbillno,
              params: params
          };
          cb.loader.runCommandLine('bill', data, viewmodel)
      });

      viewmodel.on('afterLoadData', function (args) {
        //调拨类型的隐藏单价金额字段
        common.fieldVisble(args.srcBillType, viewmodel.get('details'));

        //是否显示序列号相关
        common.showSnVisible(viewmodel, detailsModel);

        // setSnCheckBoxVisible(viewmodel);
        viewmodel.get("btnAddRow")&&viewmodel.get("btnAddRow").setDisabled(true);

        viewmodel.get("btnCheckRow").setDisabled(true);
        progressData = [0, 0, 0];
        inspectionFlag = false;
        if (viewmodel.get("barcode")) viewmodel.get("barcode").setVisible(false);
        if (viewmodel.get("sncheckbox")) viewmodel.get("sncheckbox").setVisible(false);
        scanedSns = {};

        var rows = detailsModel.getRows();
        var newRows = [];
        rows.forEach(function (item) {
          let newSnRows = [];
          //待入库数量
          if (item.contactsQuantity > 0) {

            let sns = item.storeInDetailSNs;
            if (sns) {
              for (let i = 0; i < sns.length; i++) {
                if (sns[i].binspect == 0) newSnRows.push(sns[i]);
              }
              item.storeInDetailSNs = newSnRows;
            }
            newRows.push(item);

          }
        });
        //detailsModel.setDataSource(newRows);

        let mode = viewmodel.getParams().mode;
        if (viewmodel.get("btnCheckRow")) {
          if (mode === "add") {
            viewmodel.get("btnCheckRow").setVisible(false);
            viewmodel.get("btnCheckRow").setDisabled(false);
          } else {
            viewmodel.get("btnCheckRow").setVisible(false);
          }
        }

        //非货位仓不允许参照
        if (viewmodel.get('warehouse_isGoodsPosition').getValue()) {
					viewmodel.get("details").setColumnState('goodsposition_cName', 'bCanModify', true);
				}else{
					viewmodel.get("details").setColumnState('goodsposition_cName', 'bCanModify', false);
				}
      });

      //是否显示序列号信息
      viewmodel.on("modeChange", function (data) {
        common.bsnTabShow(data, viewmodel, 'st_storein_body_page_sn', 'st_storein_head_page', bShowSn);
      });

      viewmodel.on("showsn", function (data) {
        bShowSn = !bShowSn;
        if (!common.bsnTabShow(data, viewmodel, 'st_storein_body_page_sn', 'st_storein_head_page', bShowSn)) {
          bShowSn = !bShowSn;//恢复原值
        }
      });

      //选择货位前需先选中仓库
			viewmodel.get('details').on('beforeBrowse', function (data) {
				if(data.cellName === 'goodsposition_cName'){
					if (!viewmodel.get('inwarehouse').getValue()) {
						cb.utils.alert('请先选择仓库！', 'warning');
						return false;
					}
        }
        if (data.cellName && (data.cellName == "stockUnit_code" || data.cellName == "stockUnit_name" )) {
          let row = detailsModel.getRows()[data.rowIndex];
          if (row.product && row.product > 0) {
              let condition = {
                  "productId": row.product,
                  "tenant_id": cb.rest.AppContext.tenant.id
              };
              data.context.setCondition(condition);
          }
        }
        if (data.cellName && (data.cellName == "batchno")) {
          common.checkBeforeaddBatchno(viewmodel,viewmodel.get('details'),data);
        }
			});

			//切换仓库刷新货位参照是否可编辑
			viewmodel.get("inwarehouse_name").on('afterValueChange',function(data){
        viewmodel.get("details").setColumnValue("goodsposition", null);
				viewmodel.get("details").setColumnValue("goodsposition_cName", null);
				if (viewmodel.get('warehouse_isGoodsPosition').getValue()) {
					viewmodel.get("details").setColumnState('goodsposition_cName', 'bCanModify', true);
				}else{
					viewmodel.get("details").setColumnState('goodsposition_cName', 'bCanModify', false);
				}
            });

      //非货位仓不允许参照
			// viewmodel.on('beforeAddRow', function (data) {
			// 	if (viewmodel.get('warehouse_isGoodsPosition').getValue()) {
			// 		viewmodel.get("details").setColumnState('goodsposition_cName', 'bCanModify', true);
			// 	}else{
			// 		viewmodel.get("details").setColumnState('goodsposition_cName', 'bCanModify', false);
			// 	}
			// });

      //保存之前，校验出库仓库和入库仓库不可以相同
      viewmodel.on('beforeSave', function (args) {

        var outorg = viewmodel.get("outorg").getValue();
        var outwarehouse = viewmodel.get("outwarehouse").getValue();
        var inorg = viewmodel.get("inorg").getValue();
        var inwarehouse = viewmodel.get("inwarehouse").getValue();
        if (outwarehouse == inwarehouse && outorg == inorg) {
          cb.utils.alert("出库仓库和入库仓库不可以相同！");
          return false;
        }

        var rows = detailsModel.getRows();

        if (inspectionFlag == false) {
          for (let i = 0; i < rows.length; i++) {
            let item = rows[i];
            if (isNaN(item.qty) || item.qty == null) {
              cb.utils.alert('入库数量不能为空!', 'error');
              return false;
            }
          }
        }

        //货位仓校验货位必输
        let isGoodsPosition = viewmodel.get('warehouse_isGoodsPosition').getValue();
        if (isGoodsPosition) {
            for (let i = 0; i < rows.length; i++) {
                let row = rows[i];
                if (!row["goodsposition_cName"]) {
                    cb.utils.alert('启用货位管理的仓库行的货位不能为空,请检查!', 'error');
                    return false;
                }
            }
        }

        var detailsModelName = 'details';
        var snModelName = 'storeInDetailSNs';
        var qtyfildname = 'qty';

        // var detailsModel = viewmodel.get("details");
        var iSerialManage = viewmodel.get('inwarehouse_iSerialManage').getValue();
        if (cb.rest.AppContext.option.serialManage && iSerialManage) {
          let bflg = common.checkSnBeforeSave(args, detailsModelName, snModelName, qtyfildname, viewmodel);
          if (bflg == 1) {
            return false;//序列号重复
          }
          if (bflg == 2) {
            cb.utils.alert('商品行入库数量与序列号数量不一致，请检查！', 'warning');
            return false;
          }
          // return true;
        }

        var returnPromise = new cb.promise();

        var argsdata = args;
        var confirmSave = function () {
          var datas = JSON.parse(argsdata.data.data);

          //自动清空入库数量为空的行

          var newRows = [];
          rows.forEach(function (item) {
            if (!isNaN(item.qty) && Number(item.qty) > 0) {
              // if (item.storeInDetailSNs) {//更新验货结果
              //   for (let j = 0; j < item.storeInDetailSNs.length; j++) {
              //     if (item.storeInDetailSNs[j]._status != 'Delete')
              //       item.storeInDetailSNs[j].sninspect = 1;
              //   }
              // }
              newRows.push(item);
            }
          });

          datas.details = newRows;
          argsdata.data.data = JSON.stringify(datas);

          inspectionFlag = false;
          returnPromise.resolve();
        };

        var cancelSave = function () {
          returnPromise.reject();
        };

        if (inspectionFlag && progressData[0] != 100) {

          cb.utils.confirm('待入库数量和入库数量匹配有差异,请确认是否终止验货并保存?', confirmSave, cancelSave);
          return returnPromise;
        }

      });

      let params = viewmodel.getParams();
      // eslint-disable-next-line no-undef
      let mode = params && params.mode || env.VOUCHER_STATE_BROWSE;
      // let gridModel = viewmodel.getGridModel();
      if (mode === "browse") {
        if (viewmodel.get("btnSave")) {
          viewmodel.get("btnSave").setVisible(false);
        }
        if (viewmodel.get("btnAbandon")) {
          viewmodel.get("btnAbandon").setVisible(false);
        }
      }
      if (mode === "add") {
        if (viewmodel.get("btnMoveprev")) {
          viewmodel.get("btnMoveprev").setVisible(false);
        }
        if (viewmodel.get("btnMovenext")) {
          viewmodel.get("btnMovenext").setVisible(false);
        }
      }
    }
  }
  try {
    module.exports = ST_st_storein_VM_Extend;
  } catch (error) {

  }
  return ST_st_storein_VM_Extend;
});
