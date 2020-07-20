cb.define([], function () {
	var RM_rm_retailvouchlist_VM_Extend = {

		doAction: function (name, viewmodel) {
			if (this[name]) {
				this[name](viewmodel);
			}
		},
		updateRetailState: function (viewmodel, codes) {
			//获取当前操作员名称，和选中的记录的code值
			var employname = cb.rest.AppContext.user.name;

			var params = {
				codes: codes,
				ename: employname
			};
			//调用后台update服务
			var url = '/yxyStoreEletroinvoic/updateRetailState';
			var proxy = cb.rest.DynamicProxy.create({
				settle: {
					url: url,
					method: "POST"
				}
			});

			proxy.settle(params, function (err, result) {
				if (err) {
					cb.utils.alert(err.message, 'error');
					return;
				}
				cb.utils.alert('共更新' + result + '张零售单的开票状态!');
				//刷新页面
				viewmodel.execute('refresh');
			});

		},
		init: function (viewmodel) {
			viewmodel.on('processstatus', function(args){
				var code = viewmodel.getGridModel().getRows()[args.params.index].code;
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

			// viewmodel.on('processstatus', function(data){
			// 	let code = data.params;
			// 	// var code = viewmodel.get('cCode').getValue();
			// 	var params = {
			// 		mode: 'edit',
			// 		readOnly: true,
			// 		id: code
			// 	};
			// 	var data = {
			// 		billtype: 'voucher',
			// 		billno: 'rm_processingstatus',
			// 		params: params
			// 	};
			// 	cb.loader.runCommandLine('bill', data, viewmodel)
			// });

			var self = this;
			if (viewmodel.get('btnAdd'))
				viewmodel.get('btnAdd').setVisible(false);
			let gridModel = viewmodel.getGridModel();
			gridModel.on('afterSetDataSource', () => {
				const rows = gridModel.getRows();
				const actions = gridModel.getCache('actions');
				if (!actions) return;
				const actionsStates = [];
				rows.forEach(data => {
					const actionState = {};
					actions.forEach(action => {
						actionState[action.cItemName] = { visible: true };
						if(action.cItemName == 'btnDelete'){ //金额调整的零售单，且未生成日报，已收款金额为0的才显示删除按钮
							actionState[action.cItemName] = { visible: false };
							//if(data.bAmountAdjustment && !data.fbitReport && data.fPresellPayMoney == 0){
							//未日结的  待收款的才显示
							if(!data.fbitReport && data.fPresellPayMoney == 0 && data.iPayState==2){
								actionState[action.cItemName] = { visible: true };
							}
						}
						// fbitSettle ==> fbitReport "日结状态"改成根据“日报状态”来判断
						if (data.fbitReport) {
							actionState["btnEdit"] = { visible: false };
						}

						if (cb.rest.AppContext.option.ERPsysaddress == 4 && data.iTakeway == 2 && data.fbitReport == 1) {
							actionState["btnProcessStatus"] = { visible: true };
						}else{
							actionState["btnProcessStatus"] = { visible: false };
						}

					});
					actionsStates.push(actionState);
				});
				gridModel.setActionsState(actionsStates);
			});

			gridModel.on('beforeLoad', function (data) {
				var common = data.condition.commonVOs;
				data.isDistinct = true;
				if (common != undefined && common.length > 0) {
					var datas = [];
					common.forEach(function (item) {
						if (!((item.itemName == "iNegative" && item.value1 == "-1") || (item.itemName == "iDeliveryState" && item.value1 == "-1"))) {
							datas.push(item);
						}
					});
					data.condition.commonVOs = datas;
				}
			});

			//点击批量开票完成按钮时逻辑
			if (viewmodel.get('btnMakeInvoice')) {
				viewmodel.get('btnMakeInvoice').on('click', function () {
					var selectedRows = viewmodel.getGridModel().getSelectedRows();
					if (selectedRows == null || selectedRows.length < 1) {
						cb.utils.alert('请先勾选要操作的记录！');
						return false;
					} else {
						//在弹出模态框前，判断是否有记录需要修改
						var length = selectedRows.length;
						var codes = [];
						for (var i = 0; i < length; i++) {
							if (selectedRows[i]["iEInvoiceState"] != 3) {
								codes.push(selectedRows[i]["code"]);
							}
						}

						if (codes.length < 1) {
							cb.utils.alert('记录行中无记录需要修改!');
							return false;

						} else {
							//弹出模态框
							cb.utils.confirm('此操作不能恢复，所选零售单是否已开票完毕？', function () {
								//点击确认后，取参数，调后台
								self.updateRetailState(viewmodel, codes);
							}, function () {
							});

						}

					}

				});
			}

		},

	}
	try {
		module.exports = RM_rm_retailvouchlist_VM_Extend;
	} catch (error) {

	}
	return RM_rm_retailvouchlist_VM_Extend;
});
