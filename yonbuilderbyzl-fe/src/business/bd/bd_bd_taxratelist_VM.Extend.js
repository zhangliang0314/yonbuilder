cb.define(['common/common_VM.Extend.js'], function (common) {
    var bd_bd_taxratelist_VM_Extend = {
        doAction: function (name, viewmodel) {
            if (this[name])
                this[name](viewmodel);
        },
        init: function (viewmodel) {
            let gridModel = viewmodel.getGridModel();
            gridModel.on('afterSetDataSource', () => {
                const rows = gridModel.getRows();
                const actions = gridModel.getCache('actions');
                const actionsStates = [];
                rows.forEach(data => {
                    const actionState = {};
                    actions.forEach(action => {
                        if (action.cItemName == "btnStop") {

                            if (data.enable == 0 || data.enable == 2) {
                                actionState[action.cItemName] = { visible: false };
                            }
                            else {
                                actionState[action.cItemName] = { visible: true };
                            }
                        } else if (action.cItemName == "btnUnstop") {
                            if (data.enable == 1) {
                                actionState[action.cItemName] = { visible: false };
                            }
                            else {
                                actionState[action.cItemName] = { visible: true };
                            }
                        }
                        else {
                            actionState[action.cItemName] = { visible: true };
                        }
                    });
                    actionsStates.push(actionState);
                });
                gridModel.setActionsState(actionsStates);
            }); 
            //批量停用
            
            viewmodel.on('batchclose', function (args) {
                var selectedRows = viewmodel.getGridModel().getSelectedRows();
                if (selectedRows == undefined || selectedRows.length == 0) {
                    cb.utils.alert('未选税率记录！', 'warning');
                    return false;
                }

                var url = '/bill/batchDo?action=stop';
                var proxy = cb.rest.DynamicProxy.create({
                    ensure: {
                        url: url,
                        method: 'POST'
                    }
                });

                var datas = [];
                var length = selectedRows.length;
                for (var i = 0; i < length; i++) {
                    datas.push(
                       // "id": selectedRows[i]["id"],
                         selectedRows[i]
                    );
                }
                var params = {
                    billnum: "bd_taxratelist",
                    data: JSON.stringify(datas)
                }
                proxy.ensure(params, function (err, result) {
                    if (result.messages.length != 0) {
                        cb.utils.alert(result.messages[0], 'error');
                        return;
                    }
                    cb.utils.alert('操作成功', 'success');
                    viewmodel.execute('refresh');
                });
            });
            //批量启用
            viewmodel.on('batchopen', function (args) {
                var selectedRows = viewmodel.getGridModel().getSelectedRows();
                if (selectedRows == undefined || selectedRows.length == 0) {
                    cb.utils.alert('未选税率记录！', 'warning');
                    return false;
                }

                var url = '/bill/batchDo?action=unstop';
                var proxy = cb.rest.DynamicProxy.create({
                    ensure: {
                        url: url,
                        method: 'POST'
                    }
                });

                var datas = [];
                var length = newFunction(selectedRows);
                for (var i = 0; i < length; i++) {
                    datas.push({
                        "id": selectedRows[i]["id"],
                    });
                }
                var params = {
                    billnum: "bd_taxratelist",
                    data: JSON.stringify(datas)
                }
                proxy.ensure(params, function (err, result) {
                    if (result.messages.length!=0) {
                        cb.utils.alert(result.messages[0], 'error');
                        return;
                    }
                    cb.utils.alert('操作成功', 'success');
                    viewmodel.execute('refresh');
                });
            });           
            
        }
    }
    try {
        module.exports = bd_bd_taxratelist_VM_Extend;
    } catch (error) {

    }
    return bd_bd_taxratelist_VM_Extend;
});
function newFunction(selectedRows) {
    return selectedRows.length;
}

