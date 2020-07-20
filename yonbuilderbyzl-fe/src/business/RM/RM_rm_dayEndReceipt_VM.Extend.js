cb.define([], function() {
	var RM_rm_dayEndReceipt_VM_Extend = {
		doAction: function(name, viewmodel) {
			if (this[name]) {
				this[name](viewmodel);
			}
		},

		/* 设置行号 */
		setRowCount: function(viewmodel, a, b, c) {
			if (a != null && b != null && c != null) {
				var maxRowCount = Math.max(a, b, c);
				viewmodel.get('daySalesType').setState('calcHeightByRowCount', maxRowCount);
				viewmodel.get('dayPayMethod').setState('calcHeightByRowCount', maxRowCount);
				viewmodel.get('dayOutStorage').setState('calcHeightByRowCount', maxRowCount);
			}
		},

		/* 获取报表数据 */
		getReportData: function(viewmodel, paramModel, billnum) {
			/* const posCode = localStorage.getItem('billing_posCode') || '';
			var cMachineid = cb.rest.AppContext.device && cb.rest.AppContext.device.macaddress; */
			var self = this;
			var a, b, c;
			var orgId = cb.rest.AppContext.user.orgId;
			var storeId = cb.rest.AppContext.user.storeId;
			var dayEndTime = viewmodel.get("dayEndTime").getValue();
			var proxy = cb.rest.DynamicProxy.create({
				settle: {
					url: 'report/list',
					method: 'POST'
				}
			});
			var mapCondition = {
				"orgId": orgId,
				"storeId": storeId,
				"dayEndTime": dayEndTime,
			};

			var param = {
				billnum: billnum,
				mapCondition: mapCondition
			};
			proxy.settle(param, function(err, result) {
				if (err) {
					cb.utils.alert(err.message, 'error');
					return;
				}
				if (result != undefined) {
					paramModel.setDataSource(result.recordList);
					if (billnum != "rm_dayproductsalelist" && billnum != "rm_dayrelatedretaillist"
					&& billnum != "rm_daydiscounttypelist") {
						a = result.recordList.length;
						self.setRowCount(viewmodel, a, b, c);
					}
				}
			});
		},

		/* 开钱箱 */
		openCashDrawer: function() {
			if (window.plus) {
				plus.JavaToJs.HardwareInterface('opencashbox');
			} else if (cb.electron.getSharedObject()) {
				cb.electron.sendOrder('openCashDrawNoCheck', function(json) {
					// callback(json);
				});
			} else {
				let url = 'http://127.0.0.1:3000/openCashDrawNoCheck';
				let params = {};
				let proxy = cb.rest.DynamicProxy.create({
					settle: {
						url: url,
						method: 'POST',
						options: {
							timeout: 30000
						}
					}
				});
				proxy.settle(params, function(err, result1) {
					if (err) {
						cb.utils.alert(err.message, 'error');
						cb.utils.alert('开钱箱失败！', 'error');
					}
				})
			}
		},

		init: function(viewmodel) {
			if (cb.rest.interMode === 'touch' || cb.rest.interMode === 'mobile') { //移动端走触屏端菜单进时逻辑
				var params = viewmodel.getParams();
				params.saveReturn = false;
				viewmodel.on('afterLoadMeta', function(args1) {
					if (!params.menuId) { //menuId为空时，不走以下代码
						return;
					}
					var promise = new cb.promise();
					var proxy = cb.rest.DynamicProxy.create({
						checkAuth: {
							url: 'user/operation/batchcheck/dayEndadd,dayEndlist',
							method: 'GET'
						},
						getFirstData: {
							url: 'bill/movefirst',
							method: 'GET'
						}
					});
					proxy.checkAuth(function(err, result) {
						if (err) {
							cb.utils.alert(err.message, 'error');
							return;
						}
						if (result.dayEndadd) {
							promise.resolve();
							return;
						}
						if (result.dayEndlist) {
							proxy.getFirstData({
								billnum: params.billNo
							}, function(err1, result1) {
								if (err1) {
									cb.utils.alert(err1.message, 'error');
									return;
								}
								params.mode = 'browse';
								params.billData = result1;
								promise.resolve();
							});
						}
					});
					return promise;
				});
			}

			/* 查看历史日结 */
			viewmodel.on('dayEndHistory', function() {
				cb.loader.runCommandLine('bill', {
					billtype: 'voucherlist',
					billno: viewmodel.getParams().billNo + 'list'
				}, viewmodel);
			});

			/* 销售类型汇总 */
			viewmodel.get('daySalesType').setState('showAggregates', 'local'); //合计
			viewmodel.get('daySalesType').setState('showRowNo', false); //行号
			viewmodel.get('daySalesType').setState('showColumnSetting', false); //栏目设置
			viewmodel.get('daySalesType').setState('multiSort', false);

			/* 收款方式汇总 */
			viewmodel.get('dayPayMethod').setState('showAggregates', 'local');
			viewmodel.get('dayPayMethod').setState('showRowNo', false);
			viewmodel.get('dayPayMethod').setState('showColumnSetting', false);
			viewmodel.get('dayPayMethod').setState('multiSort', false);

			/* 出入库明细汇总 */
			viewmodel.get('dayOutStorage').setState('showAggregates', 'local');
			viewmodel.get('dayOutStorage').setState('showRowNo', false);
			viewmodel.get('dayOutStorage').setState('showColumnSetting', false);
			viewmodel.get('dayOutStorage').setState('multiSort', false);

			/* 商品汇总 */
			viewmodel.get('dayProductSale').setState('showAggregates', 'local');
			// viewmodel.get('dayProductSale').setState('showRowNo', false);
			viewmodel.get('dayProductSale').setState('showColumnSetting', false);
			viewmodel.get('dayProductSale').setState('multiSort', false);

			/* 日结相关零售单 */
			viewmodel.get('dayEndRelatedRetail').setState('showAggregates', false);
			viewmodel.get('dayEndRelatedRetail').setState('showColumnSetting', false);
			viewmodel.get('dayEndRelatedRetail').setState('multiSort', false);

			/* 优惠汇总 */
			viewmodel.get('dayDiscountType').setState('showAggregates', 'local');
			viewmodel.get('dayDiscountType').setState('showColumnSetting', false);
			viewmodel.get('dayDiscountType').setState('multiSort', false);

			//viewmodel.get('daySalesType').setShowSubtotal(true);
			//viewmodel.get('dayPayMethod').setShowSubtotal(true);
			//viewmodel.get('dayOutStorage').setShowSubtotal(true);

			var self = this;
			var daySalesTypeLen = 0,
				dayPayMethodLen = 0,
				dayOutStorageLen = 0;
			viewmodel.get('daySalesType').on('afterSetDataSource', function(dataSource) {
				daySalesTypeLen = dataSource.length ? dataSource.length : 0;
				self.setRowCount(viewmodel, daySalesTypeLen, dayPayMethodLen, dayOutStorageLen);
			});
			viewmodel.get('dayPayMethod').on('afterSetDataSource', function(dataSource) {
				dayPayMethodLen = dataSource.length ? dataSource.length : 0;
				self.setRowCount(viewmodel, daySalesTypeLen, dayPayMethodLen, dayOutStorageLen);
			});
			viewmodel.get('dayOutStorage').on('afterSetDataSource', function(dataSource) {
				dayOutStorageLen = dataSource.length ? dataSource.length : 0;
				self.setRowCount(viewmodel, daySalesTypeLen, dayPayMethodLen, dayOutStorageLen);
			});

			var daySalesTypeModel = viewmodel.get('daySalesType');
			var dayPayMethodModel = viewmodel.get('dayPayMethod');
			var dayOutStorageModel = viewmodel.get('dayOutStorage');
			var dayProductSaleModel = viewmodel.get('dayProductSale');
			var dayEndRelatedRetailModel = viewmodel.get('dayEndRelatedRetail');
			var dayDiscountTypeModel = viewmodel.get('dayDiscountType');
			viewmodel.on('afterLoadData', function() {
				var mode = viewmodel.getParams().mode;
				/* var myDate = new Date().format('yyyy-MM-dd hh:mm:ss');
				if (mode == "add" && viewmodel.get("dayEndTime")) {
					viewmodel.get("dayEndTime").setValue(myDate);
				} */
				if (viewmodel.get('btnDayEndHistory') && viewmodel.getCache('entryMode') !== 'add')
					viewmodel.get('btnDayEndHistory').setVisible(false);

				/* 触屏不显示:库存日报按钮 */
				if (cb.rest.interMode === 'touch') {
					viewmodel.get('saleReportName').setVisible(false);
					viewmodel.get('stockReportName').setVisible(false);
					viewmodel.get('dayPayMethod').setColumnState('actualAmount', 'bShowIt', false);
				}
				/*移动端新增态状态栏颜色控制*/
				if (cb.rest.interMode === 'mobile') {
					if (viewmodel.getParams().mode === 'add') {
						cb.utils.setStatusBarStyle("dark");
					}
				}

				if (viewmodel.getParams().mode !== 'add') return;
				viewmodel.get('daySalesType').setReadOnly(true);
				//viewmodel.get('dayPayMethod').setReadOnly(true);
				viewmodel.get('dayOutStorage').setReadOnly(true);
				viewmodel.get('dayProductSale').setReadOnly(true);
				viewmodel.get('dayEndRelatedRetail').setReadOnly(true);
				viewmodel.get('dayDiscountType').setReadOnly(true);

				var a, b, c;
				var orgId = cb.rest.AppContext.user.orgId;
				var tenantId = cb.rest.AppContext.user.tenant;
				var userId = (cb.rest.AppContext.user || {}).id;
				var storeId = cb.rest.AppContext.user.storeId;
				var currentDate = new Date().format('yyyy-MM-dd');
				//viewmodel.get('startDate').setValue(currentDate + ' 00:00:00');

				/* 销售类型汇总 */
				self.getReportData(viewmodel, daySalesTypeModel, "rm_daysalestypelist");

				/* 收款方式汇总 */
				self.getReportData(viewmodel, dayPayMethodModel, "rm_daypaymethodlist");

				/* 出入库汇总 */
				self.getReportData(viewmodel, dayOutStorageModel, "rm_dayoutstoragelist");

				/* 商品销售汇总 */
				self.getReportData(viewmodel, dayProductSaleModel, "rm_dayproductsalelist");

				/* 日结相关零售单 */
				self.getReportData(viewmodel, dayEndRelatedRetailModel, "rm_dayrelatedretaillist");

				/* 优惠汇总 */
				self.getReportData(viewmodel, dayDiscountTypeModel, "rm_daydiscounttypelist");
			});

			var self = this;
			var report_id = 0;
			var report_name = '';
			viewmodel.on("afterSave", function(args) {
				if (args.err) return;
				if (args.params.cItemName === 'btnDayEndAndPreview')
					viewmodel.biz.do('localprint', viewmodel);
				if (args.params.cItemName === 'btnDayEndSaveAndPrint')
					viewmodel.biz.do('localprint', viewmodel);
				// 保存后，调用上传接口
				var param = {
					billnum: "rm_dayEndReceipt",
					data: JSON.stringify([{
						"id": "22121"
					}])
				};
				var proxy = cb.rest.DynamicProxy.create({
					ensure: {
						url: "/bill/batchaudit",
						method: "POST"
					}
				});
				proxy.ensure(param, function(err, result) {
					console.log("ssss");
				});
			});

			/* 库存日报 */
			viewmodel.on('stockQuery', function() {
				report_id = viewmodel.get('stockReportId').getValue();
				if (report_id > 0) {
					viewmodel.communication({
						type: 'menu',
						payload: {
							menuCode: 'SJ0201',
							carryData: {
								query: {
									key: 'reportId',
									value: report_id
								},
								title: viewmodel.get('stockReportName').getValue()
							}
						}
					});
					return;
				}
				var proxy = cb.rest.DynamicProxy.create({
					settle: {
						url: 'report/publish',
						method: 'POST'
					}
				});
				var groupSchemaId = cb.rest.AppContext.option.dailyInventoryDailyPlan;
				var simpleVOs = [];
				var defwhere = {};
				defwhere['field'] = 'iStoreID';
				defwhere['value1'] = cb.rest.AppContext.user.storeId;
				defwhere['op'] = 'eq';
				simpleVOs.push(defwhere);
				var filterVO = {
					"simpleVOs": simpleVOs,
					"isExtend": true
				};
				var params = {
					billnum: "stock_stockanalysis",
					reportName: "日结单库存日报_" + viewmodel.get('createTime').getValue(),
					condition: filterVO
				};
				if (groupSchemaId > 0) {
					params.groupSchemaId = groupSchemaId;
				} else {
					params.groupSchemaName = "日结库存";
				}
				proxy.settle(params, function(err, result) {
					if (err) {
						cb.utils.alert(err.message, 'error');
						return;
					}
					if (result != undefined) {
						viewmodel.get('stockReportId').setValue(result.id);
						viewmodel.get('stockReportName').setValue(result.name);

						viewmodel.communication({
							type: 'menu',
							payload: {
								menuCode: 'SJ0201',
								carryData: {
									query: {
										key: 'reportId',
										value: result.id
									},
									title: result.name
								}
							}
						});
					}
				});
			});

			/* 销售日报 */
			viewmodel.on('saleQuery', function() {
				report_id = viewmodel.get('saleReportId').getValue();
				if (report_id > 0) {
					viewmodel.communication({
						type: 'menu',
						payload: {
							menuCode: 'SJ0106',
							carryData: {
								query: {
									key: 'reportId',
									value: report_id
								},
								title: viewmodel.get('saleReportName').getValue()
							}
						}
					});
					return;
				}
				var proxy = cb.rest.DynamicProxy.create({
					settle: {
						url: 'report/publish',
						method: 'POST'
					}
				});
				var simpleVOs = [];
				var defwhere = {};
				defwhere['field'] = 'fbitSettle';
				defwhere['value1'] = 0;
				defwhere['op'] = 'eq';
				simpleVOs.push(defwhere);
				/*	     defwhere = {};
				       defwhere['field'] = 'iPresellState';
				       defwhere['value1'] = 5;
				       defwhere['op'] = 'neq';
				       simpleVOs.push(defwhere);
					   */
				var storeid = cb.rest.AppContext.user.storeId;
				defwhere = {};
				defwhere['field'] = 'store';
				defwhere['value1'] = storeid;
				defwhere['op'] = 'eq';
				simpleVOs.push(defwhere);
				var filterVO = {
					"simpleVOs": simpleVOs,
					"isExtend": true
				};
				var params = {
					billnum: "rm_salereceipts_report",
					reportName: "日结单销售日报_" + viewmodel.get('createTime').getValue(),
					condition: filterVO,
					groupSchemaName: "待日结数据"
				};
				proxy.settle(params, function(err, result) {
					if (err) {
						cb.utils.alert(err.message, 'error');
						return;
					}
					if (result != undefined) {
						viewmodel.get('saleReportId').setValue(result.id);
						viewmodel.get('saleReportName').setValue(result.name);

						viewmodel.communication({
							type: 'menu',
							payload: {
								menuCode: 'SJ0106',
								carryData: {
									query: {
										key: 'reportId',
										value: result.id
									},
									title: result.name
								}
							}
						});
					}
				});
			});

			viewmodel.on('beforeSave',function(data){
				var saveData = JSON.parse(data.data.data);
				let dayPayMethod = saveData.dayPayMethod;
				dayPayMethod && dayPayMethod.forEach(function (item) {
					if(item._status == "Update"){
						item._status = "Unchanged";
					}
				});
				data.data.data = JSON.stringify(saveData);
			});

			/* 开钱箱 */
			viewmodel.on('openCashDrawer', function() {
				self.openCashDrawer();
			});
		},
	}
	try {
		module.exports = RM_rm_dayEndReceipt_VM_Extend;
	} catch (error) {}
	return RM_rm_dayEndReceipt_VM_Extend;
});

//////////////////
// WEBPACK FOOTER
// ./src/client/business/RM/RM_rm_dayEndReceipt_VM.Extend.js
// module id = 577
// module chunks = 0
