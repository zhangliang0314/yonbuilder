//voucherlist

console.info('%c AXT000069_5111842dList_VM js init', 'color:green');
cb.viewmodels.register('AXT000069_5111842dList_VM', function(modelType) {

    var model = function(data) {
        cb.models.ContainerModel.call(this, data);
        this.init();
    };
    model.prototype = cb.utils.getPrototype(cb.models.ContainerModel.prototype);
    model.prototype.modelType = modelType;

    model.prototype.init = function() {
        var _this = this;
        var fields = {


            'button5n': new cb.models.SimpleModel({
                "cItemName": "button5n",
                "cCaption": "后端函数测试",
                "cShowCaption": "后端函数测试",
                "cControlType": "button",
                "iStyle": 0,
                "cCommand": "button5n_customDo",
                "bVmExclude": 0,
                "iOrder": 0,
                "uncopyable": false,
                "bEnableFormat": false,
                "key": "292225",
                "cExtProps": "{\"iOrder\":0,\"key\":\"\"}",
                "needClear": false
            }),


            'btnAdd': new cb.models.SimpleModel({
                "cItemName": "btnAdd",
                "cCaption": "新增",
                "cShowCaption": "新增",
                "cControlType": "primarybutton",
                "iStyle": 0,
                "cCommand": "cmdAdd",
                "bVmExclude": 0,
                "iOrder": 0,
                "uncopyable": false,
                "bEnableFormat": false,
                "key": "292238",
                "needClear": false
            }),


            'spliter': new cb.models.SimpleModel({
                "cItemName": "spliter",
                "cCaption": "分隔栏",
                "cShowCaption": "分隔栏",
                "cControlType": "spliter",
                "iStyle": 0,
                "cCommand": "spliter",
                "bVmExclude": 0,
                "iOrder": 0,
                "uncopyable": false,
                "bEnableFormat": false,
                "key": "292227",
                "needClear": false
            }),


            'btnBatchAuditDrop': new cb.models.SimpleModel({
                "cItemName": "btnBatchAuditDrop",
                "cCaption": "审核",
                "cShowCaption": "审核",
                "cControlType": "dropdownbutton",
                "iStyle": 0,
                "cCommand": "cmdBatchAuditDrop",
                "bVmExclude": 0,
                "iOrder": 0,
                "uncopyable": false,
                "bEnableFormat": false,
                "key": "292228",
                "needClear": false
            }),


            'btnBatchAudit': new cb.models.SimpleModel({
                "cItemName": "btnBatchAudit",
                "cCaption": "审核",
                "cShowCaption": "审核",
                "cControlType": "button",
                "iStyle": 0,
                "cParent": "292228",
                "cCommand": "cmdBatchAudit",
                "bVmExclude": 0,
                "iOrder": 0,
                "uncopyable": false,
                "bEnableFormat": false,
                "key": "292229",
                "needClear": false
            }),


            'btnBatchUnaudit': new cb.models.SimpleModel({
                "cItemName": "btnBatchUnaudit",
                "cCaption": "弃审",
                "cShowCaption": "弃审",
                "cControlType": "button",
                "iStyle": 0,
                "cParent": "292228",
                "cCommand": "cmdBatchUnaudit",
                "bVmExclude": 0,
                "iOrder": 0,
                "uncopyable": false,
                "bEnableFormat": false,
                "key": "292230",
                "needClear": false
            }),


            'spliter': new cb.models.SimpleModel({
                "cItemName": "spliter",
                "cCaption": "分隔栏",
                "cShowCaption": "分隔栏",
                "cControlType": "spliter",
                "iStyle": 0,
                "cCommand": "spliter",
                "bVmExclude": 0,
                "iOrder": 0,
                "uncopyable": false,
                "bEnableFormat": false,
                "key": "292235",
                "needClear": false
            }),


            'btnImportDrop': new cb.models.SimpleModel({
                "cItemName": "btnImportDrop",
                "cCaption": "导入",
                "cShowCaption": "导入",
                "cControlType": "dropdownbutton",
                "iStyle": 0,
                "cCommand": "cmdImportDrop",
                "bVmExclude": 0,
                "iOrder": 0,
                "uncopyable": false,
                "bEnableFormat": false,
                "key": "292236",
                "needClear": false
            }),


            'btnImport': new cb.models.SimpleModel({
                "cItemName": "btnImport",
                "cCaption": "导入",
                "cShowCaption": "导入",
                "cControlType": "button",
                "iStyle": 0,
                "cParent": "292236",
                "cCommand": "cmdImport",
                "bVmExclude": 0,
                "iOrder": 0,
                "uncopyable": false,
                "bEnableFormat": false,
                "key": "292237",
                "needClear": false
            }),


            'btnTempexport': new cb.models.SimpleModel({
                "cItemName": "btnTempexport",
                "cCaption": "模板下载",
                "cShowCaption": "模板下载",
                "cControlType": "button",
                "iStyle": 0,
                "cParent": "292236",
                "cCommand": "cmdTempexport",
                "bVmExclude": 0,
                "iOrder": 0,
                "uncopyable": false,
                "bEnableFormat": false,
                "key": "292226",
                "needClear": false
            }),


            'btnExportDrop': new cb.models.SimpleModel({
                "cItemName": "btnExportDrop",
                "cCaption": "导出",
                "cShowCaption": "导出",
                "cControlType": "dropdownbutton",
                "iStyle": 0,
                "cCommand": "cmdExportDrop",
                "bVmExclude": 0,
                "iOrder": 0,
                "uncopyable": false,
                "bEnableFormat": false,
                "key": "292239",
                "needClear": false
            }),


            'btnExport': new cb.models.SimpleModel({
                "cItemName": "btnExport",
                "cCaption": "Excel导出",
                "cShowCaption": "Excel导出",
                "cControlType": "button",
                "iStyle": 0,
                "cParent": "292239",
                "cCommand": "cmdExport",
                "bVmExclude": 0,
                "iOrder": 0,
                "uncopyable": false,
                "bEnableFormat": false,
                "key": "292240",
                "needClear": false
            }),


            'spliter': new cb.models.SimpleModel({
                "cItemName": "spliter",
                "cCaption": "分隔栏",
                "cShowCaption": "分隔栏",
                "cControlType": "spliter",
                "iStyle": 0,
                "cCommand": "spliter",
                "bVmExclude": 0,
                "iOrder": 0,
                "uncopyable": false,
                "bEnableFormat": false,
                "key": "292241",
                "needClear": false
            }),


            'btnBatchDelete': new cb.models.SimpleModel({
                "cItemName": "btnBatchDelete",
                "cCaption": "删除",
                "cShowCaption": "删除",
                "cControlType": "button",
                "iStyle": 0,
                "cCommand": "cmdBatchDelete",
                "bVmExclude": 0,
                "iOrder": 0,
                "uncopyable": false,
                "bEnableFormat": false,
                "key": "292234",
                "needClear": false
            }),


            'btnEdit': new cb.models.SimpleModel({
                "cItemName": "btnEdit",
                "cCaption": "编辑",
                "cShowCaption": "编辑",
                "cControlType": "button",
                "iStyle": 0,
                "cCommand": "cmdEdit",
                "bVmExclude": 0,
                "iOrder": 0,
                "uncopyable": false,
                "bEnableFormat": false,
                "key": "292231",
                "needClear": false
            }),


            'btnDelete': new cb.models.SimpleModel({
                "cItemName": "btnDelete",
                "cCaption": "删除",
                "cShowCaption": "删除",
                "cControlType": "button",
                "iStyle": 0,
                "cCommand": "cmdBatchDelete",
                "bVmExclude": 0,
                "iOrder": 0,
                "uncopyable": false,
                "bEnableFormat": false,
                "key": "292232",
                "needClear": false
            }),


            'btnCopy': new cb.models.SimpleModel({
                "cItemName": "btnCopy",
                "cCaption": "复制",
                "cShowCaption": "复制",
                "cControlType": "button",
                "iStyle": 0,
                "cCommand": "cmdCopy",
                "bVmExclude": 0,
                "iOrder": 0,
                "uncopyable": false,
                "bEnableFormat": false,
                "key": "292233",
                "needClear": false
            }),


            'shiczyq008_at_yy001_at_st001_1739274995175680': new cb.models.GridModel({
                "columns": {
                    "new1": {
                        "cFieldName": "new1",
                        "cItemName": "new1",
                        "cCaption": "new1",
                        "cShowCaption": "new1",
                        "iBillEntityId": 27784,
                        "iBillTplGroupId": 148689,
                        "iTplId": 20530,
                        "iMaxLength": 200,
                        "iFieldType": 1,
                        "cEnumType": "",
                        "bMustSelect": true,
                        "bHidden": false,
                        "bExtend": false,
                        "bCanModify": true,
                        "iColWidth": 150,
                        "bShowIt": true,
                        "bFilter": true,
                        "bIsNull": true,
                        "bJointQuery": false,
                        "cTplGroupName": "表格",
                        "bMain": true,
                        "cDataSourceName": "AXT000069.AXT000069.shiczyq008_at_yy001_at_st001",
                        "cControlType": "input",
                        "bVmExclude": 0,
                        "iOrder": 0,
                        "isshoprelated": false,
                        "iSystem": 1,
                        "authLevel": 3,
                        "isExport": true,
                        "uncopyable": false,
                        "iAlign": 1,
                        "bEnableFormat": false
                    },
                    "new2": {
                        "cFieldName": "new2",
                        "cItemName": "new2",
                        "cCaption": "new2",
                        "cShowCaption": "new2",
                        "iBillEntityId": 27784,
                        "iBillTplGroupId": 148689,
                        "iTplId": 20530,
                        "iMaxLength": 200,
                        "iFieldType": 1,
                        "cEnumType": "",
                        "bMustSelect": true,
                        "bHidden": false,
                        "bExtend": false,
                        "bCanModify": true,
                        "iColWidth": 150,
                        "bShowIt": true,
                        "bFilter": true,
                        "bIsNull": true,
                        "bJointQuery": false,
                        "cTplGroupName": "表格",
                        "bMain": true,
                        "cDataSourceName": "AXT000069.AXT000069.shiczyq008_at_yy001_at_st001",
                        "cControlType": "input",
                        "bVmExclude": 0,
                        "iOrder": 10,
                        "isshoprelated": false,
                        "iSystem": 1,
                        "authLevel": 3,
                        "isExport": true,
                        "uncopyable": false,
                        "iAlign": 1,
                        "bEnableFormat": false
                    },
                    "new3": {
                        "cFieldName": "new3",
                        "cItemName": "new3",
                        "cCaption": "new3",
                        "cShowCaption": "new3",
                        "iBillEntityId": 27784,
                        "iBillTplGroupId": 148689,
                        "iTplId": 20530,
                        "iMaxLength": 200,
                        "iFieldType": 1,
                        "cEnumType": "",
                        "bMustSelect": true,
                        "bHidden": false,
                        "bExtend": false,
                        "bCanModify": true,
                        "iColWidth": 150,
                        "bShowIt": true,
                        "bFilter": true,
                        "bIsNull": true,
                        "bJointQuery": false,
                        "cTplGroupName": "表格",
                        "bMain": true,
                        "cDataSourceName": "AXT000069.AXT000069.shiczyq008_at_yy001_at_st001",
                        "cControlType": "input",
                        "bVmExclude": 0,
                        "iOrder": 20,
                        "isshoprelated": false,
                        "iSystem": 1,
                        "authLevel": 3,
                        "isExport": true,
                        "uncopyable": false,
                        "iAlign": 1,
                        "bEnableFormat": false
                    },
                    "autotest": {
                        "cFieldName": "autotest",
                        "cItemName": "autotest",
                        "cCaption": "autotest",
                        "cShowCaption": "autotest",
                        "iBillEntityId": 27784,
                        "iBillTplGroupId": 148689,
                        "iTplId": 20530,
                        "iMaxLength": 200,
                        "iFieldType": 1,
                        "cEnumType": "",
                        "bMustSelect": true,
                        "bHidden": false,
                        "bExtend": false,
                        "bCanModify": true,
                        "iColWidth": 150,
                        "bShowIt": true,
                        "bFilter": true,
                        "bIsNull": true,
                        "bJointQuery": false,
                        "cTplGroupName": "表格",
                        "bMain": true,
                        "cDataSourceName": "AXT000069.AXT000069.shiczyq008_at_yy001_at_st001",
                        "cControlType": "input",
                        "bVmExclude": 0,
                        "iOrder": 30,
                        "isshoprelated": false,
                        "iSystem": 1,
                        "authLevel": 3,
                        "isExport": true,
                        "uncopyable": false,
                        "iAlign": 1,
                        "bEnableFormat": false
                    },
                    "dr": {
                        "cFieldName": "dr",
                        "cItemName": "dr",
                        "cCaption": "删除标记",
                        "cShowCaption": "删除标记",
                        "iBillEntityId": 27784,
                        "iBillTplGroupId": 148689,
                        "iTplId": 20530,
                        "iMaxLength": 4,
                        "iFieldType": 1,
                        "cEnumType": "",
                        "bMustSelect": true,
                        "bHidden": true,
                        "bExtend": false,
                        "iNumPoint": 2,
                        "bCanModify": true,
                        "iColWidth": 150,
                        "bShowIt": false,
                        "bFilter": true,
                        "bIsNull": true,
                        "bJointQuery": false,
                        "cTplGroupName": "表格",
                        "bMain": true,
                        "cDataSourceName": "AXT000069.AXT000069.shiczyq008_at_yy001_at_st001",
                        "cControlType": "inputnumber",
                        "bVmExclude": 0,
                        "iOrder": 40,
                        "isshoprelated": false,
                        "iSystem": 1,
                        "authLevel": 3,
                        "isExport": true,
                        "uncopyable": false,
                        "iAlign": 1,
                        "bEnableFormat": false
                    },
                    "tenant_id": {
                        "cFieldName": "tenant_id",
                        "cItemName": "tenant_id",
                        "cCaption": "租户id",
                        "cShowCaption": "租户id",
                        "iBillEntityId": 27784,
                        "iBillTplGroupId": 148689,
                        "iTplId": 20530,
                        "iMaxLength": 256,
                        "iFieldType": 1,
                        "cEnumType": "",
                        "bMustSelect": true,
                        "bHidden": true,
                        "bExtend": false,
                        "bCanModify": true,
                        "iColWidth": 150,
                        "bShowIt": false,
                        "bFilter": true,
                        "bIsNull": true,
                        "bJointQuery": false,
                        "cTplGroupName": "表格",
                        "bMain": true,
                        "cDataSourceName": "AXT000069.AXT000069.shiczyq008_at_yy001_at_st001",
                        "cControlType": "input",
                        "bVmExclude": 0,
                        "iOrder": 50,
                        "isshoprelated": false,
                        "iSystem": 1,
                        "authLevel": 3,
                        "isExport": true,
                        "uncopyable": false,
                        "iAlign": 1,
                        "bEnableFormat": false
                    },
                    "org_id": {
                        "cFieldName": "org_id",
                        "cItemName": "org_id",
                        "cCaption": "组织",
                        "cShowCaption": "组织",
                        "iBillEntityId": 27784,
                        "iBillTplGroupId": 148689,
                        "iTplId": 20530,
                        "iMaxLength": 256,
                        "iFieldType": 1,
                        "cEnumType": "",
                        "bMustSelect": true,
                        "bHidden": true,
                        "bExtend": false,
                        "bCanModify": true,
                        "iColWidth": 150,
                        "bShowIt": false,
                        "bFilter": true,
                        "bIsNull": true,
                        "bJointQuery": false,
                        "cTplGroupName": "表格",
                        "bMain": true,
                        "cDataSourceName": "AXT000069.AXT000069.shiczyq008_at_yy001_at_st001",
                        "cControlType": "input",
                        "bVmExclude": 0,
                        "iOrder": 60,
                        "isshoprelated": false,
                        "iSystem": 1,
                        "authLevel": 3,
                        "isExport": true,
                        "uncopyable": false,
                        "iAlign": 1,
                        "bEnableFormat": false
                    },
                    "id": {
                        "cFieldName": "id",
                        "cItemName": "id",
                        "cCaption": "ID",
                        "cShowCaption": "ID",
                        "iBillEntityId": 27784,
                        "iBillTplGroupId": 148689,
                        "iTplId": 20530,
                        "iMaxLength": 36,
                        "iFieldType": 1,
                        "cEnumType": "",
                        "bMustSelect": true,
                        "bHidden": true,
                        "bExtend": false,
                        "bCanModify": true,
                        "iColWidth": 150,
                        "bShowIt": false,
                        "bFilter": true,
                        "bIsNull": true,
                        "bJointQuery": true,
                        "cTplGroupName": "表格",
                        "bMain": true,
                        "cDataSourceName": "AXT000069.AXT000069.shiczyq008_at_yy001_at_st001",
                        "cControlType": "input",
                        "bVmExclude": 0,
                        "iOrder": 70,
                        "isshoprelated": false,
                        "iSystem": 1,
                        "authLevel": 3,
                        "isExport": true,
                        "uncopyable": false,
                        "iAlign": 1,
                        "bEnableFormat": false
                    },
                    "pubts": {
                        "cFieldName": "pubts",
                        "cItemName": "pubts",
                        "cCaption": "时间戳",
                        "cShowCaption": "时间戳",
                        "iBillEntityId": 27784,
                        "iBillTplGroupId": 148689,
                        "iTplId": 20530,
                        "iMaxLength": 255,
                        "iFieldType": 1,
                        "cEnumType": "",
                        "bMustSelect": true,
                        "bHidden": true,
                        "bExtend": false,
                        "bCanModify": true,
                        "iColWidth": 150,
                        "bShowIt": false,
                        "bFilter": true,
                        "bIsNull": true,
                        "bJointQuery": false,
                        "cOrder": "desc",
                        "cTplGroupName": "表格",
                        "bMain": true,
                        "cDataSourceName": "AXT000069.AXT000069.shiczyq008_at_yy001_at_st001",
                        "cControlType": "datepicker",
                        "bVmExclude": 0,
                        "iOrder": 80,
                        "isshoprelated": false,
                        "iSystem": 1,
                        "authLevel": 3,
                        "isExport": true,
                        "uncopyable": false,
                        "iAlign": 1,
                        "bEnableFormat": false
                    }
                },
                "dataSourceMode": "remote",
                "showCheckBox": true,
                "showAggregates": false
            }),


            'params': {
                "billNo": "5111842dList",
                "billType": "VoucherList",
                "filterId": "6983",
                "hasDataSource": true
            },

        };
        this.setData(fields);
        this.setDirty(false);



        var billType = "voucherlist" || 'voucherlist';
        var biz;
        if (billType == 'editvoucherlist' || billType == 'edittreevoucherlist') {
            biz = cb.biz.common['editvoucherlist'];
        } else {
            biz = cb.biz.common.voucherlist;
        }


        //common events start
        //actions

        _this.allActions = [{
            "cCommand": "cmdPdfexport",
            "cAction": "batchoutput",
            "cSvcUrl": "/bill/pdfexport",
            "cHttpMethod": "POST",
            "cExtProps": "{\"title\":\"PDF导出\"}"
        }, {
            "cCommand": "button5n_customDo",
            "cAction": "customDo",
            "cSvcUrl": "/custom/do/button5n_customDo",
            "cHttpMethod": "",
            "cRuleId": "",
            "cTarget": "",
            "cParameter": "null"
        }, {
            "cCommand": "cmdExport",
            "cAction": "batchoutput",
            "cSvcUrl": "/bill/export",
            "cHttpMethod": "POST",
            "cExtProps": "{\"title\":\"Excel导出\"}"
        }, {
            "cCommand": "cmdAdd",
            "cAction": "add",
            "cSvcUrl": "/bill/add",
            "cHttpMethod": "GET",
            "cExtProps": "{\"title\":\"新增\"}"
        }, {
            "cCommand": "cmdBizFlowBatchPush",
            "cAction": "bizflowbatchpush",
            "cSvcUrl": "/bizflow/batchPush",
            "cHttpMethod": "POST",
            "cExtProps": "{\"title\":\"批量下推\"}"
        }, {
            "cCommand": "cmdBatchAudit",
            "cAction": "batchaudit",
            "cSvcUrl": "/bill/batchaudit",
            "cHttpMethod": "POST",
            "cExtProps": "{\"title\":\"批量审核\"}"
        }, {
            "cCommand": "cmdBatchUnaudit",
            "cAction": "batchunaudit",
            "cSvcUrl": "/bill/batchunaudit",
            "cHttpMethod": "POST",
            "cExtProps": "{\"title\":\"批量弃审\"}"
        }, {
            "cCommand": "cmdImport",
            "cAction": "batchimport",
            "cSvcUrl": "/bill/billImport",
            "cHttpMethod": "POST",
            "cExtProps": "{\"title\":\"导入\"}"
        }, {
            "cCommand": "cmdTempexport",
            "cAction": "tempexport",
            "cSvcUrl": "/billtemp/export",
            "cHttpMethod": "POST",
            "cExtProps": "{\"title\":\"模板下载\"}"
        }, {
            "cCommand": "cmdEdit",
            "cAction": "edit",
            "cSvcUrl": "/bill/edit",
            "cHttpMethod": "GET",
            "cExtProps": "{\"title\":\"编辑\"}"
        }, {
            "cCommand": "cmdCopy",
            "cAction": "copy",
            "cSvcUrl": "/bill/copy",
            "cHttpMethod": "POST",
            "cExtProps": "{\"title\":\"复制\"}"
        }, {
            "cCommand": "cmdBatchUnSubmit",
            "cAction": "batchdo",
            "cSvcUrl": "/bill/batchDo?action=unsubmit",
            "cHttpMethod": "POST",
            "cExtProps": "{\"title\":\"批量撤回\"}"
        }, {
            "cCommand": "cmdBatchDelete",
            "cAction": "batchdelete",
            "cSvcUrl": "/bill/batchdelete",
            "cHttpMethod": "POST",
            "cExtProps": "{\"title\":\"批量删除\"}"
        }, {
            "cCommand": "cmdBatchSubmit",
            "cAction": "batchsubmit",
            "cSvcUrl": "/bill/batchsubmit",
            "cHttpMethod": "POST",
            "cExtProps": "{\"title\":\"批量提交\"}"
        }];




        _this.get('button5n').on('click', function(params) {
            var args = cb.utils.extend(true, {}, {
                "cmdParameter": "null",
                "cCommand": "button5n_customDo",
                "cAction": "customDo",
                "cSvcUrl": "/custom/do/button5n_customDo",
                "cHttpMethod": "",
                "cRuleId": "",
                "cTarget": "",
                "cParameter": "null",
                "cItemName": "button5n",
                "cCaption": "后端函数测试",
                "cShowCaption": "后端函数测试",
                "cControlType": "button",
                "iStyle": 0,
                "bVmExclude": 0,
                "iOrder": 0,
                "uncopyable": false,
                "bEnableFormat": false,
                "key": "292225",
                "cExtProps": "{\"iOrder\":0,\"key\":\"\"}",
                "needClear": false
            }, {
                key: 'button5n'
            }, {
                params: params
            });
            args.cShowCaption = this._get_data('cShowCaption');
            args.cCaption = this._get_data('cCaption');

            var self = this;
            args.disabledCallback = function() {
                self.setDisabled(true);
            }
            args.enabledCallback = function() {
                self.setDisabled(false);
            }

            biz.do('customDo', _this, args)
        });


        _this.get('btnExport').on('click', function(params) {
            var args = cb.utils.extend(true, {}, {
                "cCommand": "cmdExport",
                "cAction": "batchoutput",
                "cSvcUrl": "/bill/export",
                "cHttpMethod": "POST",
                "cExtProps": "{\"title\":\"Excel导出\"}",
                "cItemName": "btnExport",
                "cCaption": "Excel导出",
                "cShowCaption": "Excel导出",
                "cControlType": "button",
                "iStyle": 0,
                "cParent": "292239",
                "bVmExclude": 0,
                "iOrder": 0,
                "uncopyable": false,
                "bEnableFormat": false,
                "key": "292240",
                "needClear": false
            }, {
                key: 'btnExport'
            }, {
                params: params
            });
            args.cShowCaption = this._get_data('cShowCaption');
            args.cCaption = this._get_data('cCaption');

            var self = this;
            args.disabledCallback = function() {
                self.setDisabled(true);
            }
            args.enabledCallback = function() {
                self.setDisabled(false);
            }

            biz.do('batchoutput', _this, args)
        });


        _this.get('btnAdd').on('click', function(params) {
            var args = cb.utils.extend(true, {}, {
                "cCommand": "cmdAdd",
                "cAction": "add",
                "cSvcUrl": "/bill/add",
                "cHttpMethod": "GET",
                "cExtProps": "{\"title\":\"新增\"}",
                "cItemName": "btnAdd",
                "cCaption": "新增",
                "cShowCaption": "新增",
                "cControlType": "primarybutton",
                "iStyle": 0,
                "bVmExclude": 0,
                "iOrder": 0,
                "uncopyable": false,
                "bEnableFormat": false,
                "key": "292238",
                "needClear": false
            }, {
                key: 'btnAdd'
            }, {
                params: params
            });
            args.cShowCaption = this._get_data('cShowCaption');
            args.cCaption = this._get_data('cCaption');

            var self = this;
            args.disabledCallback = function() {
                self.setDisabled(true);
            }
            args.enabledCallback = function() {
                self.setDisabled(false);
            }

            biz.do('add', _this, args)
        });


        _this.get('btnBatchAudit').on('click', function(params) {
            var args = cb.utils.extend(true, {}, {
                "cCommand": "cmdBatchAudit",
                "cAction": "batchaudit",
                "cSvcUrl": "/bill/batchaudit",
                "cHttpMethod": "POST",
                "cExtProps": "{\"title\":\"批量审核\"}",
                "cItemName": "btnBatchAudit",
                "cCaption": "审核",
                "cShowCaption": "审核",
                "cControlType": "button",
                "iStyle": 0,
                "cParent": "292228",
                "bVmExclude": 0,
                "iOrder": 0,
                "uncopyable": false,
                "bEnableFormat": false,
                "key": "292229",
                "needClear": false
            }, {
                key: 'btnBatchAudit'
            }, {
                params: params
            });
            args.cShowCaption = this._get_data('cShowCaption');
            args.cCaption = this._get_data('cCaption');

            var self = this;
            args.disabledCallback = function() {
                self.setDisabled(true);
            }
            args.enabledCallback = function() {
                self.setDisabled(false);
            }

            biz.do('batchaudit', _this, args)
        });


        _this.get('btnBatchUnaudit').on('click', function(params) {
            var args = cb.utils.extend(true, {}, {
                "cCommand": "cmdBatchUnaudit",
                "cAction": "batchunaudit",
                "cSvcUrl": "/bill/batchunaudit",
                "cHttpMethod": "POST",
                "cExtProps": "{\"title\":\"批量弃审\"}",
                "cItemName": "btnBatchUnaudit",
                "cCaption": "弃审",
                "cShowCaption": "弃审",
                "cControlType": "button",
                "iStyle": 0,
                "cParent": "292228",
                "bVmExclude": 0,
                "iOrder": 0,
                "uncopyable": false,
                "bEnableFormat": false,
                "key": "292230",
                "needClear": false
            }, {
                key: 'btnBatchUnaudit'
            }, {
                params: params
            });
            args.cShowCaption = this._get_data('cShowCaption');
            args.cCaption = this._get_data('cCaption');

            var self = this;
            args.disabledCallback = function() {
                self.setDisabled(true);
            }
            args.enabledCallback = function() {
                self.setDisabled(false);
            }

            biz.do('batchunaudit', _this, args)
        });


        _this.get('btnImport').on('click', function(params) {
            var args = cb.utils.extend(true, {}, {
                "cCommand": "cmdImport",
                "cAction": "batchimport",
                "cSvcUrl": "/bill/billImport",
                "cHttpMethod": "POST",
                "cExtProps": "{\"title\":\"导入\"}",
                "cItemName": "btnImport",
                "cCaption": "导入",
                "cShowCaption": "导入",
                "cControlType": "button",
                "iStyle": 0,
                "cParent": "292236",
                "bVmExclude": 0,
                "iOrder": 0,
                "uncopyable": false,
                "bEnableFormat": false,
                "key": "292237",
                "needClear": false
            }, {
                key: 'btnImport'
            }, {
                params: params
            });
            args.cShowCaption = this._get_data('cShowCaption');
            args.cCaption = this._get_data('cCaption');

            var self = this;
            args.disabledCallback = function() {
                self.setDisabled(true);
            }
            args.enabledCallback = function() {
                self.setDisabled(false);
            }

            biz.do('batchimport', _this, args)
        });


        _this.get('btnTempexport').on('click', function(params) {
            var args = cb.utils.extend(true, {}, {
                "cCommand": "cmdTempexport",
                "cAction": "tempexport",
                "cSvcUrl": "/billtemp/export",
                "cHttpMethod": "POST",
                "cExtProps": "{\"title\":\"模板下载\"}",
                "cItemName": "btnTempexport",
                "cCaption": "模板下载",
                "cShowCaption": "模板下载",
                "cControlType": "button",
                "iStyle": 0,
                "cParent": "292236",
                "bVmExclude": 0,
                "iOrder": 0,
                "uncopyable": false,
                "bEnableFormat": false,
                "key": "292226",
                "needClear": false
            }, {
                key: 'btnTempexport'
            }, {
                params: params
            });
            args.cShowCaption = this._get_data('cShowCaption');
            args.cCaption = this._get_data('cCaption');

            var self = this;
            args.disabledCallback = function() {
                self.setDisabled(true);
            }
            args.enabledCallback = function() {
                self.setDisabled(false);
            }

            biz.do('tempexport', _this, args)
        });


        _this.get('btnEdit').on('click', function(params) {
            var args = cb.utils.extend(true, {}, {
                "cCommand": "cmdEdit",
                "cAction": "edit",
                "cSvcUrl": "/bill/edit",
                "cHttpMethod": "GET",
                "cExtProps": "{\"title\":\"编辑\"}",
                "cItemName": "btnEdit",
                "cCaption": "编辑",
                "cShowCaption": "编辑",
                "cControlType": "button",
                "iStyle": 0,
                "bVmExclude": 0,
                "iOrder": 0,
                "uncopyable": false,
                "bEnableFormat": false,
                "key": "292231",
                "needClear": false
            }, {
                key: 'btnEdit'
            }, {
                params: params
            });
            args.cShowCaption = this._get_data('cShowCaption');
            args.cCaption = this._get_data('cCaption');

            var self = this;
            args.disabledCallback = function() {
                self.setDisabled(true);
            }
            args.enabledCallback = function() {
                self.setDisabled(false);
            }

            biz.do('edit', _this, args)
        });


        _this.get('btnCopy').on('click', function(params) {
            var args = cb.utils.extend(true, {}, {
                "cCommand": "cmdCopy",
                "cAction": "copy",
                "cSvcUrl": "/bill/copy",
                "cHttpMethod": "POST",
                "cExtProps": "{\"title\":\"复制\"}",
                "cItemName": "btnCopy",
                "cCaption": "复制",
                "cShowCaption": "复制",
                "cControlType": "button",
                "iStyle": 0,
                "bVmExclude": 0,
                "iOrder": 0,
                "uncopyable": false,
                "bEnableFormat": false,
                "key": "292233",
                "needClear": false
            }, {
                key: 'btnCopy'
            }, {
                params: params
            });
            args.cShowCaption = this._get_data('cShowCaption');
            args.cCaption = this._get_data('cCaption');

            var self = this;
            args.disabledCallback = function() {
                self.setDisabled(true);
            }
            args.enabledCallback = function() {
                self.setDisabled(false);
            }

            biz.do('copy', _this, args)
        });


        _this.get('btnBatchDelete').on('click', function(params) {
            var args = cb.utils.extend(true, {}, {
                "cCommand": "cmdBatchDelete",
                "cAction": "batchdelete",
                "cSvcUrl": "/bill/batchdelete",
                "cHttpMethod": "POST",
                "cExtProps": "{\"title\":\"批量删除\"}",
                "cItemName": "btnBatchDelete",
                "cCaption": "删除",
                "cShowCaption": "删除",
                "cControlType": "button",
                "iStyle": 0,
                "bVmExclude": 0,
                "iOrder": 0,
                "uncopyable": false,
                "bEnableFormat": false,
                "key": "292234",
                "needClear": false
            }, {
                key: 'btnBatchDelete'
            }, {
                params: params
            });
            args.cShowCaption = this._get_data('cShowCaption');
            args.cCaption = this._get_data('cCaption');

            var self = this;
            args.disabledCallback = function() {
                self.setDisabled(true);
            }
            args.enabledCallback = function() {
                self.setDisabled(false);
            }

            biz.do('batchdelete', _this, args)
        });


        _this.get('btnDelete').on('click', function(params) {
            var args = cb.utils.extend(true, {}, {
                "cCommand": "cmdBatchDelete",
                "cAction": "batchdelete",
                "cSvcUrl": "/bill/batchdelete",
                "cHttpMethod": "POST",
                "cExtProps": "{\"title\":\"批量删除\"}",
                "cItemName": "btnDelete",
                "cCaption": "删除",
                "cShowCaption": "删除",
                "cControlType": "button",
                "iStyle": 0,
                "bVmExclude": 0,
                "iOrder": 0,
                "uncopyable": false,
                "bEnableFormat": false,
                "key": "292232",
                "needClear": false
            }, {
                key: 'btnDelete'
            }, {
                params: params
            });
            args.cShowCaption = this._get_data('cShowCaption');
            args.cCaption = this._get_data('cCaption');

            var self = this;
            args.disabledCallback = function() {
                self.setDisabled(true);
            }
            args.enabledCallback = function() {
                self.setDisabled(false);
            }

            biz.do('batchdelete', _this, args)
        });



        //check



        _this.on('columnSetting', function(params) {
            biz.do('columnSetting', _this, params);
        });
        //common events end


        // common billitem events start
        // events




        //common billitem events end


        if (billType == 'editvoucherlist') {
            var girdModelKeys = ["shiczyq008_at_yy001_at_st001_1739274995175680"]
            if (girdModelKeys) {
                girdModelKeys.forEach(function(key) {
                    var gridModel = _this.get(key);
                    if (gridModel) {
                        gridModel.on('afterCellValueChange', function(params) {
                            if (params) params.childrenField = key;
                            biz.do('cellCheck', _this, params);
                        })
                    }
                })
            }
        }

        _this.on('toggle', function(params) {
            biz.do('toggle', _this, params);
        });
        //注册
        _this.on('filterClick', function(params) {
            biz.do('search', _this, params);
        });



        this.biz = biz;
        // this.initData();
    };
    model.prototype.initData = function() {
        // if(cb.biz['AXT000069'] && cb.biz['AXT000069']['AXT000069_5111842dList_VM_Extend']){
        //   console.info('%c AXT000069_5111842dList_VM_Extend extendjs doAction', 'color:green');
        //   cb.biz['AXT000069']['AXT000069_5111842dList_VM_Extend'].doAction("init", this);
        // }else{
        //   console.log('%c no extend js' , 'font-size:22pt;color:red');
        // }
        var self = this;
        var extendFile = 'AXT000069/AXT000069_5111842dList_VM.Extend.js';
        cb.require([extendFile], function(extend) {
            if (extend && extend.doAction) {
                console.info('%c AXT000069_5111842dList_VM_Extend extendjs doAction', 'color:green');
                // 处理扩展脚本异常导致渲染失败 yueming
                try {
                    extend.doAction("init", self);
                } catch (error) {
                    console.error('Exception in business script, please check');
                    console.error(error);
                }
            } else {
                console.error('%c 语法错误  ' + extendFile, 'font-size:12pt;color:#860786');
                console.error('%c extendVmName-->AXT000069_5111842dList_VM_Extend', 'font-size:12pt;color:#860786')
            }
            self.execute('extendReady', self);
        }, function(error) {
            console.info('%c 未找到  ' + extendFile, 'font-size:12pt;color:#860786');
            console.info('%c extendVmName-->AXT000069_5111842dList_VM_Extend', 'font-size:12pt;color:#860786')
            self.execute('extendReady', self);
        });
    };

    return model;
});