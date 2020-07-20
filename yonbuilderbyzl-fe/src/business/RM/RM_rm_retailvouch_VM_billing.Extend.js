cb.define([
  'RM/retailBilling/Common.js', 'RM/retailBilling/WipeZero.js', 'RM/retailBilling/Promotion.js',
  'RM/retailBilling/ProductExtend.js', 'RM/retailBilling/BottomAction.js', 'RM/retailBilling/SettleExtend.js',
  'RM/retailBilling/CheckApproval.js', 'RM/retailBilling/FreeConfigSpec.js', 'RM/retailBilling/RechargePromotion.js', 'RM/retailBilling/Discount.js'
], function (common, zero, promotion, _product, _bottomAction, _settle, _Approval, _freeConfigSpec, _rechargePromotion, _Discount) {
  var RM_rm_retailvouch_VM_billing_Extend = {
    doAction: function (name, viewmodel) {
      if (this[name]) {
        this[name](viewmodel);
      }
    },
    init: function (viewmodel) {

        //扫描枪扫描后调用条码解析
        const afterGetScan = function (event, data) {
                  let cardnum = null;
                  if (data) {
                    cardnum = data.data;
                  }

                 if (cardnum) {
                    let date = new Date().format('yy-MM-dd hh:mm:ss');
                    viewmodel.billingFunc.scanEnter(cardnum, date);
               }
          }

      //打开开单界面的时候开启扫描枪监听
      if (window) {
        let ipcRenderer = null;
        if (window.Electron) {
          ipcRenderer = Electron.ipcRenderer;
          cb.electron.sendOrder('openScan');
          ipcRenderer.addListener('afterGetScan', afterGetScan);
        }
      }

      // let isReadingCard = false;
      /* 开单界面读卡 */
      const afterGetCardnumFromDevice = function (event, data) {
        // if(isReadingCard){
        //   return;
        // }
        // isReadingCard = true;
        let cardSaleParams = viewmodel.getParams().cardSaleParams;
        let ipcRenderer = cardSaleParams ? cardSaleParams.ipcRenderer : null;
        let isEditRow = cardSaleParams ? cardSaleParams.isEditRow : false;

        let bCard = false;  // 是否启用储值卡设备
        let cardnum = null;
        if (data) {
          bCard = data.bCard;
          cardnum = data.cardnum;
        }
        if (!bCard) {
          cb.utils.alert('硬件适配方案未启用储值卡', 'error');
          stopReadCard();
        }

        if (cardnum) {
          if (viewmodel.getParams().bStorageCardSale || viewmodel.getParams().bStorageCardBackBill) {
            if (isEditRow) {  // 是改行, 并且是售卡/退卡或者赠卡, 把卡号往卡券号里面塞
              if (viewmodel.get('retailVouchCouponSN') && viewmodel.get('retailVouchCouponSN').getEditRowModel().get("cCouponsn")) {
                let couponEditRowModel = viewmodel.get('retailVouchCouponSN').getEditRowModel().get("cCouponsn");
                couponEditRowModel.setValue(cardnum);
              }
            } else {
              let date = new Date().format('yy-MM-dd hh:mm:ss');
              viewmodel.billingFunc.scanEnter(cardnum, date);
            }
          } else {  // 不是售卡退卡, 是赠品-
            if (isEditRow) {
              // setCouponsn
              if (viewmodel.get('retailVouchCouponSN') && viewmodel.get('retailVouchCouponSN').getEditRowModel().get("cCouponsn")) {
                let couponEditRowModel = viewmodel.get('retailVouchCouponSN').getEditRowModel().get("cCouponsn");
                let row = viewmodel.getBillingContext('focusedRow')();
                //增品中含有储值卡实体卡商品
                if (row.iPromotionProduct == 1 && row.productrealProductAttributeType == 3) {
                  couponEditRowModel.setValue(cardnum);
                }
              }
            }
          }
        }
      }
      /**
       * 启动读卡事件监听
       * @param {boolean} isEditRow 是否是改行, 不传认为是false
       */
      const startReadCard = function (isEditRow) {
        if (window) {
          let ipcRenderer = null;
          if (window.Electron) {
            ipcRenderer = Electron.ipcRenderer;
            cb.electron.sendOrder('startGetCardnum');
            ipcRenderer.addListener('afterGetCardnumFromDevice', afterGetCardnumFromDevice);
            viewmodel.getParams().cardSaleParams = {}
            viewmodel.getParams().cardSaleParams.ipcRenderer = ipcRenderer;
            viewmodel.getParams().cardSaleParams.isEditRow = typeof (isEditRow) === 'boolean' ? isEditRow : false;
          }else if(window.plus && window.plus.JavaToJs){
            let precardstatus = null;
            cb.events.un('getCardnumFromDevice');
            cb.events.on('getCardnumFromDevice', function (dcdata) {
              if(precardstatus && precardstatus.indexOf(JSON.stringify(dcdata).replace(/\s+/g,''))>=0){
                return;
              }
              precardstatus = JSON.stringify(dcdata).replace(/\s+/g,'');
              let datas = dcdata.split('##$$$');
              if(datas[0].toLowerCase()==='fail'){
                // 未放置卡片就不提示错误了
                // cb.utils.alert(datas[1]+datas[2], 'error');
                // stopReadCard();
              }else if(datas[0].toLowerCase()==='same'){
              }else{
                let bCard=false;
                if(cb.electron.getAndroidObject()){
                  bCard = cb.electron.getAndroidObject().bCard;
                }
                afterGetCardnumFromDevice(null,{cardnum:datas[1],bCard});
              }
            });
            cb.electron.sendOrder('startGetCardnum');
            viewmodel.getParams().cardSaleParams = {}
            viewmodel.getParams().cardSaleParams.ipcRenderer = {removeListener:() => {}};
            viewmodel.getParams().cardSaleParams.isEditRow = typeof (isEditRow) === 'boolean' ? isEditRow : false;
          }
        }
      }

      /** 停止读卡 */
      const stopReadCard = function () {
        if (window) {
          if (viewmodel.getParams().cardSaleParams && viewmodel.getParams().cardSaleParams.ipcRenderer) {
            cb.electron.sendOrder('stopGetCardnum');
            viewmodel.getParams().cardSaleParams.ipcRenderer
              .removeListener('afterGetCardnumFromDevice', afterGetCardnumFromDevice);
            delete viewmodel.getParams()['cardSaleParams'];
          }
        }
      }

      /**
       * 哆啦宝支付
      */
      const sendPrice = function (data) {
        if (window) {
          cb.electron.sendOrder('sendPrice',data);
        }
      }

      /** 获取卡券号范围 */
      function getCardPattern(start, end) {
        if (!start || !end) {
          throw { message: '开始卡券号和结束卡券号必须同时录入'};
        }

        let pattern = {
          prefix: '',
          range: { from: '', to: '' },
          suffix: ''
        }
        let prefixEndIndex = 0;
        let rangeEndIndex = start.length;
        if (typeof (start) === 'string' && typeof (end) === 'string') {
          if (start.length !== end.length) {      // 长度不等, 没有合法范围
            throw { message: '开始卡券号和结束卡券号长度必须相等'};
          }

          let state = 1;
          for (let i = 0; i <= start.length; i++) {
            if (state === 1) {  // 获取前缀
              prefixEndIndex = i;
            } else if (state === 2) { // 获取范围
              rangeEndIndex = i;
            }
            if (state === 1 && start[i] !== end[i]) {  // 是否前缀结束
              state = 2;
            }
            if (state === 2) { // 范围
              if (Number(start[i]).toString() === 'NaN') { // 是否范围结束
                break;
              }
            }
          }
          let startSuffix = start.slice(rangeEndIndex, start.length);
          let endSuffix = end.slice(rangeEndIndex, end.length);
          if (startSuffix !== endSuffix) {
            throw { message: '开始卡券号和结束卡券号后缀不同'};
          }
          pattern.prefix = start.slice(0, prefixEndIndex);
          pattern.range.from = start.slice(prefixEndIndex, rangeEndIndex);
          pattern.range.to = end.slice(prefixEndIndex, rangeEndIndex);
          pattern.suffix = startSuffix;
          return pattern;
        }
        return null;
      }

      /** 获取卡券号数组 */
      function getCardListFromPattern (pattern) {
        if (!pattern) { return []; }
        let prefix = pattern.prefix;
        let from = pattern.range.from;
        let to = pattern.range.to;
        let suffix = pattern.suffix;

        if(prefix && !from && !to && !suffix){  // 开始卡号和结束卡号相同, 只有前缀
          return [prefix];
        }

        if(Number(from) > Number(to)){  // 开始卡号大于结束卡号
          throw { message: '开始卡券号不能大于结束卡券号'};
        }
        let cardList = [];
        for(let i = 0; i <= to - from; i ++){
          let card = prefix;
          let num = (parseInt(from) + i).toString();
          if(num.length < to.length){
            for(let j = 0; j < to.length-num.length; j ++){
              num = '0' + num;
            }
          }
          card += num;
          card += suffix;

          cardList.push(card);
        }
        return cardList;
      }

      /** 获取卡券号数组 */
      function getCardList(start, end){
        return getCardListFromPattern(getCardPattern(start, end));
      }

      /** 改行弹出时判断卡券号录入方式 */
      function checkSelectWayOfCoupon(fieldName,row,couponEditRowModel,beginCouponEdit,endCouponEdit) {
        let flag = 0;
        let retailVouchDetails = viewmodel.getBillingContext('products')();
        switch (fieldName) {
          case 'cCouponsn':
            for (let i = 0; i < retailVouchDetails.length; i++) {
              if(retailVouchDetails[i].cCouponsn){
                flag = 1;//卡券号
                break;
              }else if(retailVouchDetails[i].beginCouponsn || retailVouchDetails[i].endCouponsn){
                flag = 2;//卡券号区间
                break;
              }
            }
            //根据flag判断卡券号输入框是否可编辑
            if(flag == 1){
              couponEditRowModel.setDisabled(false);
              couponEditRowModel.setValue(row.cCouponsn);
            }else if(flag == 2){
              beginCouponEdit.setDisabled(false);
              endCouponEdit.setDisabled(false);
              beginCouponEdit.setValue(row.beginCouponsn);
              endCouponEdit.setValue(row.endCouponsn);
            }else{
              couponEditRowModel.setDisabled(false);
              beginCouponEdit.setDisabled(false);
              endCouponEdit.setDisabled(false);
            }
            break;
          case 'cStorageCardNum':
            for (let i = 0; i < retailVouchDetails.length; i++) {
              if(retailVouchDetails[i].cStorageCardNum){
                flag = 1;
                break;
              }else if(retailVouchDetails[i].beginCouponsn || retailVouchDetails[i].endCouponsn){
                flag = 2;
                break;
              }
            }
            if(flag == 1){
              couponEditRowModel.setDisabled(false);
              couponEditRowModel.setValue(row.cStorageCardNum);
            }else if(flag == 2){
              beginCouponEdit.setDisabled(false);
              endCouponEdit.setDisabled(false);
              beginCouponEdit.setValue(row.beginCouponsn);
              endCouponEdit.setValue(row.endCouponsn);
            }else{
              couponEditRowModel.setDisabled(false);
              beginCouponEdit.setDisabled(false);
              endCouponEdit.setDisabled(false);
            }
            break;
        }

      }

      /** 改行确定校验 卡券号与卡券范围必输 且只能输入一种 */
      function checkCouponHandleOk(fieldName,rowSNData) {
        if(fieldName == 'cCouponsn'){
          let singleSn = rowSNData.cCouponsn;
          let rangeSn = rowSNData.beginCouponsn || rowSNData.endCouponsn;
          if (singleSn && rangeSn) {
            return '卡券商品,不能同时选择卡券号与卡券范围';
          }else if(!singleSn && !rangeSn){
            return '卡券商品,请输入卡券号或卡券号范围';
          }
          if(rowSNData.beginCouponsn && !rowSNData.endCouponsn){
            return '请输入结束卡券号';
          }
          if(!rowSNData.beginCouponsn && rowSNData.endCouponsn){
            return '请输入起始卡券号';
          }
          return null;
        }
      }

      /** 改行确定校验 卡券范围是否合理 是否冲突 */
      function checkCouponsnCorrect(row,cardList) {
        let products = viewmodel.getBillingContext('products')();
        let existCardList = []; // 已录入卡号列表
        products.forEach(item => {
          if(item.key != row.key && item.cCouponId == row.cCouponId && item.retailVouchCouponSN){
            item.retailVouchCouponSN.forEach(itemsn => {
              existCardList.push(itemsn.cGiftTokensn);
            })
          }
        })
        let existCard = '';
        for(let i = 0; i < existCardList.length ; i++){
          for(let j = 0; j < cardList.length; j++){
            if(existCardList[i] == cardList[j]){
              existCard = existCard + existCardList[i] + ',';
              break;
            }
          }
        }
        if(!cb.utils.isEmpty(existCard)){
          return existCard.substr(0,existCard.length-1);
        }
        return null;
      }

      /** 修改卡券号 卡券范围 判断是否需要联动 */
      function checkNeedChange() {
        let products = viewmodel.getBillingContext('products')();
        let needChange = true;
        products.forEach(item => {
          if(item.cCouponId && (item.cCouponsn || item.beginCouponsn || item.endCouponsn)){
            needChange = false;
          }
        })
        return needChange;
      }

      /* 储值卡支付弹窗截流变量 */
      var openCardPayViewCount = 0;
      var openQuickCardPayViewCount = 0;
      /* 声明方法 */
      /* 根据销售方式判断当前业务类型是否满足条件 */
      var checkBusinessType = function (saleType) {
        let testBusinessType = viewmodel.getBillingContext('businessType')();
        let testBusinesstypeDataSource = viewmodel.getBillingContext('Businesstype_DataSource')();
        // 判断当前是否
        let flag = false;
        if (testBusinesstypeDataSource && testBusinesstypeDataSource.length > 0) {
          let testBusinessTypeData = testBusinesstypeDataSource.find(type => type.name == testBusinessType.name);
          if (testBusinessTypeData && testBusinessTypeData.saleType == saleType) {
            flag = true;
          }
        }
        return flag;
      }
      //ktv行业获取时段数据
      var time_period = [];
      var getTimePeriod = function () {
        //ktv行业房费商品处理
        let storeId = cb.rest.AppContext.user.storeId;
        if (cb.rest.AppContext.tenant.industry == 20) { //ktv行业处理带入房费商品时，默认带入时段
          let params = {//获取时段开始时间和结束时间的入参
            refCode: "aa_timeperiod",
            page: { pageSize: -1, PageIndex: 1 },
            condition: { isExtend: true, simpleVOS: [{ field: "store", op: "eq", value1: storeId }] },
            key: "timeperiod_name",
            bSelfDefine: false,
            billnum: "aa_timeperiod",
            dataType: "grid"
          };
          let getPeriod = cb.rest.DynamicProxy.create({
            settle: {
              url: '/bill/ref/getRefData',
              method: 'POST'
            }
          });
          getPeriod.settle(params, function (err, result) {
            if (err) {
              cb.utils.alert(err.message, 'error');
              cb.utils.alert('获取时段信息！', 'error');
            }
            if (result != undefined && result.recordList && (result.recordList.length > 0)) {
              time_period = result.recordList;
              viewmodel.getParams().time_period = time_period; //冗余房费商品的时段数据
            }
          })
        }
      }

      if (cb.rest.AppContext.tenant.industry == 20) { //ktv行业开单初始化时查询时段数据，后续操作需要使用
        getTimePeriod();//获取时段数据
      }
      /* 结算窗口打开储值卡支付界面 */
      var openCardPayView = function (paymode, paymodes, data, viewmodel) {
        // if(openCardPayViewCount > 0){
        //   return;
        // }
        openCardPayViewCount += 1;
        cb.loader.runCommandLine('bill', data, viewmodel, function (vm) {
          /* 定义方法 */
          /* 添加收款单支付孙表 */
          var addGatheringvouchPaydetail = function () {
            let rows = vm.getGridModel().getRows();   //获取行
            if (paymode.value != 0 && rows.length == 0) {    //要求至少录入一张卡
              cb.utils.alert('未录入储值卡', 'error');
              return false;
            }
            let gatheringvouchPaydetail = [];         //收款单支付孙表
            let dPayTime = new Date().format('yyyy-MM-dd hh:mm:ss');
            let amountsum = 0;
            for (let i = 0; i < rows.length; i++) {
              if (rows[i].payment_amount == 0) continue;      //不添加支付金额为0的卡
              amountsum += Number(rows[i].payment_amount);
              gatheringvouchPaydetail.push({
                cCardCode: rows[i].payment_cardnum,
                fBalance: Number((rows[i].payment_balance - rows[i].payment_amount).toFixed(cb.rest.AppContext.option.amountofdecimal)),     //一张卡应该不会同时在多个地方支付, 余额应该是不会变的
                fAmount: rows[i].payment_amount,
                password: rows[i].password,
                dPayTime: dPayTime,
                iPaymentid: paymode.paymethodId,
                iPaytype: paymode.paymentType,
                _status: 'Insert'
              });
            }
            paymode.value = amountsum.toFixed(cb.rest.AppContext.option.amountofdecimal);
            paymode.gatheringvouchPaydetail = gatheringvouchPaydetail;
            for (let attr in paymodes) {
              if (paymodes[attr].paymethodId == paymode.paymethodId) {
                paymodes[attr] = paymode;
                break;
              }
            }
            viewmodel.billingFunc.setPaymodes(paymodes);
            return true;
          }
          /* 关闭方法 */
          var closeView = function () {
            let rows = vm.getGridModel().getRows();   //获取行
            if (!paymode.gatheringvouchPaydetail && rows && rows.length > 0 && paymode.originalSamePaymodes) {
              addGatheringvouchPaydetail();
            }
          }

          /* 注册方法 */
          vm.on('sureClick', function (data) {
            if (addGatheringvouchPaydetail()) {
              openCardPayViewCount -= 1;
              viewmodel.communication({
                type: 'modal',
                payload: { data: false }
              });
              return true;
            }
            return false;
          });
          vm.on('abandonClick', function (data) {
            openCardPayViewCount -= 1;
            closeView();              // 原单退货时自动带出一条记录, 处理这种情况
            viewmodel.communication({
              type: 'modal',
              payload: { data: false }
            })
            return true;
          });
          return true
        })
      }

      var openWalletPayView = function (paymode, paymodes, data, viewmodel) {
        cb.loader.runCommandLine('bill', data, viewmodel, function (vm) {
          /* 定义方法 */
          /* 添加收款单支付孙表 */
          var addGatheringvouchPaydetail = function () {
            let rows = vm.getGridModel().getRows();   //获取行
            if (paymode.value != 0 && rows.length == 0) {    //要求至少存在一个会员钱包
              cb.utils.alert('不存在可用账号', 'error');
              return false;
            }
            let gatheringvouchPaydetail = [];         //收款单支付孙表
            let dPayTime = new Date().format('yyyy-MM-dd hh:mm:ss');
            let amountsum = 0;
            for (let i = 0; i < rows.length; i++) {
              if (rows[i].payment_amount == 0) continue;      //不添加支付金额为0的钱包
              amountsum += Number(rows[i].payment_amount);
              gatheringvouchPaydetail.push({
                cCardCode: rows[i].payment_account_name,
                cTransactionCode: rows[i].payment_account,
                fBalance: Number((rows[i].payment_balance - rows[i].payment_amount).toFixed(cb.rest.AppContext.option.amountofdecimal)),     //会员钱包应该不会同时在多个地方支付, 余额应该是不会变的
                pament_available_balance: rows[i].pament_available_balance,
                fAmount: rows[i].payment_amount,
                dPayTime: dPayTime,
                iPaymentid: paymode.paymethodId,
                iPaytype: paymode.paymentType,
                _status: 'Insert'
              });
            }
            paymode.value = amountsum.toFixed(cb.rest.AppContext.option.amountofdecimal);
            // paymode.payCode = 'xxx';
            paymode.gatheringvouchPaydetail = gatheringvouchPaydetail;
            for (let i = 0; i < paymodes.length; i++) {
              if (paymodes[i].paymentType == paymode.paymentType && paymodes[i].paymethodId == paymode.paymethodId) {
                paymodes[i] = paymode;
                break;
              }
            }
            viewmodel.billingFunc.setPaymodes(paymodes);
            return true;
          }
          /* 关闭方法 */
          var closeView = function () {
            let rows = vm.getGridModel().getRows();   //获取行
            if (!paymode.gatheringvouchPaydetail && rows && rows.length > 0 && paymode.originalSamePaymodes) {
              addGatheringvouchPaydetail();
            }
            // 第一次弹出界面点取消也添加paydetail
            if (paymode.gatheringvouchPaydetail == null) {
              addGatheringvouchPaydetail();
            }
          }

          /* 注册方法 */
          vm.on('sure', function (data) {
            if (addGatheringvouchPaydetail()) {
              viewmodel.communication({
                type: 'modal',
                payload: { data: false }
              });
            }
            return false;
          });
          vm.on('abandon', function (data) {
            closeView();              // 原单退货时自动带出一条记录, 处理这种情况
            viewmodel.communication({
              type: 'modal',
              payload: { data: false }
            })
            return false;
          });
          return true
        })
      }

      var openWalletRechargeView = function (data, viewmodel, wrapFunc, transfer) {
        cb.loader.runCommandLine('bill', data, viewmodel, function (vm) {
          var addProductToPanel = function (data) {
            let cardnum = vm.get('cardnum').getValue();
            let wallet = vm.get('wallet').getValue();
            let rechargeAmount = vm.get('rechargeAmount').getValue();
            let bonusRows = vm.get('aa_memberwalletrechargebonus').getRows();
            if (!cardnum) { cb.utils.alert('会员账号为空', 'error'); return false; }
            if (!wallet) { cb.utils.alert('无效钱包账号', 'error'); return false; }
            if (!rechargeAmount) { cb.utils.alert('充值金额为空', 'error'); return false; }

            var proxy = cb.rest.DynamicProxy.create({
              ensure: {
                url: '/memberwallet/getwalletitem',
                method: 'POST'
              }
            });
            let flotGiveMoney = 0;
            if (bonusRows && bonusRows.length > 0) {
              bonusRows.forEach(row =>
                flotGiveMoney = Number(cb.utils.getRoundValue(flotGiveMoney + row.bonusAmount, cb.rest.AppContext.option.amountofdecimal)))
            }
            var params = {
              walletAccount: wallet,
              flotmoney: rechargeAmount,
              flotGiveMoney: flotGiveMoney,
              iWarehouseid: viewmodel.getBillingContext('defaultWarehouse')() ? viewmodel.getBillingContext('defaultWarehouse')().iWarehouseid : null
            };
            proxy.ensure(params, (err, result) => {
              if (err) { cb.utils.alert(err.message ? err.message : err); return false; }
              if (!result) { cb.utils.alert('查询商品失败', 'error'); return false; }

              viewmodel.getParams().bMemberWalletRecharge = true;    // 标记当前零售单为[会员充值]状态, 用于修改业务类型
              viewmodel.billingFunc.getDefaultBusinessType(30);     // 设置默认业务类型销售方式为30-储值
              let products = viewmodel.getBillingContext('products')();     //获取当前开单界面的商品行
              // let existCard = products.find(item => item.walletAccount === result.walletAccount);
              let existCard = products[0];    // 充值一次只能充一个钱包
              if (products && existCard) {
                existCard.fPromotionDiscount = result.fDiscount;
                existCard.fPromotionDiscount_origin = result.fDiscount;
                existCard.fDiscount = result.fDiscount;
                existCard.fDiscountRate = result.fDiscountRate;
                existCard.fMoney = result.fMoney;
                existCard.fPrice = result.fPrice;
                existCard.fQuoteMoney = result.fQuoteMoney;
                existCard.fQuotePrice = result.fQuotePrice;
                existCard.fRechargeMoney = result.fRechargeMoney;
                existCard.fGiveMoney = result.fGiveMoney;
                viewmodel.billingFunc.updateFocusedRow(existCard);
              } else {
                // 新增充值商品行
                let ts = new Date().valueOf();
                result.productsku
                  ? result.key = `${result.product}|${result.productsku}_${ts}`   // sku
                  : result.key = `${result.product}_${ts}`;                       // 商品

                result.walletAccount = wallet;
                result.fPromotionDiscount = result.fDiscount;

                let warehouse = viewmodel.getBillingContext('defaultWarehouse')();
                result.iWarehouseid = warehouse.iWarehouseid;
                result.iWarehouseid_erpCode = warehouse.iWarehouse_erpCode;
                result.iWarehouseid_name = warehouse.iWarehouseid_name;
                result.has_go_this_lz = true;                                 //不走换货

                let retailVouchHeader = { retailVouchDetails: [result] };           // 构造零售单的对象
                let memberInfo = viewmodel.getBillingContext('memberInfo')();   //添加会员信息
                if (memberInfo) {
                  retailVouchHeader.iMemberid = memberInfo.mid;
                  retailVouchHeader.iMemberid_cphone = memberInfo.phone;
                  retailVouchHeader.levelId = memberInfo.level_id;
                  retailVouchHeader.iMemberid_levelid_cMemberLevelName = memberInfo.level_name
                  retailVouchHeader.iMemberid_name = memberInfo.realname;
                }
                let mock = [{ rm_retailvouch: retailVouchHeader }];
                wrapFunc(mock, null, true);
              }
            })
            return true;
          }

          /* 确定按钮 */
          vm.on('sure', function () {
            if (addProductToPanel()) {
              viewmodel.communication({
                type: 'modal',
                payload: { data: false }
              })
            }
            return false;
          });

          /* 取消按钮 */
          vm.on('abandon', function () {
            viewmodel.communication({
              type: 'modal',
              payload: { data: false }
            })
            return false;
          });
          return true
        })
      }

      /* 校验预定使用了卡券收款方式 交货时是否满足条件 */
      var checkCouponUsed = function () {
        let oldGiftTokens = viewmodel.getParams().oldGiftTokens;
        if(oldGiftTokens && oldGiftTokens.find(o => o.dl_paytype == 1 || o.dl_paytype == true)){
          return true;
        }
        return false;
      }

      promotion.init(viewmodel)
      _product.init(viewmodel)
      _bottomAction.init(viewmodel)
      _settle.init(viewmodel)
      _Approval.init(viewmodel);
      _Discount.init(viewmodel);
      _freeConfigSpec.init(viewmodel);
      _rechargePromotion.init(viewmodel);
      var iPayState_1;  //记录调整单原单收款状态
      var iPresellState_1; //记录调整单原单预订单状态
      var editRowModel = viewmodel.get('retailVouchDetails').getEditRowModel();
      editRowModel.get('cMemo').on('beforeValueChange', function (args) {
      });
      editRowModel.get('cMemo').on('afterValueChange', function (args) {
      });

      // 退订暂时注释处理0326
      viewmodel.on('beforeUnsubscribeOkClick', function (args) {
        let billingStatus = viewmodel.getBillingContext('billingStatus')();
        // if(billingStatus == 'PresellBack'){
        //   var bUnsubscribe = args.rm_retailvouch.bUnsubscribe;
        //   var unsubscribeReason = args.rm_retailvouch.unsubscribeReason;
        //   if(bUnsubscribe == true){
        //     return
        //   }else{
        //     cb.utils.alert('本单不可退订，原因是：' + unsubscribeReason, 'error');
        //     return false
        //   }
        // }
      });

      viewmodel.on('AdjustMoney', function (wrapFunc) {
        var bSureFlag = false;
        var products = viewmodel.getBillingContext('products')();
        if (products && products.length > 0) {
          cb.utils.alert('存在商品行，不允许调整！', 'error');
          return
        }
        editRowModel.setReadOnly(false);
        editRowModel.get("beforeAdjustDiscount").setReadOnly(true);
        editRowModel.get("beforeAdjustMoney").setReadOnly(true);
        var params = {
          code: 'rm_retailvouchadjust',
          makeBilltype: '0'
        };
        var data = {
          billtype: 'billmaker',
          billno: 'rm_retailvouchadjust',
          params
        };
        cb.loader.runCommandLine('bill', data, viewmodel, (vm) => {
          let iRetailid = 0;
          var bodyPropertyName = vm.get('Body');
          vm.get(bodyPropertyName).on('beforeSetDataSource', function (data) {
            if (iRetailid != data[0].iRetailid) { //用来控制多次点击表头数据，出现重复表体数据问题
              iRetailid = data[0].iRetailid;
            } else {
              return false;
            }
            //如果商品行已退货数量不为0，则该商品行不带入子表
            for (var i = 0; i < data.length; i++) {
              if (data[i].fCoQuantity != 0) {
                data.splice(i, 1);
                i = i - 1;
              }
            }
          });
          vm.on('afterOkClick', function (data) {
            //多次点确定按钮前判断
            if (bSureFlag) return false;
            bSureFlag = true;
            //处理原单数据，按照要求传到开单界面（数量为零）
            let retailVouchDetails = data.data.retailVouchDetails;
            iPayState_1 = data.data.iPayState;
            iPresellState_1 = data.data.iPresellState;
            data.data.bExtendBody = true;
            data.data.bAmountAdjustment = true;
            data.data.vouchdate = null;
            let i = 0;
            retailVouchDetails.forEach(function (item) {
              //商品行零售价和单价置0
              i = i + 1;
              item.fPrice = 0;
              item.fQuotePrice = 0;
              item["product_productProps!define4"] = null; //金额调整的零售单，商品可选配时，去掉商品行上的可选配小标签
              let ts = new Date().valueOf();
              if (item.productsku) { //sku
                item.key = `${item.product}|${item.productsku}_${ts}_${i}`
              } else { // 商品
                item.key = `${item.product}_${ts}_${i}`
              }
            });

            let adjustData = { "rm_retailvouch": data.data };
            let mock = [];
            mock.push(adjustData);
            vm.execute('close');
            wrapFunc(mock)
            return false;
          });
          vm.on('close', function () {
            viewmodel.communication({
              type: 'modal',
              payload: {
                data: false
              }
            })
          })
          return true;
        });
      });

      viewmodel.on('FreeGoods', function (wrapFunc) {
        viewmodel.billingFunc.updateCheckDiscountAuth(false);
        var products = viewmodel.getBillingContext('products')();
        if (products && products.length > 0) {
          cb.utils.alert('存在商品行，不允许执行赠品！', 'error');
          return
        }
        editRowModel.get("fPrice").setReadOnly(false);
        var params = {
          code: 'rm_giftbills',
          makeBilltype: '0'
        };
        var data = {
          billtype: 'billmaker',
          billno: 'rm_giftbills',
          params
        };
        cb.loader.runCommandLine('bill', data, viewmodel, (vm) => {
          var bodyGridModel = vm.get(vm.get('Body'));
          bodyGridModel.setState('defaultSelectedRowIndexes', true);
          bodyGridModel.setState('showCheckBox', false);
          bodyGridModel.on("beforeSetDataSource", function (data) {
            for (let i = 0; i < data.length; i++) {

            }
          });
          vm.on('afterOkClick', function (data) {
            data.data.retailVouchDetails.length = 0;
            data.data.bGiveawayList = true;
            data.data.vouchdate = null;
            let freeGoodsData = { "rm_retailvouch": data.data };
            let mock = [];
            mock.push(freeGoodsData);
            //let mockstr = '{"rm_retailvouch":{"creator":"付博","createTime":"2019-02-14 10:02:30","createDate":"2019-02-14","modifier":null,"modifyTime":null,"modifyDate":null,"auditor":null,"auditTime":null,"auditDate":null,"id":null,"pubts":null,"tenant":1027667389960448,"cGUID":"4c087a00-2bff-4cdc-83db-0d616661d0ee","ioffline":0,"billingStatus":"CashSale","iPresellState":0,"iDeliveryState":1,"iPayState":1,"iTakeway":null,"bDeliveryModify":false,"bPreselllockStock":true,"regionCode":null,"dPlanShipmentDate":null,"cMobileNo":null,"cCusperson":null,"cDeliveradd":null,"memo":null,"iBusinesstypeid":1018427876872701,"iBusinesstypeid_name":"现销","bHang":false,"store":1042679245721856,"cStoreCode":"0001","store_name":"曲美直营店","iGradeid":1053726635495681,"cRetailURL":"http://localhost:3003/uniform","foldDiscountSum":"0.00","fPromotionSum":"0.00","iPostage":"0.00","fQuoteMoneySum":"600.00","fGiftApportion":"0.00","fGatheringMoney":"600.00","fEffaceMoney":"0.00","fCoDiscountSum":"0.00","fSceneDiscountSum":"0.00","fQuantitySum":"1.00","fPointPayMoney":"0.00","fDiscountSum":"0.00","fVIPDiscountSum":"0.00","fMoneySum":"600.00","fPresellPayMoney":"0.00","retailVouchDetails":[{"product_cCode":"20190111000001","retailPriceDimension":1,"fPrice":"600.00","rowNumber":1,"specsBtn":false,"product_productProps!define1":"经典空间","product_productProps!define2":"N053","fDiscount":0,"product_productProps!define3":"产品级","product_productOfflineRetail_isExpiryDateManage":false,"product_productProps!define4":"无选配","product_productProps!define5":"否","fQuoteMoney":"600.00","product_productClass_path":"|1047187641635072|","product_productProps!define7":"否","product_productProps!define8":"其他","product_productOfflineRetail_isProcess":true,"productsku":1064259128529153,"product":1064259128496384,"product_unitId":1045356152508672,"bCanDiscount":true,"fLowestPrice":0,"fQuantity":"1.00","product_productOfflineRetail_processType":0,"product_productOfflineRetail_isPriceChangeAllowed":false,"product_productClass_name":"文件柜","iEmployeeid":1042680163045632,"fQuotePrice":"600.00","product_productClass_code":"文件柜","iWarehouseid_name":"曲美仓","iWarehouseid":1042678522646784,"product_creatorType":1,"iBathid":1064259128496384,"specs":"","iEmployeeid_name":"小明","fMoney":"600.00","product_realProductAttribute":1,"enableWeight":false,"product_productOfflineRetail_isSerialNoManage":false,"bFixedCombo":false,"product_productOfflineRetail_isBatchManage":false,"has_go_this_lz":true,"product_cName":"无选配test","key":"1064259128496384|1064259128529153_1550111308135","productsku_cCode":"20190111000001","product_unitName":"米/根","iOrder":0,"_status":"Insert"}],"_status":"Insert","fChangeMoney":0,"retailVouchGatherings":[{"_status":"Insert","iPaymentid":"1027302856626435","iPaytype":1,"fMoney":"600.00","iPaymentid_name":"现金","iOrder":0}]},"rm_gatheringvouch":{"creator":"付博","createTime":"2019-02-14 10:02:30","createDate":"2019-02-14","modifier":null,"modifyTime":null,"modifyDate":null,"auditor":null,"auditTime":null,"auditDate":null,"id":null,"pubts":null,"tenant":1027667389960448,"cGUID":"4c087a00-2bff-4cdc-83db-0d616661d0ee","ioffline":0,"billingStatus":"CashSale","iPresellState":0,"iDeliveryState":1,"iPayState":1,"iTakeway":null,"bDeliveryModify":false,"bPreselllockStock":true,"regionCode":null,"dPlanShipmentDate":null,"cMobileNo":null,"cCusperson":null,"cDeliveradd":null,"memo":"","iBusinesstypeid":1018427876872701,"iBusinesstypeid_name":"现销","bHang":false,"store":1042679245721856,"cStoreCode":"0001","store_name":"曲美直营店","iGradeid":1053726635495681,"cRetailURL":"http://localhost:3003/uniform","fGatheringMoney":"600.00","foldDiscountSum":"0.00","fPromotionSum":"0.00","iPostage":"0.00","fQuoteMoneySum":"600.00","fGiftApportion":"0.00","fEffaceMoney":"0.00","fCoDiscountSum":"0.00","fSceneDiscountSum":"0.00","fQuantitySum":"1.00","fPointPayMoney":"0.00","fDiscountSum":"0.00","fVIPDiscountSum":"0.00","fMoneySum":"600.00","fPresellPayMoney":"0.00","_status":"Insert","gatheringVouchDetail":[{"_status":"Insert","iPaymentid":"1027302856626435","iPaytype":1,"fMoney":"600.00","iPaymentid_name":"现金","iOrder":0}],"fChangeMoney":0,"iOwesState":0}}'
            //let mock = [JSON.parse(mockstr)];
            vm.execute('close');
            wrapFunc(mock)
            return false;
          });
          vm.on('close', function () {
            viewmodel.communication({
              type: 'modal',
              payload: {
                data: false
              }
            })
          });
          return true;
        });
      });

      viewmodel.on('MadeGoods', function (wrapFunc, transfer) {
        var products = viewmodel.getBillingContext('products')();
        if (products && products.length > 0) {
          cb.utils.alert('存在商品行，不允许定制！', 'error');
          return
        }
        var params = {
          //code: 'rm_retailvouchadjust',
          //makeBilltype: '0'
        };
        var data = {
          billtype: 'freeview',
          billno: 'rm_customizedOrder',
          params
        };
        cb.loader.runCommandLine('bill', data, viewmodel, function (vm) {
          vm.on('sure', function () {
            let customizedOrder = vm.get('rm_customizedOrder').getSelectedRows();
            if (customizedOrder.length == 0) {
              cb.utils.alert('请选择商品！', 'error');
              return;
            }
            let customizedOrderDetail = vm.get('rm_customizedOrderDetail').getSelectedRows();
            if (customizedOrderDetail.length == 0) {
              cb.utils.alert('请选择商品明细！', 'error');
              return;
            }

            let customizedOrderData = customizedOrder[0];
            let customizedOrderDetails = customizedOrder[0].customizedOrderDetails;
            let productErpCodeArray = [];
            for (var i = 0; i < customizedOrderDetails.length; i++) {
              productErpCodeArray.push(customizedOrderDetails[i].productCode);
            };

            var proxy = cb.rest.DynamicProxy.create({
              queryProduct: {
                url: '/mall/bill/queryProductByConditions',
                method: 'POST'
              }
            });
            proxy.queryProduct({
              "billnum": "rm_retailvouch",
              "dataType": "grid",
              "refCode": "aa_productsku",
              "condition": { "isExtend": true, "simpleVOs": [{ "field": "productskus.erpCode", "op": "in", "value1": productErpCodeArray }] },
              "externalData": { "showType": "Y" }
            }, function (err, result) {
              if (err) {
                cb.utils.alert(err.message, 'error');
                return;
              }
              let children = [], ts = new Date().valueOf();
              for (var i = 0; i < customizedOrderDetails.length; i++) {
                var j = 0;
                result.forEach(item => {
                  j++;
                  if (item.cCode == customizedOrderDetails[i].productCode) {
                    let sku = { fQuantity: 1 };
                    transfer(item, sku)
                    sku.fQuotePrice = customizedOrderDetails[i].price;
                    sku.fQuoteMoney = sku.fQuotePrice * sku.fQuantity;
                    sku.fPrice = sku.fQuotePrice;
                    sku.fMoney = sku.fPrice * sku.fQuantity;
                    sku.orderCode = customizedOrderData.contractCode;
                    sku["retailVouchDetailCustom!define1"] = customizedOrderDetails[i].productName;
                    if (item.productsku) { //sku
                      sku.key = `${item.product}|${item.productsku}_${ts}_${i}`
                      sku.specsBtn = false;
                      sku.specs = item.propertiesValue || ""
                    } else { // 商品
                      sku.specsBtn = true;
                      sku.key = `${item.product}_${ts}_${i}`
                    }
                    children.push(sku)
                  } else {
                    if (j == result.length) {
                      let sku = { fQuantity: 1 };
                      sku.fQuotePrice = customizedOrderDetails[i].price;
                      sku.fQuoteMoney = sku.fQuotePrice * sku.fQuantity;
                      sku.fPrice = sku.fQuotePrice;
                      sku.fMoney = sku.fPrice * sku.fQuantity;
                      sku["retailVouchDetailCustom!define1"] = customizedOrderDetails[i].productName;
                      if (item.productsku) { //sku
                        sku.key = `${item.product}|${item.productsku}_${ts}_${i}`
                        sku.specsBtn = false;
                        sku.specs = item.propertiesValue || ""
                      } else { // 商品
                        sku.specsBtn = true;
                        sku.key = `${item.product}_${ts}_${i}`
                      }
                      children.push(sku)
                    }
                  }
                })
              }
              var data = {
                'fMoneySum': customizedOrderData.sumMoney,
                'bcustomizedOrder': true,
                'retailVouchCustom!define1': customizedOrderData.contractCode,
                'retailVouchCustom!define6': customizedOrderData.sourceType,
                retailVouchDetails: children
              };
              let mockstr = { rm_retailvouch: data }
              let mock = [];
              mock.push(mockstr);
              viewmodel.communication({
                type: 'modal',
                payload: {
                  data: false
                }
              })
              wrapFunc(mock, 'PresellBill');
              //viewmodel.billingFunc.showHeaderInfo();
            });
            return false;
          });
          vm.on('abandon', function () {
            viewmodel.communication({
              type: 'modal',
              payload: {
                data: false
              }
            })
            return false;
          });
          return true
        })
      });

      /* 触屏扫码带下商品取缓存价格之前 */
      viewmodel.on('beforeTouchGetCachePrice', function (args) {
        if (viewmodel.getParams().bStorageCardSale || viewmodel.getParams().bStorageCardBackBill) {
          return false;   // 不取缓存价格
        }

        // 是否扫码包含数量金额
        let isCodeType11_12 = (function (args) {
          let skuArr = _.get(args, ['exportData', 'skuArr']);
          if (Array.isArray(skuArr)) {
            if(skuArr.some(item => item.__codeType == '11_12')){
              return true;
            }
          }
          return false;
        })(args);
        // 如果扫码包含数量金额
        if (isCodeType11_12) {
          return false;   // 不取缓存价格
        }
      })

      /*
       *  扫码参照商品
       *  return {boolean} 默认return true, 继续执行正常流程; return false不继续执行;
       */
      viewmodel.on('beforeScanEnterService', function (args) {
        if (viewmodel.getParams().bStorageCardSale || viewmodel.getParams().bStorageCardBackBill) {
          if (viewmodel.getParams().bStorageCardBackBill) {
            let backBill_checked = viewmodel.getBillingContext('backBill_checked', 'product')();
            backBill_checked ? args.config.params.isNegative = true : args.config.params.isNegative = false;
          }
          let products = viewmodel.getBillingContext('products')();
          let cardnum = args.config.params.keyword;
          if (products && products.find(p => p.cStorageCardNum === cardnum)) {
            cb.utils.alert('该储值卡号已录入, 请勿重复录入');
            return false;
          }
          args.config.params.scanRange = ['StorageCard'];
        }

        //扫码支持查询实体卡券商品 sunhyu
        if (viewmodel.getParams().bCardCoupon || viewmodel.getParams().bCardCouponBack || viewmodel.getParams().bCardCouponOriginBack) {
          let products = viewmodel.getBillingContext('products')();
          let couponnum = args.config.params.keyword;
          if (products && products.length > 0) {
            for (let i = 0; i < products.length; i++) {
              if(products[i].cCouponsn === couponnum){
                cb.utils.alert('该卡券卡号已录入, 请勿重复录入');
                return false;
              }else if(!cb.utils.isEmpty(products[i].beginCouponsn)){
                cb.utils.alert('已使用卡券号范围录入方式, 不允许输入卡号');
                return false;
              }
            }
          }
          args.config.params.scanRange = ['CouponCard'];
          if (viewmodel.getParams().bCardCoupon) {
            args.config.params.queryAction = 0;//卡券
          } else if (viewmodel.getParams().bCardCouponBack) {
            args.config.params.queryAction = 1;//卡券非原单退
          } else if (viewmodel.getParams().bCardCouponOriginBack) {
            args.config.params.queryAction = 2;//卡券原单退
          }
        }

        // 继续执行正常流程
        return true;
      })

      /* 存量参照前事件 */
      viewmodel.on('beforeReferBrowse', function (args) {
        var defaultWarehouse = viewmodel.getBillingContext('defaultWarehouse')();
        args.where.billData = {
          billnum: 'rm_retailvouch',
          externalData: {
            warehouse:
            defaultWarehouse.iWarehouseid
          }
        }
      });

      /* 存量参照数据填充 */
      viewmodel.on('beforeReferValueChange', function (args) {
        var promise = new cb.promise();
        var proxy = cb.rest.DynamicProxy.create({
          post: {
            url: '/mall/bill/querySkuByIds.do',
            method: 'POST'
          }
        });
        var params = [];
        args.value.forEach(element => {
          params.push(element.productskus_id);
        });
        //发送请求
        proxy.post(params, (err, result) => {
          if (err) {
            cb.utils.alert(err.message, 'error');
            promise.reject();
          } else if (result === undefined || result == null) {
            cb.utils.alert('返回结果为空', "error");
            promise.reject();
          } else { // cb.utils.alert('得到返回结果', "success");
            for (var i = 0; i < args.value.length; i++) {
              for (var j = 0; j < result.length; j++) {
                if (args.value[i].productskus_id === result[j].productsku) {
                  Object.assign(args.value[i], result[j]);
                  break;
                }
              }
            }
            promise.resolve();
          }
        });
        return promise;
      });

      /* 录入会员 */
      viewmodel.on('beforeInputMember', function (args) {
        let originBillHeader = viewmodel.getBillingContext('originBillHeader')()
        let bAmountAdjustment = originBillHeader ? originBillHeader.bAmountAdjustment : false;
        let isAddMember = false; //添加一个判断是否添加会员的标志，执行过现场折扣促销活动等优惠活动时需要允许添加会员
        if (bAmountAdjustment == true) {
          cb.utils.alert('调整状态不允许录入会员！', 'error');
          return false;
        }

        let products = viewmodel.getBillingContext('products')()
        //执行过促销活动、现场折扣、优惠券等优惠活动后，允许录入会员，只是不取会员价
        let coupons = viewmodel.getBillingContext('coupons', 'product')();
        if(coupons){
          isAddMember = true;
        }
        for(let i=0; i<products.length; i++){
          if((products[i].fDiscount != 0) || (!cb.utils.isEmpty(products[i].promotionTips))){
            isAddMember = true;
          }
        }

        if(isAddMember){
          args.key = "SE_Member";  //不需要走公共校验逻辑，允许录入会员，但不取会员价，
          viewmodel.getParams().isAddMember = true;  //viewmodel中维护一个判断参数，后面不带入会员价使用
          return true;
        }
        for (let i = 0; i < products.length; i++) {
          if (products[i].autoPromotion) {
            cb.utils.alert('已经执行了商品促销/秒杀，不能录入会员！', 'error');
            return false
          }
          if (products[i]["ikitType"] == 2) {
            cb.utils.alert('已经执行过促销,不允许录入会员！', 'error');
            return false;
          }
        }

        return true
      })

      /* 新增商品之前（商品参照） */
      viewmodel.on('beforeAddProduct', function (args) {
        let originBillHeader = viewmodel.getBillingContext('originBillHeader')()
        let bcustomizedOrder = originBillHeader ? originBillHeader.bcustomizedOrder : false;
        let bAmountAdjustment = originBillHeader ? originBillHeader.bAmountAdjustment : false;
        if (bcustomizedOrder == true) {
          cb.utils.alert('定制类型不允许增加商品行！', 'error');
          return false;
        }
        if (bAmountAdjustment == true) {
          cb.utils.alert('调整状态不允许增加商品行！', 'error');
          return false;
        }
        //预订变更处理是否允许新增商品
        let billingStatus = viewmodel.getBillingContext('billingStatus')();
        let industry = cb.rest.AppContext.user.industry;
        let ibillSource = originBillHeader ? originBillHeader.ibillSource : false;
        if (viewmodel.getParams().presellChange || (billingStatus == 'Shipment')) {
          if ((industry == 20) && (ibillSource == 2)) { //ktv行业，单据来源为商城普通
            cb.utils.alert('当前单据状态下不允许增加商品行！', 'error');
            return false;
          }
        }

        if (viewmodel.getParams().bStorageCardRecharge) {     // 储值卡充值状态
          cb.utils.alert('储值状态不允许增加商品行！', 'error');
          return false;
        }
        if (viewmodel.getParams().bMemberWalletRecharge) {     // 会员钱包充值状态
          cb.utils.alert('会员钱包状态不允许增加商品行！', 'error');
          return false;
        }

        if (viewmodel.getParams().bStorageCardSale || viewmodel.getParams().bStorageCardBackBill) {   // 售卡退卡
          let flag = true;
          let skus = args.referProduct.sku;
          let goods = args.referProduct.goods;
          if (skus && skus.length > 0) {
            for (let i = 0; i < skus.length; i++) {        // 只允许添加实体卡商品
              if (skus[i].realProductAttributeType != 3) {
                flag = false;
                break;
              }
            }
          }
          if (goods && goods.length > 0) {
            for (let i = 0; i < goods.length; i++) {        // 只允许添加实体卡商品
              if (goods[i].realProductAttributeType != 3) {
                flag = false;
                break;
              }
            }
          }
          if (!flag) {
            cb.utils.alert('售卡状态不允许添加非实体储值卡商品行！', 'error');
            return false;
          }
          let products = viewmodel.getBillingContext('products')();
          if (skus && skus.length > 0) {
            for (let i = 0; i < skus.length; i++) {        // 只允许添加实体卡商品
              if (skus[i].cardNum != null && products && products.find(p => p.cStorageCardNum == skus[i].cardNum)) {
                flag = false;
                break;
              }
            }
          }
          if (goods && goods.length > 0) {
            for (let i = 0; i < goods.length; i++) {        // 只允许添加实体卡商品
              if (goods[i].cardNum != null && products && products.find(p => p.cStorageCardNum == goods[i].cardNum)) {
                flag = false;
                break;
              }
            }
          }
          if (!flag) {
            cb.utils.alert('该卡号已经录入, 请勿重复录入', 'error');
            return false;
          }
          // 退卡
          if(viewmodel.getParams().bStorageCardBackBill && viewmodel.getBillingContext('backBill_checked', 'product')()){
            let skuCardNum = _.get(skus, [0, 'cardNum']);
            let goodsCardNum = _.get(goods, [0, 'cardNum']);
            let backCardNum = skuCardNum ? skuCardNum : goodsCardNum;
            if(backCardNum){
              let proxy = new cb.rest.DynamicProxy.create({
                query: {
                  url: '/storedValueCard/queryBills',
                  method: 'POST'
                }
              })
              let params = {
                cardnum: backCardNum,
              }
              let promise = new cb.promise();
              proxy.query(params, (err, result) => {
                if (result instanceof Object) {
                  for(let card in result){
                    let records = result[card];
                    for (let i = 0; i < records.length; i++) {
                      if (records[i].action_type === 1 || records[i].action_type === 2
                        || records[i].action_type === 3 || records[i].action_type === 4) {    //1充值2消费3消费退款4充值退款
                        cb.utils.alert(`储值卡${card}已有充值或消费记录, 不能退卡`, 'error');
                        promise.reject();
                        return false;
                      }
                      if (i === records.length - 1) {
                        if (records[i].action_type !== 100 && records[i].action_type !== 99) {   // 最后一条记录不是100售卡/99导入售卡
                          cb.utils.alert(`储值卡${card}未售出, 不能退卡`, 'error');
                          promise.reject();
                          return false;
                        }
                      }
                    }
                  }
                }
                promise.resolve();
              })
              return promise;
            }
          }
        } else {                                    // 非储值卡实体卡售卡状态
          let flag = true;
          let skus = args.referProduct.sku;
          let goods = args.referProduct.goods;
          if (skus && skus.length > 0) {
            for (let i = 0; i < skus.length; i++) {        // 不允许添加实体卡商品
              if (skus[i].realProductAttributeType == 3) {
                flag = false;
                break;
              }
            }
          }
          if (goods && goods.length > 0) {
            for (let i = 0; i < goods.length; i++) {        // 不允许添加实体卡商品
              if (goods[i].realProductAttributeType == 3) {
                flag = false;
                break;
              }
            }
          }
          if (!flag) {
            cb.utils.alert('非售卡状态不允许添加实体储值卡商品行！', 'error');
            return false;
          }
        }

        //套餐控制
        let skus = args.referProduct.sku;
        let count = 0;
        if (skus && skus.length > 0) {
          for (let i = 0; i < skus.length; i++) {
            if (skus[i].retailPriceDimension == 1 && skus[i].virtualProductAttribute == 9) {
              count = count + 1;
            }
          }
        }

        if (count > 1) {
          cb.utils.alert('只能选择一个套餐商品！', 'error');
          return false;
        }

        let isPackageInput = false;
        let products = viewmodel.getBillingContext('products')()
        for (let i = 0; i < products.length; i++) {
          if (products[i]["isPackageInput"] == true) {
            isPackageInput = true;
            break;
          }
        }
        //选配套餐
        if (isPackageInput) {
          cb.utils.alert('套餐商品没有录入完毕！', 'error');
          return false;
        }

        //优惠券收款方式零售单原单退货逻辑控制
        if(viewmodel.getParams().usedCouponPaymentOriginBack){
          cb.utils.alert('本单使用了优惠券收款方式，不允许增行', 'error')
          return false;
        }

        //卡券商品带入表体行控制 sunhyu
        if (viewmodel.getParams().bCardCoupon || viewmodel.getParams().bCardCouponBack) { //卡券销售 卡券非原单退
          let flag = false;//判断是否不满足卡券商品选择条件 为true时表示不允许选择商品
          let memberInfo = viewmodel.getBillingContext('memberInfo')();
          let productsku = args.referProduct.sku;
          let goods = args.referProduct.goods;
          if (productsku && productsku.length > 0) {
            for (let i = 0; i < productsku.length; i++) {
              if (productsku[i].couponId) {
                if (productsku[i].virtualProductAttribute == 3 && !(memberInfo && memberInfo.mid)) {
                  cb.utils.alert('录入电子卡券商品时请先登录会员！', 'error');
                  return false;
                }
              } else {
                cb.utils.alert('卡券业务类型下只允许录入卡券商品！', 'error');
                return false;
              }
            }
          }
          if (goods && goods.length > 0) {
            for (let i = 0; i < goods.length; i++) {
              if (goods[i].couponId) {
                if (goods[i].virtualProductAttribute == 3 && !(memberInfo && memberInfo.mid)) {
                  cb.utils.alert('录入电子卡券商品时请先登录会员！', 'error');
                  return false;
                }
              } else {
                cb.utils.alert('卡券业务类型下只允许录入卡券商品！', 'error');
                return false;
              }
            }
          }
          //校验卡券商品零售价是否等与减免金额
          let proxy = cb.rest.DynamicProxy.create({
            query: {
              url: '/bill/checkCouponPrice',
              method: 'POST'
            }
          });
          let paramData = (productsku && productsku.length > 0) ? productsku : goods
          let parms = {
            bCardCoupon: viewmodel.getParams().bCardCoupon,
            data: paramData
          };
          let promise = new cb.promise();
          proxy.query(parms, (err, result) => {
            if (err) {
              cb.utils.alert(err.message, 'error');
              promise.reject();
              return false;
            }
            // if (!result) {
            //   // cb.utils.alert('卡券商品零售价与卡券档案减免金额不符,不能选择', 'error');
            //   // promise.reject();
            //   // return false;
            // }
            else {
              //用户通过调价单设置价格 不维护商品档案 此处校验改到保存时校验
              viewmodel.getParams().couponPrice = result;
              //计次卡非原单退货价格赋值
              if (viewmodel.getParams().bCardCouponBack && productsku && productsku.length == 1 && productsku[0].cCouponsn && productsku[0].couponType == 5) {
                // productsku[0].salePrice//零售价
                productsku[0].fPrice = productsku[0].refund_sum//实销价 单价
                productsku[0].fMoney = -1 * productsku[0].fPrice//实销金额 金额
                productsku[0].fDiscount = productsku[0].fPrice - productsku[0].salePrice//折扣额
                productsku[0].fDiscountRate = cb.utils.getRoundValue(100 * productsku[0].fPrice / productsku[0].salePrice,2)//折扣率
                productsku[0].foldPrice = productsku[0].factsellsum//原销售价 单价
                productsku[0].fCoDiscount = productsku[0].fPrice - productsku[0].salePrice//退货折扣额
              }
              //非计次卡非原单退货价格赋值
              if (viewmodel.getParams().bCardCouponBack && productsku && productsku.length == 1 && productsku[0].cCouponsn && productsku[0].couponType != 5) {
                // productsku[0].salePrice//零售价
                productsku[0].fPrice = productsku[0].factsellsum//实销价 单价
                productsku[0].fMoney = -1 * productsku[0].fPrice//实销金额 金额
                productsku[0].fDiscount = productsku[0].fPrice - productsku[0].salePrice//折扣额
                productsku[0].fDiscountRate = cb.utils.getRoundValue(100 * productsku[0].fPrice / productsku[0].salePrice,2)//折扣率
                productsku[0].foldPrice = productsku[0].factsellsum//原销售价 单价
                productsku[0].fCoDiscount = productsku[0].fPrice - productsku[0].salePrice//退货折扣额
              }
              promise.resolve();
            }
          });
          return promise;
        } else if (viewmodel.getParams().bCardCouponOriginBack) { //卡券原单退
          let productsku = args.referProduct.sku;
          let goods = args.referProduct.goods;
          if (productsku && productsku.length == 1 && productsku[0].cCouponsn) {
            let key = '';
            let products = viewmodel.getBillingContext('products')();
            let bill = viewmodel.getBillingContext('currentBillHeader')();
            bill["retailVouchDetails"] = products;
            for (let i = 0; i < products.length; i++) {
              if (products[i].cCouponId == productsku[0].couponId && cb.utils.isEmpty(products[i].cCouponsn)) {
                key = products[i].key;
                break;
              }
            }
            if (!cb.utils.isEmpty(key) && productsku[0].couponId && productsku[0].cCouponsn) {
              //卡券商品原单退货扫码拆行处理
              let proxy = cb.rest.DynamicProxy.create({
                query: {
                  url: '/bill/splitretailbysn',
                  method: 'POST'
                }
              });
              let parms = {
                data: JSON.stringify(bill),
                key: key,
                sn: JSON.stringify(productsku[0]),
                detailkey: ''
              };
              let promise = new cb.promise();
              proxy.query(parms, (err, result) => {
                if (err) {
                  cb.utils.alert(err.message, 'error');
                  promise.reject();
                  return false;
                }
                if (result) {
                  for (let i = 0; i < result.length; i++) {
                    if (result[i].cCouponsn == productsku[0].cCouponsn && productsku[0].couponType == 5) {
                      //计次卡退货价格赋值
                      // result[i].fQuotePrice//零售价
                      // result[i].foldPrice//原销售价
                      result[i].fPrice = productsku[0].refund_sum//实销价 单价
                      result[i].fMoney = -1 * result[i].fPrice//实销金额 金额
                      result[i].fDiscount = result[i].fPrice - result[i].fQuotePrice//折扣额
                      result[i].fDiscountRate = 100 * result[i].fPrice / result[i].fQuotePrice//折扣率
                      result[i].fCoDiscount = result[i].fPrice - result[i].foldPrice//退货折扣额
                    }
                  }
                  viewmodel.billingFunc.updateProducts(result);
                  //更新完表体拆行数据不再新增商品
                  promise.reject();
                  return false;
                }
              });
              return promise;
            } else {
              cb.utils.alert('未找到该卡券号对应卡券商品！', 'error');
              return false;
            }
          } else {
            cb.utils.alert('卡券商品原单退货不能选择其它商品！', 'error');
            return false;
          }

          // 因为上面的if/else中都是return，所以这里的代码不可触达，已注释
          // if (goods && goods.length > 0) {
          //   // for (let i = 0; i < goods.length; i++) {
          //   //   if (!goods[i].couponId) {
          //   cb.utils.alert('卡券商品原单退货不能选择其它商品！', 'error');
          //   return false;
          //   //   }
          //   // }
          // }
        } else { //非卡券业务
          let productsku = args.referProduct.sku;
          let goods = args.referProduct.goods;
          if (productsku && productsku.length > 0) {
            for (let i = 0; i < productsku.length; i++) {
              if (productsku[i].couponId) {
                cb.utils.alert('卡券业务类型下才能选择卡券商品！', 'error');
                return false;
              }
            }
          }
          if (goods && goods.length > 0) {
            for (let i = 0; i < goods.length; i++) {
              if (goods[i].couponId) {
                cb.utils.alert('卡券业务类型下才能选择卡券商品！', 'error');
                return false;
              }
            }
          }
        }

        return true
      })

      //删除商品行前校验
      viewmodel.on('beforeDeleteProductCheck', function (args) {
        let originBillHeader = viewmodel.getBillingContext('originBillHeader')();
        let productRows = viewmodel.getBillingContext('products')();
        let billingStatus = viewmodel.getBillingContext('billingStatus')();
        //预订变更
        let industry = cb.rest.AppContext.user.industry;
        let ibillSource = originBillHeader ? originBillHeader.ibillSource : false;
        //预订变更点击控制、预订交货同样的控制（ktv）
        if (viewmodel.getParams().presellChange || (billingStatus == 'Shipment')) {
          let selectRow = null;
          for (let i = 0; i < productRows.length; i++) {
            if (productRows[i].key == args.key) selectRow = productRows[i];
          }
          let bChangeAddProduct = null;
          if (selectRow) {
            bChangeAddProduct = selectRow.bChangeAddProduct; //用来判断是否本次变更新增的商品行

          }
          if ((industry == 20) && (ibillSource != 2) && (ibillSource != 0)) { //ktv行业，单据来源为非商城普通
            if (!bChangeAddProduct) {
              cb.utils.alert('当前单据状态下，不允许删除行！', 'error');
              return false;
            }
          }
          if (selectRow) {
            let fOutQuantity = selectRow.fOutQuantity;
            let iReturnStatus = selectRow.iReturnStatus;
            let discountFlag = false;
            if (!cb.utils.isEmpty(selectRow.promotionwrite) && (selectRow.promotionwrite.length != 0)) discountFlag = true;
            if ((Number(originBillHeader.fPromotionSum) != 0) || (Number(originBillHeader.fSceneDiscountSum) != 0) ||
              (Number(originBillHeader.fPointPayMoney) != 0) || (Number(originBillHeader.fGiftApportion) != 0)) {
              if (!selectRow.bChangeAddProduct) discountFlag = true; //执行过优惠等活动，并且当前行不是新增行的
            }
            if (fOutQuantity > 0 || (iReturnStatus == 2) || (!cb.utils.isEmpty(selectRow.dCookPrtDate)) || discountFlag) { //已出品的行，退品行不允许删除,x销售厨打时间非空，执行过优惠的
              cb.utils.alert('当前行不允许删除！', 'error');
              return false;
            }
          }
        }

        //优惠券收款方式零售单原单退货逻辑控制
        if(viewmodel.getParams().usedCouponPaymentOriginBack){
          cb.utils.alert('本单使用了优惠券收款方式，不允许删行', 'error')
          return false;
        }

      })

      /* 新增商品之后（商品参照） */
      viewmodel.on('afterAddProduct', function (args) {
        let { exportData,products } = args;
        if(products.sku && products.sku.length == 1 && products.sku[0].cCouponsn && products.sku[0].couponType == 5 && viewmodel.getParams().bCardCouponBack){
          exportData.dataSource.forEach(item => {
            item.fPrice = products.sku[0].fPrice//实销价 单价
            item.fMoney = products.sku[0].fMoney//实销金额 金额
            item.fDiscount = products.sku[0].fDiscount//折扣额
            item.fDiscountRate = products.sku[0].fDiscountRate//折扣率
            item.fCoDiscount = products.sku[0].fCoDiscount//退货折扣额
            item.foldPrice = products.sku[0].foldPrice//原销售价
          })
        }else if(products.sku && products.sku.length == 1 && products.sku[0].cCouponsn && products.sku[0].couponType != 5 && viewmodel.getParams().bCardCouponBack){
          exportData.dataSource.forEach(item => {
            item.fPrice = products.sku[0].fPrice//实销价 单价
            item.fMoney = products.sku[0].fMoney//实销金额 金额
            item.fDiscount = products.sku[0].fDiscount//折扣额
            item.fDiscountRate = products.sku[0].fDiscountRate//折扣率
            item.fCoDiscount = products.sku[0].fCoDiscount//退货折扣额
            item.foldPrice = products.sku[0].foldPrice//原销售价
          })
        }

        if(cb.rest.interMode === 'touch' && products.goods && products.goods.length == 1 && products.goods[0].productskus.length > 1){
          _freeConfigSpec.openSpecView(args);
        }

        if(viewmodel.getParams().bStorageCardSale || viewmodel.getParams().bStorageCardBackBill){
          let isNegative = false;
          if(viewmodel.getParams().bStorageCardBackBill){
            isNegative = viewmodel.getBillingContext('backBill_checked', 'product')();
          }
          if(isNegative){ // 储值卡售卡可以使用现场折扣, 储值卡退卡根据售卡时的余额和折扣额计算出实际应退的金额
            let initial_balance = products.sku[0].initial_balance;
            let storage_balance = products.sku[0].storage_balance ? products.sku[0].storage_balance : products.sku[0].initial_balance;
            let storage_disaccount = products.sku[0].storage_disaccount ? products.sku[0].storage_disaccount : 0;
            let skuSalePrice = viewmodel.billingFunc.formatMoney(storage_balance - storage_disaccount);
            if(products.sku && products.sku.length == 1 && products.sku[0].cardNum){
              exportData.dataSource.forEach(item => {
                item.fPrice = skuSalePrice; //实销价 单价
                item.fMoney = viewmodel.billingFunc.formatMoney(skuSalePrice * item.fQuantity); //实销金额 金额
                item.fDiscount = viewmodel.billingFunc.formatMoney(storage_disaccount * item.fQuantity);  //折扣额
                item.fDiscountRate = Number(cb.utils.getRoundValue((storage_balance - storage_disaccount)  * 100 / storage_balance, 2));  //折扣率
                item.fCoDiscount = viewmodel.billingFunc.formatMoney(storage_disaccount * item.fQuantity);  //退货折扣额
              })
            }
          }
        }

        // 触屏/移动端扫码录商品条码包含金额, 商品有调价单 190731 hanzc
        if(cb.rest.interMode == 'touch' || cb.rest.interMode == 'mobile'){
          if (exportData && exportData.dataSource && exportData.dataSource.length > 0) {
            exportData.dataSource.forEach(item => {
              if (item.__codeType == '12') {    // 条码包含金额
                let tempMoney = viewmodel.billingFunc.formatMoney(item.fPrice * item.fQuantity);
                if(viewmodel.billingFunc.formatMoney(tempMoney - item.fMoney) !== 0){   // 单价*数量 != 金额, 认为有做调价, 重算数量
                  item.fQuantity = item.fMoney / item.fPrice; // 不设精度, 避免重算金额多0.01
                  // item.fQuantity = Number(cb.utils.getRoundValue(item.fMoney / item.fPrice, cb.rest.AppContext.option.quantitydecimal));
                }
              }
            })
          }
        }

        //预定交货和预定变更状态下，新增商品时，默认带入操作员绑定的营业员
        if('Shipment' == viewmodel.getBillingContext('billingStatus')()){
          let isNotEmptyEmployee = true;
          let employeeInfo = viewmodel.getBillingContext('defaultSalesClerk','salesClerk')();
          if(cb.utils.isEmptyObject(employeeInfo))  isNotEmptyEmployee = false;
          if (exportData && exportData.dataSource && exportData.dataSource.length > 0 && isNotEmptyEmployee){
            exportData.dataSource.forEach(item => {
              item.iEmployeeid = employeeInfo.id;
              item.iEmployeeid_name = employeeInfo.name;
            })
          }
        }

        return true
      })

      /* 新增商品后 */
      viewmodel.on('afterFinalAddProduct', function (args) {
        let originBillHeader = viewmodel.getBillingContext('originBillHeader')();
        let bGiveawayList = originBillHeader ? originBillHeader.bGiveawayList : false;
        let productRows = viewmodel.getBillingContext('products')();
        const billingStatus = viewmodel.getBillingContext('billingStatus')();
        const bDeliveryModify = originBillHeader ? originBillHeader.bDeliveryModify : false;

        // 称重时秤的示数重量不能为负 190726 hanzc
        if (viewmodel.getBillingContext('weigh', 'electronicBalance')() < 0) {
          if (args && args.products && args.products.length > 0) {
            args.products.forEach(item => {
              if (item.enableWeight && (!item.__codeType || item.__codeType == '0')) {
                item.fQuantity = 0;
                item.fQuoteMoney = 0;
                item.fMoney = 0;
              }
            })
          }
        }

        let products = args.products;
        //预订变更状态下新增商品后需要更改组号
        if (viewmodel.getParams().presellChange || (billingStatus === 'Shipment' && bDeliveryModify)) {
          let newGroupDate = new Date();
          newGroupDate = newGroupDate.format('yyyy-MM-dd hh:mm:ss');
          let newGroupPerson = (cb.rest.AppContext.user || {}).id;
          if (productRows.length > 0) { //已有商品行，从商品参照添加商品
            //获取当前商品行的最大组号
            let maxGroupNum = 0;
            let bChangeAddProduct = false;
            for (let i = 0; i < productRows.length; i++) {
              if (productRows[i].iGroupNum > maxGroupNum) {
                maxGroupNum = productRows[i].iGroupNum;
              }
              if (productRows[i].bChangeAddProduct != null) {
                bChangeAddProduct = productRows[i].bChangeAddProduct;
              }
            }
            if (maxGroupNum < 100) {
              //如果组号最大值小于100，说明当前行没有变更添加后的商品行，则给本次新加的商品行赋值为101
              let firstGroupNum = 101;
              if (products.length != 0) {
                for (let i = 0; i < products.length; i++) { //给当前新添加的商品行赋组号值
                  products[i].iGroupNum = firstGroupNum;
                  products[i].iGroupPerson = newGroupPerson;
                  products[i].dGroupDate = newGroupDate;
                  products[i].bChangeAddProduct = true;  //做一个标志，表示当前行本次已经添加过商品行
                }
              }
            } else if (bChangeAddProduct) { //当前单据已经添加过商品行，则之后加的商品行的组号同当前商品行的最大组号
              if (products.length != 0) {
                for (let i = 0; i < products.length; i++) { //给当前新添加的商品行赋组号值
                  products[i].iGroupNum = maxGroupNum;
                  products[i].iGroupPerson = newGroupPerson;
                  products[i].dGroupDate = newGroupDate;
                  products[i].bChangeAddProduct = true;  //做一个标志，表示当前行本次已经添加过商品行
                }
              }
            } else { //新加的商品行取当前组号+1，作为新加商品行的组号
              if (products.length != 0) {
                for (let i = 0; i < products.length; i++) { //给当前新添加的商品行赋组号值
                  products[i].iGroupNum = maxGroupNum + 1;
                  products[i].iGroupPerson = newGroupPerson;
                  products[i].dGroupDate = newGroupDate;
                  products[i].bChangeAddProduct = true;  //做一个标志，表示当前行本次已经添加过商品行
                }
              }
            }
          }
        }
        if (bGiveawayList == true) { //赠品状态下选择完商品后修改单价、折扣额、现场折扣额、折扣率和现场折扣率
          if (products.length != 0) {
            let fVIPDiscount = 0;
            let fPromotionDiscount = 0;
            for (let i = 0; i < products.length; i++) {
              products[i].fPrice = 0;
              products[i].fDiscount = products[i].fQuoteMoney;
              //现场折扣额=零售金额-会员折扣额-促销折扣额
              if (!cb.utils.isEmpty(products[i].fVIPDiscount)) {
                fVIPDiscount = products[i].fVIPDiscount;
              }
              if (!cb.utils.isEmpty(products[i].fPromotionDiscount)) {
                fPromotionDiscount = products[i].fPromotionDiscount;
              }
              products[i].fSceneDiscount = products[i].fQuoteMoney - fVIPDiscount - fPromotionDiscount;
              products[i].fDiscountRate = 0;
              products[i].fSceneDiscountRate = 0;
              products[i].fMoney = 0;
            }
          }
        }
        //ktv行业房费商品处理
        let storeId = cb.rest.AppContext.user.storeId;
        let time_interval_name = [];
        if (cb.rest.AppContext.tenant.industry == 20 && !cb.utils.isEmpty(products) && (products.length > 0)) { //ktv行业处理带入房费商品时，默认带入时段
          for (let i = 0; i < products.length; i++) {
            if (products[i]['product_productProps!define1'] && products[i]['product_productProps!define1'].includes("房费")) { //房费商品
              if (!cb.utils.isEmpty(products[i].free1)) {
                time_interval_name.push(products[i].free1); //把商品时段名添加到列表
              }
            }
          }
          if (time_interval_name.length > 0) { //如果商品行存在时段信息，查询时段对应的时间
            let time_period = viewmodel.getParams().time_period;
            let productRows = viewmodel.getBillingContext('products')();//当前单据已经存在的商品行
            if (time_period.length > 0) {
              for (let i = 0; i < products.length; i++) {
                common.addProductTimePeriod(products[i],viewmodel);
              }
            }
          }
        }
        //非原单退货，新增退货商品时，开单界面显示退字（haoyj）
        for (let i = 0; i < products.length; i++) {
          if (products[i].fQuantity < 0) {
            products[i].iproducticon = "2";
          }
        }

        let currentPromotionFilter = viewmodel.getBillingContext('promotionFilter')();
        let isPromotionProduct=false;
        for (let i = 0; i < products.length; i++) {
          if (products[i].iPromotionProduct==1 && products[i]._giftInfo.isShare==1) {
            isPromotionProduct=true;
          }
        }

        //录入赠品完毕的时候  调用后台促销分摊服务
        if(isPromotionProduct)
        {
        if(!currentPromotionFilter)
        {
          let promotionIds=[];
          const promotions = [];
          for(let i=0; i<productRows.length; i++){
            if(productRows[i].promotionwrite)
            {
            for(let j=0; j<productRows[i].promotionwrite.length; j++)
             {
                 if(promotionIds.indexOf(productRows[i].promotionwrite[j].iPromotionid)==-1)
                 {
                     promotionIds.push(productRows[i].promotionwrite[j].iPromotionid);
                     var item = {
                      ID: productRows[i].promotionwrite[j].iPromotionid,
                      name : productRows[i].promotionwrite[j].cPromotionName,
                      type : productRows[i].promotionwrite[j].iPromotionType,
                      fbitSeller : 0,
                      iSendPoint : productRows[i].iSendPoint,
                      priceRule : productRows[i].priceRule,
                      };
                     promotions.push(item);
                 }
             }
            }
          }

           for(let i=0; i<products.length; i++){
            if(products[i].promotionwrite)
            {
            for(let j=0; j<products[i].promotionwrite.length; j++)
            {
               if(promotionIds.indexOf(products[i].promotionwrite[j].iPromotionid)==-1)
               {
                 promotionIds.push(products[i].promotionwrite[j].iPromotionid);
                 var item = {
                  ID: products[i].promotionwrite[j].iPromotionid,
                  name : products[i].promotionwrite[j].cPromotionName,
                  type : products[i].promotionwrite[j].iPromotionType,
                  fbitSeller : 0,
                  iSendPoint : products[i].iSendPoint,
                  priceRule : products[i].priceRule,
                  };
                 promotions.push(item);
               }
              }
            }
           }

           let newdata = [];
           for (let product of productRows){
             newdata.push(product);
           }
           for (let product of products){
            newdata.push(product);
          }
          let  arr =[];
          for (let product of newdata){
            arr.push(product);
          }

           for (let product of newdata){
                 product.fPrice = product.fVIPPrice || product.fQuotePrice;
                 let { fPrice, fQuantity, fQuotePrice} = product
                 delete product.promotionwrite
                 delete product.autoPromotion
                 delete product.fPromotionDiscount
                 delete product.fPromotionPrice
                 delete product.promotionTips
                 product.fMoney = viewmodel.billingFunc.formatMoney(fPrice * fQuantity);
                 product.fDiscount = viewmodel.billingFunc.formatMoney((fQuotePrice - fPrice) * fQuantity)
                 product.fDiscountRate = 100
         }

          /* const config = {
            url: 'mall/bill/preferential/executepreferential',
            method: 'POST',
            params: {
                promotions: JSON.stringify(promotions),
                data: JSON.stringify(newdata)
            }
        };*/

        var proxy = cb.rest.DynamicProxy.create({
          ensure: {
            url: 'mall/bill/preferential/executegiftpreferential',
            method: 'POST',
          }
        });

        let parms = {
          promotions: JSON.stringify(promotions),
          data: JSON.stringify(newdata)
        };

        proxy.ensure(parms, (err, json) => {
       // proxy(config).then(json => {
              //  if (json.code !== 200) {
               //     cb.utils.alert(json.message, 'error');
               //     return false;
              //  }
                json.retailVouchDetails.forEach(p => {

                  /*for(let i=0; i<productRows.length; i++){
                    if(productRows[i].key == p.key)
                     {
                       productRows[i]=p;
                     }
                  }
                  for(let i=0; i<products.length; i++){
                    if(products[i].key == p.key)
                    {
                      products[i]=p;
                    }
                  }*/

                  for(let i=0; i<arr.length; i++){
                    if(arr[i].key == p.key)
                     {
                      let text = []
                      if(p.promotionwrite)
                      {
                      p.promotionwrite.forEach(promotion => {
                        text.push(promotion.cPromotionName)
                      })
                      p.promotionTips = text.join(',');
                      p.isdevide=true;
                      }
                      arr[i]=p;
                     }
                  }
                });

               // viewmodel.billingFunc.updateProducts(productRows);
               viewmodel.billingFunc.updateProducts(arr);
            });

        }
      }

        return true
      })

      /* 录入商品后是否判断严格意义换货 */
      viewmodel.on('isChangeGoods', function(args){
        if(viewmodel.getParams().bStorageCardBackBill){ //储值卡退卡新加商品不做换货处理
          return false;
        }
        return true;
      })

      /* 打开表头之前 */
      viewmodel.on('beforeOpenRetailHeader', function (args) {
        viewmodel.setReadOnly(false);
        let originBillHeader = viewmodel.getBillingContext('originBillHeader')()
        let bAmountAdjustment = originBillHeader ? originBillHeader.bAmountAdjustment : false;
        let billingStatus = viewmodel.getBillingContext('billingStatus')();
        if (billingStatus === 'FormerBackBill') {
          let iTakeway = originBillHeader.iTakeway;
          // 家具行业、或者原单为中心配送时,才能修改表头
          if (cb.rest.AppContext.tenant.industry == 19 || iTakeway == 2) {
            viewmodel.setReadOnly(false);
            originBillHeader.bExtendHeader = true;
            viewmodel.get("bReturnStore_1").setValue(false);
            // viewmodel.billingFunc.modifyPreferentialHeader(originBillHeader);
          }
        }
        if (bAmountAdjustment == true) {
          // cb.utils.alert('调整状态下不能修改表头信息！', 'error');
          // return false;
        }
        //打开表头之前，ktv行业表头有房间参照的,给房间参照添加过滤条件
        let industry = cb.rest.AppContext.user.industry;
        if (viewmodel.get('room_name') && (20 == industry)) {
          let condition = { "isExtend": true, simpleVOs: [] };
          let store = cb.rest.AppContext.user.storeId
          condition.simpleVOs.push({//只显示当前门店的相关数据
            field: 'store',
            op: 'eq',
            value1: store
          });
          viewmodel.get('room_name').setFilter(condition);
        } else if (viewmodel.get('room_name') && (20 != industry)) {
          viewmodel.get('room_name').setVisible(false);
        }
        //预订业务控制表头是否允许打开
        let ibillSource = originBillHeader ? originBillHeader.ibillSource : false;
        if (viewmodel.getParams().presellChange || (billingStatus == 'Shipment')) {
          if ((industry == 20) && (ibillSource == 2)) { //ktv行业，单据来源为商城普通
            cb.utils.alert('当前单据状态下不允许修改表头！', 'error');
            return false;
          }
        }
        return true
      })

      viewmodel.get("iReturnWarehousid_1_name") && viewmodel.get("iReturnWarehousid_1_name").on('beforeBrowse', function (data) {
        var orgids = [];
        var userOrgs = cb.rest.AppContext.user.userOrgs;
        userOrgs.forEach(function (item, index) {
          if (item.org_name === undefined) return;
          orgids.push(item.org);
        })
        if (orgids.length == 0) {
          cb.utils.alert("请先选择组织！");
          return false;
        }
        //参照面板中只显示非门店仓和启用状态为启用的仓库
        //1.过滤非门店仓
        var condition = { "isExtend": true, simpleVOs: [] };
        condition.simpleVOs.push({
          field: 'wStore',
          op: 'eq',
          value1: false
        });
        // 2.启用状态为启用
        condition.simpleVOs.push({
          field: 'iUsed',
          op: 'eq',
          value1: 'enable'
        });

        if (orgids) {
          condition.simpleVOs.push({
            field: 'org',
            op: 'in',
            value1: orgids
          });
        }
        // data.context.setFilter(condition);
        viewmodel.get("iReturnWarehousid_1_name").setFilter(condition);
      });

      /*获取业务类型数据前*/
      viewmodel.on('beforeGetBusinessType', function (params) {
        /*非定制情况下  过滤掉定制的数据*/
        let originBillHeader = viewmodel.getBillingContext('originBillHeader')()
        let bcustomizedOrder = originBillHeader ? originBillHeader.bcustomizedOrder : false;
        if (bcustomizedOrder == true) {
          // 定制
          params.condition.simpleVOs.push({ "field": "madeType", "op": "eq", "value1": 1 });
        } else {
          // 非定制
          params.condition.simpleVOs.push({ "field": "madeType", "op": "neq || is_null", "value1": 1 });
        }

        // 充值状态下, 只允许[储值]业务类型
        if (viewmodel.getParams().bStorageCardRecharge || viewmodel.getParams().bMemberWalletRecharge) {
          let saleTypeSimpleVOs = params.condition.simpleVOs.find(simpleVO => simpleVO.field == "saleType");
          saleTypeSimpleVOs
            ? (() => { saleTypeSimpleVOs.op = "eq"; saleTypeSimpleVOs.value1 = 30; })()
            : params.condition.simpleVOs.push({ "field": "saleType", "op": "eq", "value1": 30 });

        } else {
          // params.condition.simpleVOs.push({ "field": "saleType", "op": "neq || is_null", "value1": 30 });
        }

        // 售卡状态下, 只允许[售卡]业务类型
        if (viewmodel.getParams().bStorageCardSale || viewmodel.getParams().bStorageCardBackBill) {
          let saleTypeSimpleVOs = params.condition.simpleVOs.find(simpleVO => simpleVO.field == "saleType");
          saleTypeSimpleVOs
            ? (() => { saleTypeSimpleVOs.op = "eq"; saleTypeSimpleVOs.value1 = 35; })()
            : params.condition.simpleVOs.push({ "field": "saleType", "op": "eq", "value1": 35 });

        } else {
          // params.condition.simpleVOs.push({ "field": "saleType", "op": "neq || is_null", "value1": 35 });
        }

        // 控制卡券业务类型参照 sunhyu
        if (viewmodel.getParams().bCardCoupon || viewmodel.getParams().bCardCouponBack) {
          let saleTypeSimpleVOs = params.condition.simpleVOs.find(simpleVO => simpleVO.field == "saleType");
          saleTypeSimpleVOs ? (() => {
            saleTypeSimpleVOs.op = 'eq';
            saleTypeSimpleVOs.value1 = 36;
          })() : params.condition.simpleVOs.push({ "field": "saleType", "op": "eq", "value1": 36 });
        } else {
          // params.condition.simpleVOs.push({ "field": "saleType", "op": "neq || is_null", "value1": 36 });
        }

        // 房间详情开单时, 变更业务类型
        var roomdetail = cb.cache.get("roomdetail");
        if (roomdetail != undefined && roomdetail != null) {
          // 大堂 或 不存在数据时 设置成预订, 存在数据则为预定变更(状态未实装)
          if (roomdetail == "reserve") {
            var saleTypeSimpleVOs = params.condition.simpleVOs.find(simpleVO => simpleVO.field == "saleType");
            saleTypeSimpleVOs ? (() => {
              saleTypeSimpleVOs.op = 'eq';
              saleTypeSimpleVOs.value1 = 2;
            })() : params.condition.simpleVOs.push({ "field": "saleType", "op": "eq", "value1": 2 });

            var stopstatusSimpleVOs = params.condition.simpleVOs.find(simpleVO => simpleVO.field == "stopstatus");
            stopstatusSimpleVOs ? (() => {
              stopstatusSimpleVOs.op = 'eq';
              stopstatusSimpleVOs.value1 = false;
            })() : params.condition.simpleVOs.push({ "field": "stopstatus", "op": "eq", "value1": false });

            var storeTypeSimpleVOs = params.condition.simpleVOs.find(simpleVO => simpleVO.field == "storeType");
            storeTypeSimpleVOs ? (() => {
              storeTypeSimpleVOs.op = 'like';
              storeTypeSimpleVOs.value1 = 1;
            })() : params.condition.simpleVOs.push({ "field": "storeType", "op": "eq", "value1": false });

          } else {
            var saleTypeSimpleVOs = params.condition.simpleVOs.find(simpleVO => simpleVO.field == "saleType");
            saleTypeSimpleVOs ? (() => {
              saleTypeSimpleVOs.op = 'eq';
              saleTypeSimpleVOs.value1 = 2;
            })() : params.condition.simpleVOs.push({ "field": "saleType", "op": "eq", "value1": 2 });

            var stopstatusSimpleVOs = params.condition.simpleVOs.find(simpleVO => simpleVO.field == "stopstatus");
            stopstatusSimpleVOs ? (() => {
              stopstatusSimpleVOs.op = 'eq';
              stopstatusSimpleVOs.value1 = false;
            })() : params.condition.simpleVOs.push({ "field": "stopstatus", "op": "eq", "value1": false });

            var storeTypeSimpleVOs = params.condition.simpleVOs.find(simpleVO => simpleVO.field == "storeType");
            storeTypeSimpleVOs ? (() => {
              storeTypeSimpleVOs.op = 'like';
              storeTypeSimpleVOs.value1 = 1;
            })() : params.condition.simpleVOs.push({ "field": "storeType", "op": "eq", "value1": false });
          }
        }
      })

      //隐藏右侧上一单界面
      viewmodel.on('extendIsShowLastBill', function (args) {
        //卡券 卡券非原单退状态下隐藏右侧上一单小界面 sunhyu
        if (viewmodel.getParams().bCardCoupon || viewmodel.getParams().bCardCouponBack) {
          return false;
        }
        //售卡 储值卡非原单退状态下隐藏右侧上一单小界面
        if (viewmodel.getParams().bStorageCardSale || viewmodel.getParams().bStorageCardBackBill) {
          return false;
        }
      })

      /* 执行action前操作*/
      viewmodel.on('beforeExecAction', function (args) {
        let { key } = args;
        if (key == 'ModifyQuantity') {
          //角色权限中，零售开单未勾选数量权限，则不允许修改数量
          if (!cb.rest.AppContext.user.authCodes.includes('RM42')) {
            cb.utils.alert('操作员' + cb.rest.AppContext.user.name + '没有数量按钮的功能权限，不能操作', 'error');
            return false;
          }
        }

        let isPackageInput = false;
        let products = viewmodel.getBillingContext('products')()
        for (let i = 0; i < products.length; i++) {
          if (products[i]["isPackageInput"] == true) {
            isPackageInput = true;
            break;
          }
        }
        //选配套餐
        if (isPackageInput) {
          switch (key) {
            case "SetPromotionFocus":
              cb.utils.alert('套餐商品未录入完毕,不允许执行促销活动', 'error');
            case "SceneDiscount":
              cb.utils.alert('套餐商品未录入完毕,不允许执行现场折扣', 'error');
            case "Coupon":
              cb.utils.alert('套餐商品未录入完毕,不允许执行优惠券', 'error');
            case "DoSaleByVipPoint":
              cb.utils.alert('套餐商品未录入完毕,不允许执行积分抵扣', 'error');
            case "EditRow":
              cb.utils.alert('套餐商品未录入完毕,不允许执行改行', 'error');
            case "ModifyPrice":
              cb.utils.alert('套餐商品未录入完毕,不允许执行改零售价', 'error');
              return false;
          }
        }

        let row = viewmodel.getBillingContext('focusedRow')()
        if (row && row.ikitType == 2) {
          switch (key) {
            case "SceneDiscount":
              cb.utils.alert('子件商品不允许执行现场折扣', 'error');
            case "Coupon":
              cb.utils.alert('子件商品不允许执行优惠券', 'error');
            case "DoSaleByVipPoint":
              cb.utils.alert('子件商品不允许执行积分抵扣', 'error');
              return false;
          }
        }

        //卡券 卡券非原单退按钮点击控制 sunhyu
        if (key == 'CardCoupon' || key == 'CardCouponBackBill') {
          if (cb.rest.interMode === 'touch') {
            let lineConnection = viewmodel.getBillingContext('lineConnection', 'offLine')();
            if (!lineConnection) {
              cb.utils.alert('当前处于离线状态,不允许修改卡券业务类型', "error");
              return false;
            }
          }
          if (cb.rest.AppContext.option.isUseCoupon) {
            let authData = viewmodel.getBillingContext('authData')();
            let productRows = viewmodel.getBillingContext('products')();
            if (productRows && productRows.length > 0) {
              cb.utils.alert('已录入商品,不允许修改卡券业务类型', 'error');
              return false;
            }
            if (key == 'CardCoupon') {
              if(authData && !authData.CardCoupon){
                cb.utils.alert('当前操作员无卡券权限', 'error');
                return false;
              }
              viewmodel.getParams().bCardCoupon = true;
              delete viewmodel.getParams()['bCardCouponBack'];
            } else {
              if(authData && !authData.CardCouponBackBill){
                cb.utils.alert('当前操作员无卡券非原单退权限', 'error');
                return false;
              }
              viewmodel.getParams().bCardCouponBack = true;
              delete viewmodel.getParams()['bCardCoupon'];
              viewmodel.billingFunc.ModifyBillStatus('NoFormerBackBill');
            }
            viewmodel.billingFunc.getDefaultBusinessType(36);   // 设置默认业务类型销售方式为36-卡券
          } else {
            cb.utils.alert('未启用卡券销售业务,不允许选择卡券业务类型', 'error');
            return false;
          }
        } else if (viewmodel.getParams().bCardCoupon || viewmodel.getParams().bCardCouponBack) {
          let allowKeys = [
            { key: 'SetPromotionFocus', name: '促销活动' },
            { key: 'SceneDiscount', name: '现场折扣' },
            { key: 'DoSaleByVipPoint', name: '积分抵扣' },
            { key: 'Coupon', name: '优惠券' },
            { key: 'EditRow', name: '改行' },
            { key: 'DeleteRow', name: '删除行' },
            // { key: 'OnlyResumeReceipt', name: '仅挂单' },
            // { key: 'HangSolutionReceipt', name: '解挂' },

          ];
          let allowKey = allowKeys.find(allowKey => allowKey.key == args.key)   // 判断是否点击了禁止使用的开单功能键
          if (!allowKey) {
            cb.utils.alert('卡券状态不允许执行该操作 请重新开单', 'error');
            return false;
          }

        }

        //实体卡券未录入卡号时，不允许执行现场折扣、促销活动、积分抵扣、优惠券核销
        if (viewmodel.getParams().bCardCoupon || viewmodel.getParams().bCardCouponBack || viewmodel.getParams().bCardCouponOriginBack) {
          if(key == 'SetPromotionFocus' || key == 'SceneDiscount' || key == 'DoSaleByVipPoint' || key == 'Coupon'){
            let forbiddenKeys = [
              { key: 'SetPromotionFocus', name: '促销活动' },
              { key: 'SceneDiscount', name: '现场折扣' },
              { key: 'DoSaleByVipPoint', name: '积分抵扣' },
              { key: 'Coupon', name: '优惠券' }
            ];
            let forbiddenKey = forbiddenKeys.find(forbiddenKey => forbiddenKey.key == key);
            let retailVouchDetails = viewmodel.getBillingContext('products')();
            for (let i = 0; i < retailVouchDetails.length; i++) {
              if(retailVouchDetails[i].productrealProductAttributeType == 2 && cb.utils.isEmpty(retailVouchDetails[i].cCouponsn) && cb.utils.isEmpty(retailVouchDetails[i].beginCouponsn) && cb.utils.isEmpty(retailVouchDetails[i].endCouponsn)){
                cb.utils.alert('未录入商品['+retailVouchDetails[i].product_cName+']的卡券号，不能执行'+forbiddenKey.name, 'error');
                return false;
              }
            }
          }
        }

        //储值卡未录入卡号时，不允许执行现场折扣、促销活动、积分抵扣、优惠券核销
        if (viewmodel.getParams().bStorageCardSale || viewmodel.getParams().bStorageCardBackBill) {
          let forbiddenKeys = [
            { key: 'SetPromotionFocus', name: '促销活动' },
            { key: 'SceneDiscount', name: '现场折扣' },
            { key: 'DoSaleByVipPoint', name: '积分抵扣' },
            { key: 'Coupon', name: '优惠券' },
          ];
          let forbiddenKey = forbiddenKeys.find(forbiddenKey => forbiddenKey.key == args.key);
          if (forbiddenKey) {
            let retailVouchDetails = viewmodel.getBillingContext('products')();
            for (let i = 0; i < retailVouchDetails.length; i++) {
              if (retailVouchDetails[i].productrealProductAttributeType == 3
                && cb.utils.isEmpty(retailVouchDetails[i].cStorageCardNum)
                && cb.utils.isEmpty(retailVouchDetails[i].beginCouponsn)
                && cb.utils.isEmpty(retailVouchDetails[i].endCouponsn)) {
                cb.utils.alert(`未录入第${retailVouchDetails[i].rowNumber}行商品${retailVouchDetails[i].product_cName}的卡券号，不能执行${forbiddenKey.name}`, 'error');
                return false;
              }
            }
          }
        }

        /* 充值状态下控制开单功能键 */
        if (viewmodel.getParams().bStorageCardRecharge) {     // 储值卡充值状态
          let forbiddenKeys = [
            { key: 'SetPromotionFocus', name: '促销活动' },
            { key: 'SceneDiscount', name: '现场折扣' },
            { key: 'DoSaleByVipPoint', name: '积分抵扣' },
            { key: 'Coupon', name: '优惠券' },
            { key: 'ModifyPrice', name: '改零售价' },
            { key: 'UpdateBackInfo', name: '退货信息' },
            { key: 'HereAboutStocks', name: '周边库存' },
            { key: 'ResumeReceipt', name: '挂单' },
            { key: 'OnlyResumeReceipt', name: '仅挂单' },
            { key: 'ResumePrint', name: '挂单并打印' },
            { key: 'HangSolutionReceipt', name: '解挂' },
          ];
          let forbiddenKey = forbiddenKeys.find(forbiddenKey => forbiddenKey.key == args.key)   // 判断是否点击了禁止使用的开单功能键
          if (forbiddenKey) {
            cb.utils.alert(`充值状态不允许执行${forbiddenKey.name}`, 'error');
            return false;
          }
        }
        if (viewmodel.getParams().bMemberWalletRecharge) {     // 会员钱包充值状态
          let forbiddenKeys = [
            { key: 'SetPromotionFocus', name: '促销活动' },
            { key: 'SceneDiscount', name: '现场折扣' },
            { key: 'DoSaleByVipPoint', name: '积分抵扣' },
            { key: 'Coupon', name: '优惠券' },
            { key: 'ModifyPrice', name: '改零售价' },
            { key: 'UpdateBackInfo', name: '退货信息' },
            { key: 'HereAboutStocks', name: '周边库存' },
            { key: 'ResumeReceipt', name: '挂单' },
            { key: 'OnlyResumeReceipt', name: '仅挂单' },
            { key: 'ResumePrint', name: '挂单并打印' },
            { key: 'HangSolutionReceipt', name: '解挂' },
          ];
          let forbiddenKey = forbiddenKeys.find(forbiddenKey => forbiddenKey.key == args.key)   // 判断是否点击了禁止使用的开单功能键
          if (forbiddenKey) {
            cb.utils.alert(`会员钱包充值状态不允许执行${forbiddenKey.name}`, 'error');
            return false;
          }
        }

        // 储值卡售卡
        if (key == 'StorageCardSale' || key == 'StorageCardBackBill') {
          if (!cb.rest.AppContext.option.isUseStorageCard) {
            cb.utils.alert('该门店未启用储值卡业务', 'error');
            return false;
          }
          let products = viewmodel.getBillingContext('products')();
          if (key == 'StorageCardSale' && !viewmodel.getParams().bStorageCardSale && products && products.length > 0) {
            cb.utils.alert('业务类型非售卡且开单行非空, 不允许售卡', 'error');
            return false;
          } else if (key == 'StorageCardBackBill' && !viewmodel.getParams().bStorageCardBackBill && products && products.length > 0) {
            cb.utils.alert('业务类型非售卡且开单行非空, 不允许售卡', 'error');
            return false;
          }
          if (key == 'StorageCardSale') {
            viewmodel.getParams().bStorageCardSale = true;
          } else if (key == 'StorageCardBackBill') {
            viewmodel.getParams().bStorageCardBackBill = true;
            viewmodel.billingFunc.ModifyBillStatus('NoFormerBackBill');
          }
          viewmodel.billingFunc.setSearchBoxFocus(true);    // 设置焦点到扫码框
          viewmodel.billingFunc.getDefaultBusinessType(35);       // 售卡销售类型35
          let changeObj = [
            { dataIndex: 'cStorageCardNum', states: [{ name: 'isLineShow', value: true }] }
          ]
          viewmodel.get('retailVouchDetails') && viewmodel.get('retailVouchDetails').setColumnStates(changeObj)

          // 点击售卡/退卡按钮开始进行读卡
          startReadCard(false);
        } else if (viewmodel.getParams().bStorageCardSale || viewmodel.getParams().bStorageCardBackBill) {
          let allowKeys = [
            { key: 'SetPromotionFocus', name: '促销活动' },
            { key: 'SceneDiscount', name: '现场折扣' },
            { key: 'DoSaleByVipPoint', name: '积分抵扣' },
            { key: 'Coupon', name: '优惠券' },
            { key: 'EditRow', name: '改行' },
            { key: 'DeleteRow', name: '删除行' },
            // { key: 'OnlyResumeReceipt', name: '仅挂单' },
            // { key: 'HangSolutionReceipt', name: '解挂' },

          ];
          let allowKey = allowKeys.find(allowKey => allowKey.key == args.key)   // 判断是否点击了禁止使用的开单功能键
          if (!allowKey) {
            cb.utils.alert('售卡状态不允许执行该操作 请重新开单', 'error');
            return false;
          }
        }

        let originBillHeader = viewmodel.getBillingContext('originBillHeader')();
        let bGiveawayList = originBillHeader ? originBillHeader.bGiveawayList : false;
        if (bGiveawayList == true) { //赠品状态下对其他操作进行控制
          let forbiddenKeys = [
            { key: 'MadeGoods', name: '定制' },
            { key: 'Shipment', name: '交货' },
            { key: 'PresellBack', name: '退订' },
            { key: 'FormerBackBill', name: '原单退货' },
            { key: 'NoFormerBackBill', name: '非原单退货' },
            { key: 'OnlineBackBill', name: '电商退货' },
            { key: 'HangSolutionReceipt', name: '解挂' },
            { key: 'StorageCardRecharge', name: '储值卡充值' },
            { key: 'MemberWalletRecharge', name: '会员钱包充值' },
            { key: 'RepairReceipt', name: '补单' },
            { key: 'AfterSaleService', name: '售后' },
            { key: 'OnlineBill', name: '电商订单' },
            { key: 'AdjustMoney', name: '调整' },
            { key: 'FreeGoods', name: '赠品' }
          ];
          let forbiddenKey = forbiddenKeys.find(forbiddenKey => forbiddenKey.key == args.key)   // 判断是否点击了禁止使用的开单功能键
          if (forbiddenKey) {
            cb.utils.alert(`赠品状态不允许执行${forbiddenKey.name}`, 'error');
            return false;
          }
        }

        let billingStatus = viewmodel.getBillingContext('billingStatus')();
        if (billingStatus === 'PresellBill') {        //预订状态下不允许使用储值卡和卡券菜单
          let forbiddenKeys = [
            { key: 'StorageCardSale', name: '储值卡售卡' },
            { key: 'StorageCardRecharge', name: '储值卡充值' },
            { key: 'MemberWalletRecharge', name: '会员钱包充值' },
            { key: 'StorageCardBackBill', name: '储值卡非原单退' },
            { key: 'CardCouponBackBill', name: '卡券非原单退' },
            { key: 'CardCoupon', name: '卡券' }
          ];
          let forbiddenKey = forbiddenKeys.find(forbiddenKey => forbiddenKey.key == args.key)   // 判断是否点击了禁止使用的开单功能键
          if (forbiddenKey) {
            cb.utils.alert(`预订状态不允许执行${forbiddenKey.name}`, 'error');
            return false;
          }
        }
        //预订变更
        let focusedRow = viewmodel.getBillingContext('focusedRow')()
        let industry = cb.rest.AppContext.user.industry;
        let ibillSource = originBillHeader ? originBillHeader.ibillSource : false;
        if (key == 'ModifyQuantity') {
          if (focusedRow['product_productProps!define1'] == "买断房费") { //买断房费商品不允许修改数量
            cb.utils.alert('买断房费不允许修改数量！', 'error');
            return false;
          }
        }
        //预订变更点击控制、预订交货同样的控制（ktv）
        if (viewmodel.getParams().presellChange || (billingStatus == 'Shipment')) {
          let discountFlag = false;
          if (!cb.utils.isEmpty(focusedRow.promotionwrite) && (focusedRow.promotionwrite.length != 0)) discountFlag = true;
          if ((Number(originBillHeader.fPromotionSum) != 0) || (Number(originBillHeader.fSceneDiscountSum) != 0) ||
            (Number(originBillHeader.fPointPayMoney) != 0) || (Number(originBillHeader.fGiftApportion) != 0)) {
            if (!focusedRow.bChangeAddProduct) discountFlag = true; //执行过优惠等活动，并且当前行不是新增行的
          }
          if ((industry == 20) && (ibillSource == 2)) { //ktv行业，单据来源为商城普通
            if (key != 'backProduct' && (key != 'HereAboutStocks') && (key != 'InputEmployee') && (key != 'EditRow')) {
              cb.utils.alert('当前单据状态下，该操作不可用！', 'error');
              return false;
            }
          }
          if (key == 'ModifyQuantity') {
            if (!cb.utils.isEmpty(focusedRow.dCookPrtDate) || discountFlag) { //销售厨打时间不为空，执行过优惠
              cb.utils.alert('该商品行不允许修改数量！', 'error');
              return false;
            }
            if (focusedRow.iGroupNum == 1 || (focusedRow.fOutQuantity > 0) || (focusedRow.iReturnStatus == 2) || (focusedRow.iPromotionProduct == 1)) { //来源于商城的行，已出品的行，已退品的行,赠品行
              cb.utils.alert('该商品行不允许修改数量！', 'error');
              return false;
            }
          }
          if (key == 'ModifyPrice') {
            if (focusedRow.iGroupNum == 1 || (focusedRow.iGroupNum == 3) || (focusedRow.iReturnStatus == 2)) { //来源于商城的行,iGroupNum =1 商城，2预订系统，3美团
              cb.utils.alert('该商品行不允许修改零售价！', 'error');
              return false;
            }
          }
          if (key == 'EditRow') {
            if (focusedRow.iReturnStatus == 2) { //退品行不允许改行
              cb.utils.alert('该商品行不允许改行！', 'error');
              return false;
            }
          }
          if (key == 'InputEmployee') {
            if (focusedRow.iReturnStatus == 2) { //退品行不允许改行
              cb.utils.alert('该商品行不能许修改营业员！', 'error');
              return false;
            }
          }
        }
      });

      /* 除左侧menu和底部action之外 */
      viewmodel.on('beforeExecOtherAction', function (args) {
        let { key } = args;
        let originBillHeader = viewmodel.getBillingContext('originBillHeader')()
        // 不执行的key， return false
        let bAmountAdjustment = originBillHeader ? originBillHeader.bAmountAdjustment : false;
        // 删行
        if (key === 'DeleteRow') {
          let originBillHeader = viewmodel.getBillingContext('originBillHeader')()
          let bcustomizedOrder = originBillHeader ? originBillHeader.bcustomizedOrder : false;
          if (bcustomizedOrder == true) {
            cb.utils.alert('定制类型不允许删行！', 'error');
            return false;
          }
        }
        // 营业员
        if (key === 'InputEmployee') {
          if (bAmountAdjustment == true) {
            cb.utils.alert('调整状态不允许修改营业员！', 'error');
            return false;
          }
        }

        if (key === 'HangSolutionReceipt') {
          if (bAmountAdjustment == true) {
            cb.utils.alert('调整状态不允许解挂！', 'error');
            return false;
          }
        }

        return true
      })

      /* 挂单之前 */
      viewmodel.on('beforePending', function (args) {
        // 挂单会调新开单, 自己设置的viewmodel.getParams().xxx, 这种单据状态会被清除, 需要记录在零售单表头上
        if (viewmodel.getParams().bStorageCardSale) {
          if (args && args.params && args.params.data) {
            args.params.data._customBillingStatus = { key: 'bStorageCardSale', value: true }
          }
        }
        if (viewmodel.getParams().bStorageCardBackBill) {
          if (args && args.params && args.params.data) {
            args.params.data._customBillingStatus = { key: 'bStorageCardBackBill', value: true }
          }
        }
        if (viewmodel.getParams().bCardCoupon) {
          if (args && args.params && args.params.data) {
            args.params.data._customBillingStatus = { key: 'bCardCoupon', value: true }
          }
        }
        if (viewmodel.getParams().bCardCouponBack) {
          if (args && args.params && args.params.data) {
            args.params.data._customBillingStatus = { key: 'bCardCouponBack', value: true }
          }
        }
        /*价格审批*/
        _Approval.beforePending(args);
        // 执行挂单
        return true;
      })

      /* 解挂之前 */
      viewmodel.on('beforeCancelPending', function (args) {
        // 挂单会调新开单, 自己设置的viewmodel.getParams().xxx, 这种单据状态会被清除, 需要记录在零售单表头上
        // 解挂时再自己设置上去
        if (args && args.data._customBillingStatus) {
          let _customBillingStatus = args.data._customBillingStatus;
          if (_customBillingStatus.key !== null && _customBillingStatus.value !== null) {
            viewmodel.getParams()[_customBillingStatus.key] = _customBillingStatus.value;
          }
        }
        /*价格审批*/
        _Approval.beforeCancelPending(args);
        // 执行解挂
        return true;
      })

      //现场折扣弹窗前折扣校验
      viewmodel.on('beforeCheckOpen', function (args) {
        let originBillHeader = viewmodel.getBillingContext('originBillHeader')();
        let bGiveawayList = originBillHeader ? originBillHeader.bGiveawayList : false;
        if (bGiveawayList && args == "Scene") {  //如果是赠品单状态，不校验现场折扣额
          return false;
        }
      });

      //赠品单参照商品改完现场折扣后可以改数量
      viewmodel.on('goPubilicCanQuantityOpen', function (args) {
        let originBillHeader = viewmodel.getBillingContext('originBillHeader')();
        let bGiveawayList = originBillHeader ? originBillHeader.bGiveawayList : false;
        if (bGiveawayList) {  //赠品单，单价为0 时，可修改数量
          let focusedRow = viewmodel.getBillingContext('focusedRow')();
          if (focusedRow.fPrice == 0) {
            return false;
          }
        }
      });

      /* 修改数量之后 */
      viewmodel.on('afterModifyQuantity', function (args) {
        let { product, num } = args;
        let billingStatus = viewmodel.getBillingContext('billingStatus')();
        // 若商品档案“交货数量改变时”的值为“金额不变重算单价”，则数量修改后，单价＝金额÷数量，零售金额＝数量×零售价，促销折扣额＝折扣额＝零售金额－金额、折扣率＝金额÷零售金额
        if (billingStatus === 'OnlineBill') { //电商订单
          if (product.deliverQuantityChange == 2) {
            //修改数量后只修改折扣率, 其他走改数量公共逻辑
            // product.fQuantity = isNaN(Number(num)) ? 0 : Number(cb.utils.getRoundValue(num, cb.rest.AppContext.option.quantitydecimal));
            // product.fPrice = viewmodel.billingFunc.formatNum('price', product.fMoney / num);
            // product.fQuoteMoney = viewmodel.billingFunc.formatMoney(product.fQuotePrice * product.fQuantity);
            // product.fPromotionDiscount = product.fDiscount = viewmodel.billingFunc.formatMoney(product.fQuoteMoney - product.fMoney);
            product.fDiscountRate = viewmodel.billingFunc.formatNum('rate', product.fMoney * 100 / product.fQuoteMoney);
          }
        }

        return true;
      });

      //赠品单现场折扣确定前事件
      viewmodel.on('beforeHandleOk', function (args) {
        let originBillHeader = viewmodel.getBillingContext('originBillHeader')();
        let bGiveawayList = originBillHeader ? originBillHeader.bGiveawayList : false;
        if (bGiveawayList && args == "SceneDiscount") {

        }

        //改行确定时 卡券商品校验卡券号必输
        if (args == 'EditRow') {
          let row = viewmodel.getBillingContext('rowData', 'editRow')();
          let cardList = [];
          if (row.cCouponId) {
            let rowSNData = viewmodel.get('retailVouchCouponSN').getEditRowModel().getAllData();
            if (viewmodel.getParams().bCardCoupon && row.productrealProductAttributeType == 2) { //卡券销售
              let error = checkCouponHandleOk('cCouponsn',rowSNData);
              if(error){
                cb.utils.alert(error, 'error');
                return false;
              }
              if(rowSNData.beginCouponsn && rowSNData.endCouponsn){
                let hasDonePromotion = row.fSceneDiscount || row.fPromotionDiscount || row.fGiftTokenDiscount || row.fPointPayDiscount || row.fCouponPayApportion;
                let hasRangeCouponsn = row.beginCouponsn || row.endCouponsn;
                if(hasDonePromotion && hasRangeCouponsn && (row.beginCouponsn != rowSNData.beginCouponsn || row.endCouponsn != rowSNData.endCouponsn)){
                  cb.utils.alert('已执行过促销优惠活动,不允许修改卡券号', 'error');
                  return false;
                }
                try {
                  cardList = getCardList(rowSNData.beginCouponsn, rowSNData.endCouponsn); // 获取卡号范围
                } catch (error) {
                  cb.utils.alert(error.message, 'error');
                  return false;
                }
                if(!cardList || cardList.length == 0){
                  cb.utils.alert('生成卡券号范围失败,请检查', 'error');
                  return false;
                }else{
                  //校验卡券号范围是否重复
                  let errorMsg = checkCouponsnCorrect(row,cardList);
                  if(errorMsg){
                    cb.utils.alert('卡券号'+errorMsg+'已存在', 'error');
                    return false;
                  }
                }
              }

            } else if (viewmodel.getParams().bCardCouponBack) { //卡券非原单退
              let error = checkCouponHandleOk('cCouponsn',rowSNData);
              if(error){
                cb.utils.alert(error, 'error');
                return false;
              }
              if(rowSNData.beginCouponsn && rowSNData.endCouponsn){
                try {
                  cardList = getCardList(rowSNData.beginCouponsn, rowSNData.endCouponsn); // 获取卡号范围
                } catch (error) {
                  cb.utils.alert(error.message, 'error');
                  return false;
                }
                if(!cardList || cardList.length == 0){
                  cb.utils.alert('生成卡券号范围失败,请检查', 'error');
                  return false;
                }else{
                  let errorMsg = checkCouponsnCorrect(row,cardList);
                  if(errorMsg){
                    cb.utils.alert('卡券号'+errorMsg+'已存在', 'error');
                    return false;
                  }
                }
              }
            } else if (viewmodel.getBillingContext('billingStatus')() == 'FormerBackBill' && !cb.utils.isEmpty(row.cCouponId)) { //卡券原单退
              let error = checkCouponHandleOk('cCouponsn',rowSNData);
              if(error){
                cb.utils.alert(error, 'error');
                return false;
              }
              if(rowSNData.beginCouponsn && rowSNData.endCouponsn){
                try {
                  cardList = getCardList(rowSNData.beginCouponsn, rowSNData.endCouponsn); // 获取卡号范围
                } catch (error) {
                  cb.utils.alert(error.message, 'error');
                  return false;
                }
                if(!cardList || cardList.length == 0){
                  cb.utils.alert('生成卡券号范围失败,请检查', 'error');
                  return false;
                }else{
                  let errorMsg = checkCouponsnCorrect(row,cardList);
                  if(errorMsg){
                    cb.utils.alert('卡券号'+errorMsg+'已存在', 'error');
                    return false;
                  }
                }
              }
            }

            //赠品卡券商品校验卡券号必输 sunhyu
            if (row.iPromotionProduct == 1 && row.productrealProductAttributeType == 2) {
              if (!rowSNData.cCouponsn) {
                cb.utils.alert('增品中含有实体卡券商品,卡券号不能为空', 'error');
                return false;
              }
            }

            //校验卡券号与商品数量是否相等
            if (viewmodel.getParams().bCardCouponBack || viewmodel.getBillingContext('billingStatus')() == 'FormerBackBill') {
              let modalData = viewmodel.getBillingContext('modalData','actions')();
              let backInfoData = modalData.UpdateBackInfo.params;
              if((rowSNData.cCouponsn && Math.abs(backInfoData.fQuantity) != 1) || (rowSNData.beginCouponsn && Math.abs(backInfoData.fQuantity) != cardList.length)){
                cb.utils.alert('卡券号与商品数量不等,请检查', 'error');
                return false;
              }
            }

            //改行确定时
            //卡券号:校验卡券号与卡券从属关系 卡券号是否有效
            //卡券号范围:校验卡券号与卡券从属关系 卡券号规则 卡券号范围 卡券号是否有效
            if (rowSNData.cCouponsn || rowSNData.beginCouponsn || rowSNData.endCouponsn) {
              let proxy = cb.rest.DynamicProxy.create({
                query: {
                  url: '/bill/checkCouponsn',
                  method: 'POST'
                }
              });
              let cCouponId = row.cCouponId;
              let cCouponsn = rowSNData.cCouponsn;
              let selectType = '';
              if(cb.utils.isEmpty(cCouponsn)){
                selectType = 'range';
              }else{
                selectType = 'single';
              }
              let bCardCoupon = viewmodel.getParams().bCardCoupon;
              //赠品中含有卡券商品处理同售卡
              if (row.iPromotionProduct == 1 && row.productrealProductAttributeType == 2) {
                bCardCoupon = true;
              }
              let parms = {
                cCouponId: cCouponId,
                cCouponsn: cCouponsn,
                bCardCoupon: bCardCoupon,
                selectType: selectType,
                cardList: cardList,
                rowData: row
              };
              let promise = new cb.promise();
              proxy.query(parms, (err, result) => {
                if (err) {
                  cb.utils.alert(err.message, 'error');
                  promise.reject();
                  return false;
                }
                if (!result) {
                  cb.utils.alert('未查询到该卡券号信息', 'error');
                  promise.reject();
                  return false;
                } else {
                  promise.resolve();
                }
              });
              return promise;
            }
          }
        }

        // viewmodel.billingFunc.cancelModal();
      });

      /* 关闭model */
      viewmodel.on('beforeHandleCancel', function (args) {
        if (args === 'EditRow') {  // 关闭改行
          if (viewmodel.getParams().bStorageCardSale || viewmodel.getParams().bStorageCardBackBill) {
            if (viewmodel.getParams().cardSaleParams) {
              viewmodel.getParams().cardSaleParams.isEditRow = false;
            }
          } else {
            stopReadCard();
          }
        }
      });

      /* 是否能够改数量 */
      viewmodel.on('afterCanQuantityOpen', function (args) {
        let originBillHeader = viewmodel.getBillingContext('originBillHeader')()
        let bAmountAdjustment = originBillHeader ? originBillHeader.bAmountAdjustment : false;
        let { canModifyQuantity } = args;
        //角色权限中，零售开单未勾选数量权限，则不允许修改数量
        if (!cb.rest.AppContext.user.authCodes.includes('RM42')) {
          cb.utils.alert('操作员' + cb.rest.AppContext.user.name + '没有数量按钮的功能权限，不能操作', 'error');
          canModifyQuantity = false;
          return false;
        }

        if (bAmountAdjustment == true) {
          cb.utils.alert('调整状态不允许修改商品行数量！', 'error');
          canModifyQuantity = false;
          return false;
        }

        if (viewmodel.getParams().bStorageCardRecharge) {       // 储值卡充值状态
          let focusedRow = viewmodel.getBillingContext('focusedRow')();
          if (focusedRow.cStorageCardNum) {
            cb.utils.alert('储值卡充值不允许修改数量', 'error');
            canModifyQuantity = false;
            return false;
          }
        }

        if (viewmodel.getParams().bMemberWalletRecharge) {       // 会员钱包充值状态
          let focusedRow = viewmodel.getBillingContext('focusedRow')();
          if (focusedRow.walletAccount) {
            cb.utils.alert('会员钱包充值不允许修改数量', 'error');
            canModifyQuantity = false;
            return false;
          }
        }

        if (viewmodel.getParams().bStorageCardSale || viewmodel.getParams().bStorageCardBackBill) {   // 售卡退卡
          let focusedRow = viewmodel.getBillingContext('focusedRow')();
          if (focusedRow.productrealProductAttributeType == 3) {
            if (viewmodel.getParams().bStorageCardSale) {
              cb.utils.alert('储值卡售卡不允许修改数量', 'error');
            } else if (viewmodel.getParams().bStorageCardBackBill) {
              cb.utils.alert('储值卡非原单退不允许修改数量', 'error');
            }
            canModifyQuantity = false;
            return false;
          }
        }

        //实体卡券控制不允许修改数量
        if (viewmodel.getParams().bCardCoupon) {
          let focusedRow = viewmodel.getBillingContext('focusedRow')();
          if (focusedRow.productrealProductAttributeType == 2) {
            cb.utils.alert('实体卡券不允许修改数量', 'error');
            canModifyQuantity = false;
            return false;
          }
        } else if (viewmodel.getParams().bCardCouponBack) {
          cb.utils.alert('卡券非原单退不允许修改数量', 'error');
          canModifyQuantity = false;
          return false;
        }else if(viewmodel.getParams().usedCouponPaymentOriginBack){
          //优惠券收款方式零售单原单退货逻辑控制
          cb.utils.alert('本单使用了优惠券收款方式，不允许修改商品数量', 'error')
          canModifyQuantity = false;
          return false;
        }

        //预订业务控制修改数量
        let billingStatus = viewmodel.getBillingContext('billingStatus')();
        let industry = cb.rest.AppContext.user.industry;
        let ibillSource = originBillHeader ? originBillHeader.ibillSource : false;
        let focusedRow = viewmodel.getBillingContext('focusedRow')();
        if (focusedRow['product_productProps!define1'] == "买断房费") { //买断房费商品不允许修改数量
          cb.utils.alert('买断房费不允许修改数量！', 'error');
          return false;
        }
        if (viewmodel.getParams().presellChange || (billingStatus == 'Shipment')) {
          let discountFlag = false;
          if (!cb.utils.isEmpty(focusedRow.promotionwrite) && (focusedRow.promotionwrite.length != 0)) discountFlag = true;
          if ((Number(originBillHeader.fPromotionSum) != 0) || (Number(originBillHeader.fSceneDiscountSum) != 0) ||
            (Number(originBillHeader.fPointPayMoney) != 0) || (Number(originBillHeader.fGiftApportion) != 0)) {
            if (!focusedRow.bChangeAddProduct) discountFlag = true; //执行过优惠等活动，并且当前行不是新增行的
          }
          if ((industry == 20) && (ibillSource == 2)) { //ktv行业，单据来源为商城普通
            cb.utils.alert('当前单据状态下不允许修改数量！', 'error');
            canModifyQuantity = false;
            return false;
          }
          if (!cb.utils.isEmpty(focusedRow.dCookPrtDate) || discountFlag) { //销售厨打时间不为空，执行过优惠
            cb.utils.alert('该商品行不允许修改数量！', 'error');
            canModifyQuantity = false;
            return false;
          }
          if (focusedRow.iGroupNum == 1 || (focusedRow.fOutQuantity > 0) || (focusedRow.iReturnStatus == 2) || (focusedRow.iPromotionProduct == 1)) { //来源于商城的行，以出品的行，退品行,赠品行
            cb.utils.alert('该商品行不允许修改数量！', 'error');
            canModifyQuantity = false;
            return false;
          }
        }
        return true
      })

      /* 开单底部action按钮 */
      viewmodel.on('beforeExecBottomAction', function (args) {
        let { key } = args;
        let originBillHeader = viewmodel.getBillingContext('originBillHeader')()
        // 不执行的key， return false
        let bAmountAdjustment = originBillHeader ? originBillHeader.bAmountAdjustment : false;
        if (bAmountAdjustment == true) {
          switch (key) {
            case "SetPromotionFocus": {
              cb.utils.alert("调整状态不允许执行促销活动！", "error");
              return false;
            }
            case "SceneDiscount": {
              cb.utils.alert("调整状态不允许执行现场折扣！", "error");
              return false;
            }
            case "DoSaleByVipPoint": {
              cb.utils.alert("调整状态不允许执行积分折扣！", "error");
              return false;
            }
            case "Coupon": {
              cb.utils.alert("调整状态不允许执行优惠券！", "error");
              return false;
            }
            case "ModifyQuantity": {
              cb.utils.alert("调整状态不允许修改数量！", "error");
              return false;
            }
            case "ModifyPrice": {
              cb.utils.alert("调整状态不允许修改零售价！", "error");
              return false;
            }
            case "MatchProduct": {
              cb.utils.alert("调整状态不允许执行选配！", "error");
              return false;
            }
          }
        } else {
          let focusedRow = viewmodel.getBillingContext('focusedRow')();
          var result = focusedRow ? focusedRow['retailVouchDetailBatch!define5'] : null;
          if (result != null) {
            switch (key) {
              case "MatchProduct": {
                cb.utils.alert("样品不支持选配！", "error");
                return false;
              }
            }
          }
        }

        return true
      })

      /* 点击优惠券发服务前 */
      viewmodel.on('beforeCouponService', function (args) {
        let retailvouchgifttoken = viewmodel.getParams().oldGiftTokens;
        if (args && args.params) {
          args.params.retailvoucholdgifttoken = retailvouchgifttoken;
        }
      })

      /* 抹零服务 */
      viewmodel.on('wipeZero', zero.wipeZero)

      /* 新增结算方式 */
      viewmodel.on('AfterAllPaymentTypeInStorage', common.AfterAllPaymentTypeInStorage)

      /* 拓展 新的pos结算方式所需参数 */
      viewmodel.on('afterOrganizePosParams', common.afterOrganizePosParams)

      /* 拓展pos支付失败时候的撤销操作 */
      viewmodel.on('afterSaveAndHandleError', common.afterSaveAndHandleError)

      /* 扩展pos当天退货走撤销 */
      viewmodel.on('extendPseuDoBack', common.extendPseuDoBack)

      /* 扩展“当天”时间范围的定义 */
      viewmodel.on('posIsCurrentDay', common.posIsCurrentDay)

      /* 拓展根据支付方式来决定是否走离线结算 */
      viewmodel.on('afterPaymodeDecideSave', function (args) {
        //结算时, 根据结算方式判断是否走离线结算
        //结算时, 决定是否缓存单据, 不立即上传单据, haveScan为true时不缓存, 立即上传单据
        let params = args.params;
        for (let i in params.paymodes) {
          let value = params.paymodes[i]
          if (value.paymentType == 17 || value.paymentType == 18 || value.paymentType == 19 || value.paymentType == 22 || value.paymentType == 21) {
            if (value.show && value.value) {
              params.haveScan = true;
              break
            }
          }
        }

        if (viewmodel.getParams().bStorageCardRecharge
          || viewmodel.getParams().bStorageCardSale
          || viewmodel.getParams().bStorageCardBackBill) {
          params.haveScan = true;
        }

        if (viewmodel.getParams().bCardCoupon
          || viewmodel.getParams().bCardCouponBack
          || viewmodel.getParams().bCardCouponOriginBack) {
          params.haveScan = true;
        }

        if (viewmodel.getParams().bMemberWalletRecharge) {
          params.haveScan = true;
        }

        // add by hanzc 190613, 录入会员的单需要走在线结算
        if (viewmodel.getBillingContext('memberInfo')()) {
          let memberInfo = viewmodel.getBillingContext('memberInfo')();
          if (memberInfo && memberInfo.mid) {
            params.haveScan = true;
          }
        }

        // add by hanzc 190617, 单据打印时不缓存单据(缓存单据没有id,打印报错)
        if (cb.rest.AppContext.option.billprinttype == '2') {
          params.haveScan = true;
        }

        //离线不允许使用积分抵扣
        // let originBillHeader = viewmodel.getBillingContext('originBillHeader')();
        // if(originBillHeader && (originBillHeader.fPointPay != 0|| originBillHeader.fSellerPointPay != 0)){
        //   params.haveScan = true;
        // }
        //离线不允许使用优惠券
        let coupons = viewmodel.getBillingContext('coupons', 'product')();
        if(coupons && coupons.length > 0){
          params.haveScan = true;
        }
      })

      /* 离线状态下决定是否走离线结算 */
      viewmodel.on('canOfflineSettle', function (args) {
        // 结算时, 决定网络连接离线的情况下是否允许结算, arr.push后不允许离线状态下结算
        let { arr, finallyPaymodes } = args;
        if (viewmodel.getParams().bStorageCardRecharge) {   // 充值状态不允许离线
          arr.push({ name: '储值卡充值功能' });
        }
        if (viewmodel.getParams().bStorageCardSale) {    // 售卡状态不允许离线
          arr.push({ name: '储值卡售卡功能' });
        }
        if (viewmodel.getParams().bStorageCardBackBill) {   // 退卡状态不允许离线
          arr.push({ name: '储值卡非原单退功能' });
        }
        if (viewmodel.getParams().bCardCoupon) {   // 卡券售卡状态不允许离线
          arr.push({ name: '卡券售卡功能' });
        }
        if (viewmodel.getParams().bCardCouponBack) {   // 卡券非原单退状态不允许离线
          arr.push({ name: '卡券非原单退功能' });
        }
        if (viewmodel.getParams().bCardCouponOriginBack) {   // 卡券原单退状态不允许离线
          arr.push({ name: '卡券原单退功能' });
        }
        if (viewmodel.getParams().bMemberWalletRecharge) {   // 充值状态不允许离线
          arr.push({ name: '会员钱包充值功能' });
        }
        // add by hanzc 190613, 录入会员的单不允许离线
        if (viewmodel.getBillingContext('memberInfo')()) {
          let memberInfo = viewmodel.getBillingContext('memberInfo')();
          if (memberInfo && memberInfo.mid) {
            arr.push({ name: '会员信息参与结算' });
          }
        }

        for (let i in finallyPaymodes) {
          let paymode = finallyPaymodes[i];
          if (paymode.paymentType == 18) {    // 储值卡结算不允许离线
            arr.push(paymode);
          }
          if (paymode.paymentType == 5) {    // 会员钱包结算不允许离线
            arr.push(paymode);
          }
          if (paymode.paymentType == 22) {    // 银联聚合支付不允许离线
            arr.push(paymode);
          }
          if (paymode.paymentType == 21) {    // 卡券支付不允许离线
            arr.push(paymode);
          }
        }

        //离线不允许使用积分抵扣
        // let originBillHeader = viewmodel.getBillingContext('originBillHeader')();
        // if(originBillHeader && (originBillHeader.fPointPay != 0 || originBillHeader.fSellerPointPay != 0)){
        //   arr.push({ name: '积分抵扣功能' });
        // }
        //离线不允许使用优惠券
        let coupons = viewmodel.getBillingContext('coupons', 'product')();
        if(coupons && coupons.length > 0){
          arr.push({ name: '优惠券功能' });
        }
      })

      /* 弹出促销modal之前 */
      viewmodel.on('beforePopPromotionModal', function (args) {
        let { products, extendResult, updateProducts } = args;
        let { formatMoney } = viewmodel.billingFunc;
        // 撤销促销
        const productsBackToOriginPrice = (products) => {
          for (let product of products) {
            if (product.autoPromotion) {

              //撤销促销时候回写对应子件价格和金额
              let fPromotionDiscountSum = 0.00;//套餐子件总折扣
              let fMoneyParent = 0.00;//套餐子件总折扣

              let index=0;
              let fMoneySum = 0.00;
              let fPromotionSum = 0.00;
              let fMoneyTotal=0.00;
              let fPromotionDiscountTotal=0.00;
              for (let i = 0; i < products.length; i++) {
                if (typeof (product.originalkey) != "undefined") {
                  if (products[i]["ikitType"] == 1) {
                    if (products[i]["originalkey"] == product.originalkey) {
                      fMoneyTotal = fMoneyTotal + products[i]["fMoney"];
                      fPromotionDiscountTotal = fPromotionDiscountTotal + products[i]["fPromotionDiscount"];
                    }
                  }

                  if (products[i]["ikitType"] == 2) {
                    if (products[i]["parentkey"] == product.originalkey) {
                      fPromotionDiscountSum = fPromotionDiscountSum + products[i]["fPromotionDiscount"];
                      fMoneyParent=fMoneyParent+products[i]["fPromotionDiscount"];
                    }
                  }

                }
              }
              for (let i = 0; i < products.length; i++) {
                if (typeof (product.originalkey) != "undefined") {
                  if (products[i]["ikitType"] == 2) {
                    if (products[i]["parentkey"] == product.originalkey) {
                      let pricerate = (product.fPrice + product.fPromotionDiscount/product.fQuantity) / product.fPrice;
                      let rate = (fPromotionDiscountSum - product.fPromotionDiscount) / fPromotionDiscountSum;
                      products[i]["fPrice"] = products[i]["fPrice"] * pricerate;
                      products[i]["fMoney"] = formatMoney(products[i]["fMoney"] * pricerate);
                      products[i]["fQuoteMoney"] = formatMoney(products[i]["fQuotePrice"] * products[i]["fQuantity"]);
                      products[i]["fDiscount"] = formatMoney(products[i]["fDiscount"] * rate);
                      products[i]["fPromotionDiscount"] =formatMoney( products[i]["fPromotionDiscount"] * rate);
                      products[i]["originalQuotePrice"] = products[i]["fQuotePrice"];

                      fMoneySum=formatMoney(fMoneySum+products[i]["fMoney"]);
                      fPromotionSum=formatMoney(fPromotionSum+products[i]["fPromotionDiscount"]);
                      index=products.length-1;
                    }
                  }
                }
              }

              fMoneyTotal=fMoneyTotal+fPromotionDiscountTotal;
              if(fMoneySum!=fMoneyTotal)
              {
                 let result=formatMoney(fMoneyTotal-fMoneySum);
                 products[index]["fMoney"]=products[index]["fMoney"]+result;
             }

              let diff=formatMoney(fPromotionDiscountSum-fPromotionSum);
              if(diff!=fPromotionDiscountTotal)
              {
                 let result=formatMoney(fPromotionDiscountTotal-diff);
                 products[index]["fPromotionDiscount"]=products[index]["fPromotionDiscount"]+result;
          }

              product.fPrice = product.fVIPPrice || product.fQuotePrice;
              let { fPrice, fQuantity, fQuotePrice } = product
              delete product.promotionwrite
              delete product.autoPromotion
              delete product.fPromotionDiscount
              delete product.fPromotionPrice
              delete product.promotionTips
              delete product.promotionProductPrice
              delete product.bSpike
              delete product.iSendPoint
              product.fMoney = formatMoney(fPrice * fQuantity);
              product.fDiscount = formatMoney((fQuotePrice - fPrice) * fQuantity)
              product.fDiscountRate = 100
            }
          }
          cb.utils.alert('取消自动促销成功', 'success')
          return products
        }
        // 是否取消自动促销
        for (let product of products) {
          if (product.autoPromotion) {
            let promise = new cb.promise();
            cb.utils.confirm('是否取消自动促销？', function () {
              // 确认
              let newProducts = productsBackToOriginPrice(products)
              updateProducts(newProducts)
              extendResult.resolveResult = false
              extendResult.hasCancelAutoPromotion = true
              promise.resolve()
            }, function () {
              // 取消
              extendResult.resolveResult = true
              promise.resolve()
            })
            return promise
          }
        }
        extendResult.resolveResult = true
        // todo 改变服务参数 只需将过滤条件赋给extendResult.resolveResult
      })

      /* 组织本单表头数据 */
      viewmodel.on('afterGetRetailVouchData', function (args) {
        let { retailVouchData } = args;
        let { collectMoneyMethod } = viewmodel.getBillingContext('billingOptions')()
        if(viewmodel.getParams().presellChange){ //预订变更表头添加一个变更状态
          retailVouchData.presellChange = true;
        }
        if (collectMoneyMethod && collectMoneyMethod.value === '2')
          retailVouchData.iGatheringType = 2 // 收银台收款

      })
      viewmodel.on('beforeCheckDiscountOperator', function (args) {
        /*add by jinzh1  价格审批相关*/
        if (!_Approval.checkAppr()) return false;
      });
      /* 结算弹窗弹出之前 */
      viewmodel.on('beforeSettleViewOpen', function (args) {

        let employeeFlag = false;//营业员校验
        let employeeCheckRows = viewmodel.getBillingContext('products')();
        //可选配的商品必须选配，不选配结算时提示商品为可选配，请先进行选配
        let row = viewmodel.getBillingContext('focusedRow')();
        let bMatching = row['product_productProps!define4'];
        let retailVouchMatchings = row['retailVouchMatchings'];
        let bomAttrValue = null;
        let billingStatus = viewmodel.getBillingContext('billingStatus')();
        if (billingStatus === 'PresellBill') {
          if (bMatching == '无选配' || cb.utils.isEmpty(bMatching) || cb.rest.AppContext.tenant.industry != 19) {
            // return true;
          } else {
            if (retailVouchMatchings != null) {
              retailVouchMatchings.forEach(item => {
                bomAttrValue = item.bomAttrValue;
                if (bomAttrValue == null) {
                  cb.utils.alert('该商品为可选配，请先进行选配！', 'error');
                  return false
                }
              })
            } else {
              cb.utils.alert('该商品为可选配，请先进行选配！', 'error');
              return false
            }

          }
        }
        for(let i=0; i<employeeCheckRows.length; i++ ){
          if(cb.utils.isEmpty(employeeCheckRows[i].iEmployeeid)){
            employeeFlag = true; //营业员为空，做标记
            cb.utils.alert('第'+employeeCheckRows[i].rowNumber+'行商品行营业员为空！请分配营业员！','error')
          }
        }
        //商品行营业员id不能为空
        if (employeeFlag) {
          return false;
        }

        let { getOptions, reviewHandleSave, dispatch, getGlobalProducts, getState, getDelZeroResult } = args
        let { collectMoneyMethod } = getOptions();
        let businessType = viewmodel.getBillingContext('businessType')();
        let originBillHeader = viewmodel.getBillingContext('originBillHeader')()
        let madeType;

        if (billingStatus === 'FormerBackBill') {
          let iTakeway = originBillHeader.iTakeway;
          if (cb.rest.AppContext.tenant.industry == 19 || iTakeway == 2) {
            var bReturnStore_1 = viewmodel.get("bReturnStore_1").getValue();
            var iReturnWarehousid_1 = viewmodel.get("iReturnWarehousid_1").getValue();
            if ((bReturnStore_1 == false || cb.utils.isEmpty(bReturnStore_1)) && cb.utils.isEmpty(iReturnWarehousid_1)) {
              cb.utils.alert('退回门店为否且退货仓库为空时，不允许结算', 'error');
              viewmodel.billingFunc.showHeaderInfo();
              return false;
            }
          }
        }
        //金额调整单结算前判断商品行是否有金额等于0的商品
        let bAmountAdjustment = originBillHeader ? originBillHeader.bAmountAdjustment : false;
        if (bAmountAdjustment == true) {
          let productRows = viewmodel.getBillingContext('products')();
          let flag = false;
          let flag_1 = false;
          productRows.forEach(function (item) {
            if (item.fMoney == 0) {
              flag = true;
              return false;
            }
            if (cb.utils.isEmpty(item.fAdjustAmount_1)) { //本次金额调整字段为空，说明商品行未进行调整，不允许结算
              flag_1 = true;
              return false;
            }
          });
          if (flag == true) {
            cb.utils.alert('商品行金额不能为0！', 'error');
            return false;
          }
          if (flag_1 == true) {
            cb.utils.alert('商品行必须进行金额调整！', 'error');
            return false;
          }

        }

        let bcustomizedOrder = originBillHeader ? originBillHeader.bcustomizedOrder : false;
        if (bcustomizedOrder == true) {
          if (!businessType) {
            cb.utils.alert('业务类型必输！', 'error');
            return false
          }
          // var businesstypeArray = viewmodel.getBillingContext('Businesstype_DataSource')();
          // businesstypeArray.forEach(item => {
          //   if (item.name == businessType.name) {
          //     madeType = item.madeType;
          //   }
          // })
          // let type = 'true';
          // let productNames = [];
          // getGlobalProducts().forEach(item => {
          //   if (!item["retailVouchDetailCustom!define2"]) {
          //     type = 'false';
          //     productNames.push(item.product_cName);
          //   }
          // })
          // if (type == 'false' && madeType == '2') {
          //   cb.utils.alert('"定制改型"为"改型"时，商品(' + productNames + ')改型说明必输！', 'error');
          //   return false
          // }
        }

        if (billingStatus === 'PresellBill') {
          var businesstypeArray = viewmodel.getBillingContext('Businesstype_DataSource')();
          businesstypeArray.forEach(item => {
            if (item.name == businessType.name) {
              madeType = item.madeType;
            }
          })
          let type = 'true';
          let productNames = [];
          getGlobalProducts().forEach(item => {
            if (!item["retailVouchDetailCustom!define2"]) {
              type = 'false';
              productNames.push(item.product_cName);
            }
          })
          if (type == 'false' && madeType == '2') {
            cb.utils.alert('"定制改型"为"改型"时，商品(' + productNames + ')改型说明必输！', 'error');
            return false
          }
        }

        if (collectMoneyMethod && collectMoneyMethod.value === '2') {
          getDelZeroResult(dispatch, getState).then(result => {
            dispatch(reviewHandleSave(() => { }))
          })
          return false
        }
        //离线单据状态下预定相关的业务不允许结算
        let lineConnection = viewmodel.getBillingContext('lineConnection', 'offLine')();
        if (!lineConnection) {
          let presellStatus = viewmodel.getBillingContext('billingStatus')();
          let billingStatusList = ['PresellBill','Shipment','PresellBack'];
          if(billingStatusList.includes(presellStatus)){
            cb.utils.alert('当前处于离线状态,不允许结算保存', "error");
            return false;
          }
        }
        //售卡状态不允许结算
        if (viewmodel.getParams().bStorageCardSale || viewmodel.getParams().bStorageCardBackBill) {
          if (viewmodel.getBillingContext('businessType')().name != '售卡') {
            if (viewmodel.getParams().bStorageCardSale) {
              cb.utils.alert('当前业务类型不能售卡', 'error');
              return false;
            } else if (viewmodel.getParams().bStorageCardBackBill) {
              cb.utils.alert('当前业务类型不能退卡', 'error');
              return false;
            }
          }
        }
        // 售卡/退卡时商品必须有卡号
        // 赠品增储值卡时必须有卡号
        let cardSaleProducts = viewmodel.getBillingContext('products')();
        let flag = false;
        let errorMsg = '';
        for (let i = 0; i < cardSaleProducts.length; i++) {
          if (cardSaleProducts[i].productrealProductAttributeType == 3 && cardSaleProducts[i].cStorageCardNum == null
            && (cardSaleProducts[i].beginCouponsn == null || cardSaleProducts[i].endCouponsn == null)) {
            flag = true;
            errorMsg = `第${i + 1}行商品未输入储值卡号`;
            break;
          }
        }
        if (flag) {
          cb.utils.alert(errorMsg, 'error');
          return false;
        }

        let isPackageInput = false;
        let products = viewmodel.getBillingContext('products')()
        for (let i = 0; i < products.length; i++) {
          if (products[i]["isPackageInput"] == true) {
            isPackageInput = true;
            break;
          }
        }
        //选配套餐
        if (isPackageInput) {
          cb.utils.alert('套餐商品未录入完毕,不允许执行结算', 'error');
          return false;
        }

        //厨打相关控制，结算弹窗前给出提示,ktv房间号未输给出一个提示
        let cache = cb.rest.cache;
        let isSupportKitchenPrint = cb.rest.AppContext.option.isSupportKitchenPrint;
        // let lineConnection = viewmodel.getBillingContext('lineConnection', 'offLine')();
        let presellStatus = viewmodel.getBillingContext('billingStatus')();
        let promise = new cb.promise();
        let confirmOutFlag = false; //用来判断是否满足房间信息提示弹窗的标志
        //ktv行业预定、变更、交货状态下，房间号未输的需要给出弹窗提示
        if((billingStatus == 'Shipment') || (billingStatus == 'PresellBill') ||  viewmodel.getParams().presellChange) confirmOutFlag = true;
        if((cb.rest.AppContext.user.industry == 20) && cb.utils.isEmpty(viewmodel.get('room_name').getValue()) && confirmOutFlag){ //ktv行业房间号为空，弹房间号确认提示框
          cb.utils.confirm('未填写房间信息，是否继续结算？', function () {
            // 确认,继续结算操作
             if (isSupportKitchenPrint) {
                if (cache && (!cb.utils.isEmpty(cache.isOpenDBCache) && cache.isOpenDBCache == true) && (presellStatus != 'PresellBack') && (presellStatus != 'FormerBackBill')) { //PresellBack退订状态下也不提示
                  cb.utils.confirm('启用缓存设置时，不能进行厨打，是否继续？', function () {
                    // 确认,继续结算操作
                    promise.resolve()
                  }, function () {  //否，停留在当前界面不结算
                    // 取消
                    promise.reject()
                  })
                }else {
                  promise.resolve();
                }
              }else {
                promise.resolve();
              }
          }, function () {  //否，停留在当前界面不结算
            // 取消
            promise.reject();
          })
          return promise;
        }else { //不需要弹房间提示信息，只弹厨打提示框
          if (isSupportKitchenPrint) {
            if (cache && (!cb.utils.isEmpty(cache.isOpenDBCache) && cache.isOpenDBCache == true) && (presellStatus != 'PresellBack') && (presellStatus != 'FormerBackBill')) { //PresellBack退订状态下也不提示
              cb.utils.confirm('启用缓存设置时，不能进行厨打，是否继续？', function () {
                // 确认,继续结算操作
                promise.resolve()
              }, function () {  //否，停留在当前界面不结算
                // 取消
                promise.reject()
              })
              return promise;
            }
          }
        }

        //  return true

      })

      /* validateSettle扩展 */
      viewmodel.on('afterValidateSettle', function (args) {
        //iOwesState:赊销状态，receivable:应收，receipts: 实收
        let originBillHeader = viewmodel.getBillingContext('originBillHeader')()
        let bAmountAdjustment = originBillHeader ? originBillHeader.bAmountAdjustment : false;
        let MinPercentGiveMoneyPre = originBillHeader ? originBillHeader.iBusinesstypeid_MinPercentGiveMoneyPre : 0;
        let presellChange = viewmodel.getParams().presellChange; //变更状态校验
        let { formatMoney } = viewmodel.billingFunc;
        let { iOwesState, receivable, receipts } = args
        if (iOwesState == 0 && (receivable != receipts)) {
          if (cb.rest.terminalType != 3) {
            if (bAmountAdjustment == true) { //金额调整的零售单，原单未收款完毕，则本单也可以部分收款或不收款
              if (iPayState_1 == 0) {
                if (receivable * 1 < 0 && (receivable * 1 > receipts * 1)) {
                  cb.utils.alert('实退金额应少于应退金额！', 'error');
                  return false;
                }
                return true;
              }
            }
            if (presellChange) { //变更状态控制可以部分收款，根据预订交货百分比判断
              if (receivable * 1 > 0) { //如果应收大于0，进行百分比控制，20190809还得根据是否严格控制判断，非严格控制给出提醒即可
                let receivablePercent = receivable * 1 * MinPercentGiveMoneyPre / 100; //按百分比应收
                if ((receipts * 1) < receivablePercent) {
                  let controlType = viewmodel.getBillingContext('controlType','uretailHeader')(); //控制类型 "1"非严格控制
                  let percentMoney = receivablePercent;
                  percentMoney = formatMoney(percentMoney).toFixed(2);
                  let promise = new cb.promise();
                  if("1" == controlType){ //非严格控制
                    cb.utils.confirm(`预订交款比例低于${MinPercentGiveMoneyPre}%, 确认结算？`, function () {
                      // 确认,继续结算操作
                      promise.resolve()
                    }, function () {  //否，停留在当前界面不结算
                      // 取消
                      // viewmodel.billingFunc.closePaymodal();  //回滚数据(有抹零的回滚到抹零前的数据)
                      promise.reject()
                    })
                    return promise;
                  }else{ //严格控制
                    cb.utils.alert('预订交款不得低于' + percentMoney + ',比例不得低于' + MinPercentGiveMoneyPre + "%", 'error');
                    return false;
                  }
                }
              }
              return true;
            }
            cb.utils.alert('应收不等于实收，无法结算', 'error')
            return false
          }
        }

        let paymodes = viewmodel.getBillingContext('paymodes')();
        let walletPaymode = null;
        let storageCardPaymode = null;
        for(let attr in paymodes) {
          if(paymodes[attr].paymentType == 5){
            walletPaymode = paymodes[attr];
          }
          if(paymodes[attr].paymentType == 18){
            storageCardPaymode = paymodes[attr];
          }
        }
        if(walletPaymode && Number(walletPaymode.value) > Number(walletPaymode._showMoney)){
          cb.utils.alert('会员钱包可用余额不足', 'error');
          return false;
        };
        if (storageCardPaymode && storageCardPaymode.value && Number(storageCardPaymode.value) != 0) {
          /* 判断储值卡支付时是否已有孙表 */
          if(!storageCardPaymode.gatheringvouchPaydetail || storageCardPaymode.gatheringvouchPaydetail.length === 0){
            if(Number(storageCardPaymode.value) > 0){
              cb.utils.alert('请检查储值卡是否正确有效', 'error');
            } else {
              cb.utils.alert('请检查退款储值卡是否正确有效', 'error');
            }
            return false;
          }
        }

        return true
      })

      /*离线保存后事件 */
      viewmodel.on('afterOfflineSave',function(args){
       //获取操作员列表,将营业员编号维护到商品行上
        let userList = viewmodel.getBillingContext('salesList','salesClerk')();
        let userStores = cb.rest.AppContext.user.userStores;
        if(args.offlinereturndata && args.offlinereturndata.retailVouchDetails){
          for(let i=0; i<args.offlinereturndata.retailVouchDetails.length; i++){
            for(let j=0; j<userList.length; j++){
              if(args.offlinereturndata.retailVouchDetails[i].iEmployeeid == userList[j].id){
                args.offlinereturndata.retailVouchDetails[i].iEmployeeid_code = userList[j].code;
              }
            }
          }
        }
        //离线单据支持打印门店所属部门
        if(args.offlinereturndata && args.offlinereturndata.rm_retailvouch ){
          for(let i=0; i<args.offlinereturndata.rm_retailvouch.length; i++){
            for(let j=0; j<userStores.length; j++){
              if(args.offlinereturndata.rm_retailvouch[i].store == userStores[j].store){
                args.offlinereturndata.rm_retailvouch[i].iDepartmentid = userStores[j].dept;
                args.offlinereturndata.rm_retailvouch[i].iDepartmentid_name = userStores[j].dept_name;
              }
            }
          }
        }
        //离线打印折扣率精度控制（%号前小数精度为两位）
        if(args.offlinereturndata && args.offlinereturndata.retailVouchDetails){
          let details =  args.offlinereturndata.retailVouchDetails;
          for(let i=0; i<details.length; i++){
            if(!cb.utils.isEmpty(details[i].fDiscountRate)){
              let discountRateArr = details[i].fDiscountRate.split('%');
              let discountNum = discountRateArr[0];
              let num_1 = Math.round(100 * discountNum);
              let num_2 = num_1 / 100;
              args.offlinereturndata.retailVouchDetails[i].fDiscountRate = num_2.toFixed(2) + "%";
            }
          }
        }
      })

      //结算前校验单据
      viewmodel.on('beforeCheckVouch', function (args) {
        let billingStatus = viewmodel.getBillingContext('billingStatus')();
        if ((billingStatus == 'PresellBack') || (billingStatus == 'Shipment')) { //如果是退订单/交货状态不校验表头自定义项
          for (let i = 1; i <= 30; i++) {
            let define = 'retailVouchCustom!define' + i;
            viewmodel.get(define).setState("bIsNull", true);
          }
        }

        let isPackageInput = false;
        let products = viewmodel.getBillingContext('products')()
        for (let i = 0; i < products.length; i++) {
          if (products[i]["isPackageInput"] == true) {
            isPackageInput = true;
            break;
          }
        }
        //选配套餐
        if (isPackageInput) {
          cb.utils.alert('套餐商品未录入完毕,不允许执行结算', 'error');
          return false;
        }
      })

      /* 收款单数据处理 */
      viewmodel.on('afterGetGatheringVouchData', function (args) {
        args.gatheringVouchData.fbitReport = false;  //更改日报状态
        args.gatheringVouchData.fbitSettle = false;  //更改日结状态
      })
      //结算前，处理现场折扣相关数据，重算零售金额等字段
      var processDiscount = function (data) {
        let { formatMoney } = viewmodel.billingFunc;
        if (data && data.rm_retailvouch && data.rm_retailvouch.retailVouchDetails) {
          let retailVouchDetails = data.rm_retailvouch.retailVouchDetails;
          let oldDetails = JSON.parse(JSON.stringify(retailVouchDetails));
          let isProcess = false; //用来判断是否处理过折扣相关的行，处理过，则需要重算表头
          let fQuoteMoneySum = 0; //零售金额合计
          let fDiscountSum = 0;  //折扣额合计
          let fSceneDiscountSum = 0; //现场折扣额合计
          for (let i = 0; i < retailVouchDetails.length; i++) {
            if ((retailVouchDetails[i].fDiscount < 0) && (retailVouchDetails[i].fSceneDiscount < 0)
              && (cb.utils.isEmpty(retailVouchDetails[i].fPromotionDiscount) || retailVouchDetails[i].fPromotionDiscount == 0)) {
              isProcess = true;
              retailVouchDetails[i].fQuoteMoney = formatMoney(1*oldDetails[i].fQuoteMoney - 1*oldDetails[i].fSceneDiscount).toFixed(cb.rest.AppContext.option.amountofdecimal);
              retailVouchDetails[i].fDiscount = formatMoney(1*oldDetails[i].fDiscount - 1*oldDetails[i].fSceneDiscount).toFixed(cb.rest.AppContext.option.amountofdecimal);
              retailVouchDetails[i].fSceneDiscount = 0;
              retailVouchDetails[i].fQuotePrice = formatMoney(1*retailVouchDetails[i].fQuoteMoney / (1*retailVouchDetails[i].fQuantity)).toFixed(cb.rest.AppContext.option.amountofdecimal);
              if(!cb.utils.isEmpty(retailVouchDetails[i].fVIPPrice)){
                retailVouchDetails[i].fVIPPrice = formatMoney((1*retailVouchDetails[i].fQuoteMoney - 1*retailVouchDetails[i].fVIPDiscount) / (1*retailVouchDetails[i].fQuantity)).toFixed(cb.rest.AppContext.option.amountofdecimal);
              }
              retailVouchDetails[i].fDiscountRate = Math.round(10000*(1*retailVouchDetails[i].fMoney / (1*retailVouchDetails[i].fQuoteMoney))) / 100; //折扣率保留%号两位
              retailVouchDetails[i].fVIPRate = Math.round(10000*((1*retailVouchDetails[i].fQuoteMoney - 1*retailVouchDetails[i].fVIPDiscount) / (1*retailVouchDetails[i].fQuoteMoney))) / 100;
              retailVouchDetails[i].fSceneDiscountRate = 100;
              if(cb.utils.isEmpty(retailVouchDetails[i].iSupperOperatorid)){ //如果折扣授权人为空，赋当前操作员
                retailVouchDetails[i].iSupperOperatorid = (cb.rest.AppContext.user || {}).id;
              }
            }
            fQuoteMoneySum = fQuoteMoneySum + 1*retailVouchDetails[i].fQuoteMoney;
            fDiscountSum = fDiscountSum + 1*retailVouchDetails[i].fDiscount;
            fSceneDiscountSum = fSceneDiscountSum + 1*retailVouchDetails[i].fSceneDiscount;
          }
          //算完表体，重算表头相关字段
          if(isProcess){
            data.rm_retailvouch.fQuoteMoneySum = formatMoney(fQuoteMoneySum).toFixed(cb.rest.AppContext.option.amountofdecimal);
            data.rm_retailvouch.fDiscountSum = formatMoney(fDiscountSum).toFixed(cb.rest.AppContext.option.amountofdecimal);
            data.rm_retailvouch.fSceneDiscountSum = formatMoney(fSceneDiscountSum).toFixed(cb.rest.AppContext.option.amountofdecimal);
          }
        }
      }
      //零售单保存前数据校验
      var checkBillData = function (args, data) {
        let { formatMoney } = viewmodel.billingFunc;
        let priceflag = false;
        //零售单数据
        if (data && data.rm_retailvouch) {
          if(data.rm_retailvouch.retailVouchDetails){
            let retailVouchDetails = data.rm_retailvouch.retailVouchDetails;
            let fDetailMoney = 0;
            let fDetailfEffaceMoneysum = 0;
            for(let i=0; i<retailVouchDetails.length; i++){
              if((retailVouchDetails[i].iReturnStatus != 2) && (retailVouchDetails[i]._status != "Delete") &&
              (retailVouchDetails[i].ikitType != 1)) retailVouchDetails[i].isCount = true;  //退品行、删除的行、套件主商品不参与计算
              if(retailVouchDetails[i].fPrice < 0) priceflag = true; //商品行单价小于0，做标记
              if(retailVouchDetails[i].fMoney && retailVouchDetails[i].isCount){ //只统计真正参与计算的商品行
                fDetailMoney = fDetailMoney + 1*retailVouchDetails[i].fMoney;
              }
              if(retailVouchDetails[i].fEffaceMoney && retailVouchDetails[i].isCount){
                fDetailfEffaceMoneysum = fDetailfEffaceMoneysum + 1*retailVouchDetails[i].fEffaceMoney
              }
            }
            fDetailMoney = formatMoney(fDetailMoney);
            fDetailfEffaceMoneysum = formatMoney(fDetailfEffaceMoneysum)
            let fMoneySum = formatMoney(data.rm_retailvouch.fMoneySum);
            let fEffaceMoney = formatMoney(data.rm_retailvouch.fEffaceMoney);
            //校验零售单金额和商品行金额合计是否相等
            if(fDetailMoney != fMoneySum){
              args.isSaving = false;
              args.errorMsg = "零售单零售金额与商品行金额合计不等！零售金额为："+fMoneySum+",商品行金额合计为："+fDetailMoney;
              return false;
            }
            //校验抹零金额是否相等
            if(fDetailfEffaceMoneysum != fEffaceMoney){
              args.isSaving = false;
              args.errorMsg = "抹零金额不正确，请检查抹零金额！预计抹零金额为："+fEffaceMoney+",实际子表抹零合计："+fDetailfEffaceMoneysum;
              return false;
            }
          }
          //校验商品单价不能小于0
          if(priceflag == true){
            args.isSaving = false;
            args.errorMsg = "商品单价不能小于0！";
            return false;
          }
        }
        //收款单数据
        //校验零售单收款金额与收款单收款金额是否相等
        if(data && data.rm_gatheringvouch){
          if(data.rm_gatheringvouch.gatheringVouchDetail){
            let gatheringVouchDetail = data.rm_gatheringvouch.gatheringVouchDetail;
            let fDetailMoneyGather = 0;
            for(let i=0; i<gatheringVouchDetail.length; i++){
              if(gatheringVouchDetail[i].fMoney) fDetailMoneyGather = fDetailMoneyGather + 1*gatheringVouchDetail[i].fMoney;
            }
            fDetailMoneyGather = formatMoney(fDetailMoneyGather);
            let fGatheringMoney = formatMoney(data.rm_gatheringvouch.fGatheringMoney);
            if(fDetailMoneyGather != fGatheringMoney){
              args.isSaving = false;
              args.errorMsg = "收款金额与应收金额不符！应收金额为："+fGatheringMoney+",实际收款："+fDetailMoneyGather;
              return false;
            }
          }
        }
      }
      /* 保存save服务之前 */
      viewmodel.on('beforeSaveService', function (args) {
        let { config, getOptions } = args
        let { collectMoneyMethod } = getOptions();
        //卡券收款方式 收银台收款处理
        if (collectMoneyMethod && collectMoneyMethod.value == '2'){
          let coupons = viewmodel.getBillingContext('coupons', 'product')();
          if (coupons && coupons.find(coupon => coupon.dl_paytype == 1)) {
            if(viewmodel.getBillingContext('billingStatus')() == 'CashSale'){
              let payment = viewmodel.getBillingContext('payment', 'paymode')();
              let amountofdecimal = cb.rest.AppContext.option.amountofdecimal;
              let fCouponPaymentMoney = 0.0;
              let gatheringVouchDetail = [];
              //收银台收款时卡券结算方式收款单子表赋值
              for (let i = 0; i < coupons.length; i++) {
                if (coupons[i].dl_paytype == 1) {
                  //收款方式卡券且影响销售金额
                  if(coupons[i].iSaleDiscountType == 1){
                    coupons[i].fMoney = cb.utils.getRoundValue(1 * coupons[i].fMoney - 1 * coupons[i].affectDiscountMoney, amountofdecimal);
                  }
                  fCouponPaymentMoney = fCouponPaymentMoney + 1 * coupons[i].fMoney;
                  let couponPayment = payment[coupons[i].paymentMethodId];
                  if(couponPayment){
                    if(gatheringVouchDetail && gatheringVouchDetail.find(g => g.iPaymentid == couponPayment.paymethodId)){
                      for (let j = 0; j < gatheringVouchDetail.length; j++) {
                        //收款单支付子表
                        if(gatheringVouchDetail[j].iPaymentid == couponPayment.paymethodId){
                          gatheringVouchDetail[j].fMoney = cb.utils.getRoundValue(1 * gatheringVouchDetail[j].fMoney + 1 * coupons[i].fMoney, amountofdecimal);
                          //收款单支付孙表
                          let gatheringvouchPaydetail = [];
                          if (gatheringVouchDetail[j].gatheringvouchPaydetail && gatheringVouchDetail[j].gatheringvouchPaydetail.length > 0) {
                            gatheringvouchPaydetail = gatheringVouchDetail[j].gatheringvouchPaydetail;
                          }
                          let dPayTime = new Date().format('yyyy-MM-dd hh:mm:ss');
                          gatheringvouchPaydetail.push({
                            cCardCode: coupons[i].cGiftTokensn,
                            fAmount: cb.utils.getRoundValue(coupons[i].fMoney, amountofdecimal),
                            dPayTime: dPayTime,
                            iPaymentid: couponPayment.paymethodId,
                            iPaytype: couponPayment.paymentType,
                            _status: 'Insert'
                          });
                          gatheringVouchDetail[j].gatheringvouchPaydetail = gatheringvouchPaydetail;
                        }
                      }
                    }else{
                      //收款单支付孙表
                      let gatheringvouchPaydetail = [];
                      let dPayTime = new Date().format('yyyy-MM-dd hh:mm:ss');
                      gatheringvouchPaydetail.push({
                        cCardCode: coupons[i].cGiftTokensn,
                        fAmount: cb.utils.getRoundValue(coupons[i].fMoney, amountofdecimal),
                        dPayTime: dPayTime,
                        iPaymentid: couponPayment.paymethodId,
                        iPaytype: couponPayment.paymentType,
                        _status: 'Insert'
                      });
                      //收款单支付子表
                      gatheringVouchDetail.push({
                        fMoney: coupons[i].fMoney,
                        Paymentname: couponPayment.name,
                        iOrder: couponPayment.orderBy,
                        iPaymentid: couponPayment.paymethodId,
                        iPaymentid_name: couponPayment.name,
                        iPaytype: couponPayment.paymentType,
                        gatheringvouchPaydetail: gatheringvouchPaydetail,
                        _status: "Insert"
                      });
                    }
                  }else{
                    args.isSaving = false;
                    args.errorMsg = '未获取到卡券['+coupons[i].cGiftTokenname+']所对用的收款方式!';
                    return false;
                  }
                }
              }
              //仅适用于 收银台收款并且有卡券结算方式时
              let saveInfo = JSON.parse(args.config.params.data);
              let rm_retailvouch = saveInfo.rm_retailvouch;
              let rm_gatheringvouch = saveInfo.rm_gatheringvouch;
              //更新零售单收款方式子表
              rm_retailvouch.bCheckstandAndCoupon = 1;
              rm_retailvouch.fCouponPaymentMoney = cb.utils.getRoundValue(fCouponPaymentMoney, amountofdecimal);
              rm_retailvouch.retailVouchGatherings = gatheringVouchDetail
              //更新收款单表头应收金额
              rm_gatheringvouch.fGatheringMoney = cb.utils.getRoundValue(fCouponPaymentMoney, amountofdecimal);
              //更新收款单收款方式子表
              rm_gatheringvouch.gatheringVouchDetail = gatheringVouchDetail;
              args.config.params.data = JSON.stringify(saveInfo);
            }else{
              args.isSaving = false;
              args.errorMsg = '现销时才能使用卡券作为收款方式!';
              return false;
            }
          }else{
            let saveInfo = JSON.parse(args.config.params.data);
            saveInfo.rm_gatheringvouch = {};
            args.config.params.data = JSON.stringify(saveInfo);
          }
        }

        // 储值卡充值不能使用储值卡或会员钱包支付
        if (viewmodel.getParams().bStorageCardRecharge) {
          let saveInfo = JSON.parse(args.config.params.data);
          let payTypes = saveInfo.rm_gatheringvouch.gatheringVouchDetail          // 获取收款方式
          let paytype = payTypes.find(paytype => paytype.iPaytype == 5 || paytype.iPaytype == 18);
          if (paytype) {
            args.isSaving = false;
            args.errorMsg = '储值业务类型下不能使用储值卡或会员钱包支付';
            return false;
          }
          /* 计算储值折扣额 */
          let rm_retailvouch = saveInfo.rm_retailvouch;
          rm_retailvouch.fDiscountSum = 0;
          rm_retailvouch.isCardRecharge = true;   //标记零售单
          rm_retailvouch.retailVouchDetails.forEach(
            detail => {
              rm_retailvouch.fDiscountSum += Number(detail.fDiscount ? detail.fDiscount : 0);
              // rm_retailvouch.fPromotionSum += Number(detail.fDiscount ? detail.fDiscount : 0);
              // rm_retailvouch.fSceneDiscountSum += Number(detail.fDiscount ? detail.fDiscount : 0);
            }
          );
          rm_retailvouch.fDiscountSum = rm_retailvouch.fDiscountSum.toFixed(cb.rest.AppContext.option.amountofdecimal);
          args.config.params.data = JSON.stringify(saveInfo);

        }

        // 会员钱包充值不能使用储值卡或会员钱包支付
        if (viewmodel.getParams().bMemberWalletRecharge) {
          let saveInfo = JSON.parse(args.config.params.data);
          let payTypes = saveInfo.rm_gatheringvouch.gatheringVouchDetail          // 获取收款方式
          let paytype = payTypes.find(paytype => paytype.iPaytype == 5 || paytype.iPaytype == 18);
          if (paytype) {
            args.isSaving = false;
            args.errorMsg = '储值业务类型下不能使用储值卡或会员钱包支付';
            return false;
          }
        }

        // 会员钱包单账户支付设置支付孙表
        if (JSON.parse(args.config.params.data)
          && JSON.parse(args.config.params.data).rm_gatheringvouch
          && JSON.parse(args.config.params.data).rm_gatheringvouch.gatheringVouchDetail
          && JSON.parse(args.config.params.data).rm_gatheringvouch.gatheringVouchDetail.find(detail => detail.iPaytype == 5)) {
          let saveInfo = JSON.parse(args.config.params.data);
          let rm_gatheringvouch = saveInfo.rm_gatheringvouch;
          let gatheringVouchDetail = rm_gatheringvouch.gatheringVouchDetail;
          let walletDetail = null;
          let walletDetailIndex = null;
          for (let i = 0; i < gatheringVouchDetail.length; i++) {
            if (gatheringVouchDetail[i].iPaytype == 5) {
              walletDetail = gatheringVouchDetail[i];
              walletDetailIndex = i;
            }
          }
          if (walletDetail != null && walletDetailIndex != null) {
            let walletPayDetail = walletDetail.gatheringvouchPaydetail;
            if (walletPayDetail && walletPayDetail.length == 1) {   // 只有一个有效钱包支付时
              let accountDetail = walletPayDetail[0];
              if (accountDetail.isSingleWallet === true) {  // 单钱包支付
                if (walletDetail.fMoney * 1 > accountDetail.pament_available_balance * 1) {
                  args.isSaving = false;
                  args.errorMsg = '钱包支付金额不能大于钱包可用金额';
                  return false;
                }
                accountDetail.dPayTime = new Date().format('yyyy-MM-dd hh:mm:ss');
                accountDetail.fAmount = walletDetail.fMoney;
                accountDetail.fBalance = cb.utils.getRoundValue(Number(accountDetail.fBalance) - Number(walletDetail.fMoney), cb.rest.AppContext.option.amountofdecimal);

                // 反向赋值, 什么鬼...
                walletPayDetail[0] = accountDetail;
                walletDetail.gatheringvouchPaydetail = walletPayDetail;
                gatheringVouchDetail[walletDetailIndex] = walletDetail;
                rm_gatheringvouch.gatheringVouchDetail = gatheringVouchDetail;
                saveInfo.rm_gatheringvouch = rm_gatheringvouch;
                args.config.params.data = JSON.stringify(saveInfo);
              }
            }
          }
        }

        // 赠品中含有实体卡券商品时校验卡券号必输判断 sunhyu
        if (JSON.parse(args.config.params.data)
          && JSON.parse(args.config.params.data).rm_retailvouch
          && JSON.parse(args.config.params.data).rm_retailvouch.retailVouchDetails) {
          let saveInfo = JSON.parse(args.config.params.data);
          let retailVouchDetails = saveInfo.rm_retailvouch.retailVouchDetails;
          let checkPromotionProductCardNum = false;
          let checkCouponRefreshChoose = false;
          for (var i = 0; i < retailVouchDetails.length; i++) {
            let retailVouchDetail = retailVouchDetails[i];
            if (retailVouchDetail.iPromotionProduct == 1 && retailVouchDetail.productrealProductAttributeType == 2) {
              if (cb.utils.isEmpty(retailVouchDetail.cCouponsn)) {
                checkPromotionProductCardNum = true;
                break;
              }
            }
            if(retailVouchDetail.fCouponPayApportion && ((retailVouchDetail.iReturnStatus == 2 && retailVouchDetail.fCouponPayApportion > 0) || Math.abs(retailVouchDetail.fCouponPayApportion) - Math.abs(retailVouchDetail.fMoney) > 0)){
              checkCouponRefreshChoose = true;
              break;
            }
          }
          if (checkPromotionProductCardNum) {
            args.isSaving = false;
            args.errorMsg = '赠品中含有实体卡券商品,卡券号必输';
            return false;
          }
        //零售单保存前校验：若退品行的卡券结算分摊额大于零，或者存在卡券结算分摊额大于金额的行，
        //则给出提示且不允许结算：使用卡券结算且商品行金额有变化时，需要取消已经执行的促销，并重新执行
          if (checkCouponRefreshChoose && viewmodel.getBillingContext('billingStatus')() == 'Shipment') {
            args.isSaving = false;
            args.errorMsg = '使用卡券结算且商品行金额有变化时，需要取消已经执行的促销，并重新执行';
            return false;
          }
        }

        // 售卡时 实体卡券卡号必输判断 实体卡券与虚拟卡券不能同时售卖判断   sunhyu
        // 卡券非原单退时 卡券号必输判断 实体卡券与虚拟卡券不能同时售卖判断且数量都为-1
        // 卡券原单退时 卡券号必输判断 卡券数量为-1
        if (viewmodel.getParams().bCardCoupon || viewmodel.getParams().bCardCouponBack) {
          let saveInfo = JSON.parse(args.config.params.data);
          let retailVouchDetails = saveInfo.rm_retailvouch.retailVouchDetails;
          let checkCardNumMustInput = false;//判断卡券号必输
          let hasRealCardType = false;//商品中有实体卡券
          let hasVirtualCardType = false;//商品中有虚拟卡券
          let bIsBack = false;//卡券退货数量应为-1
          let checkRealCardNum = false;//卡券销售时校验实体卡数量应为1
          let checkCardPrice = false;//校验卡券金额
          let errorMessage = '';
          if (retailVouchDetails && retailVouchDetails.length > 0) {
            for (var i = 0; i < retailVouchDetails.length; i++) {
              let retailVouchDetail = retailVouchDetails[i];
              if (viewmodel.getParams().bCardCoupon) {
                if (retailVouchDetail.productrealProductAttributeType == 2) {
                  hasRealCardType = true;
                  if (cb.utils.isEmpty(retailVouchDetail.cCouponsn) && cb.utils.isEmpty(retailVouchDetail.beginCouponsn) && cb.utils.isEmpty(retailVouchDetail.endCouponsn)) {
                    checkCardNumMustInput = true;
                    break;
                  }
                  if (!cb.utils.isEmpty(retailVouchDetail.cCouponsn) && retailVouchDetail.fQuantity != 1) {
                    checkRealCardNum = true;
                    break;
                  }
                }
                if (retailVouchDetail.iProductModel == 3) hasVirtualCardType = true;

                //保存时校验卡券商品建议零售价与卡券档案减免金额是否相等
                let couponPrice = viewmodel.getParams().couponPrice;
                if((retailVouchDetail.couponType == 1 && !cb.utils.isEmpty(couponPrice[retailVouchDetail.cCouponId]) && Math.abs(retailVouchDetail.fQuotePrice - couponPrice[retailVouchDetail.cCouponId]) != 0)
                  || (retailVouchDetail.couponType == 1 && cb.utils.isEmpty(couponPrice[retailVouchDetail.cCouponId]))){
                  checkCardPrice = true;
                  errorMessage = errorMessage+retailVouchDetail.product_cName+',';
                }
                if(retailVouchDetail.couponType == 5 && !cb.utils.isEmpty(couponPrice[retailVouchDetail.cCouponId])
                  && couponPrice[retailVouchDetail.cCouponId] - 0 != 0 && Math.abs(retailVouchDetail.fQuotePrice - couponPrice[retailVouchDetail.cCouponId]) > 0.1){
                  checkCardPrice = true;
                  errorMessage = errorMessage+retailVouchDetail.product_cName+',';
                }

              } else if (viewmodel.getParams().bCardCouponBack) {
                if (retailVouchDetail.productrealProductAttributeType == 2) {
                  hasRealCardType = true;
                  if (cb.utils.isEmpty(retailVouchDetail.cCouponsn) && cb.utils.isEmpty(retailVouchDetail.beginCouponsn) && cb.utils.isEmpty(retailVouchDetail.endCouponsn)) {
                    checkCardNumMustInput = true;
                    break;
                  }
                }
                if (retailVouchDetail.iProductModel == 3) {
                  hasVirtualCardType = true;
                  if (cb.utils.isEmpty(retailVouchDetail.cCouponsn) && cb.utils.isEmpty(retailVouchDetail.beginCouponsn) && cb.utils.isEmpty(retailVouchDetail.endCouponsn)) {
                    checkCardNumMustInput = true;
                    break;
                  }
                }
                if (!cb.utils.isEmpty(retailVouchDetail.cCouponsn) && retailVouchDetail.fQuantity != -1) {
                  bIsBack = true;
                  break;
                }
                //保存时校验卡券商品建议零售价与卡券档案减免金额是否相等
                let couponPrice = viewmodel.getParams().couponPrice;
                if((retailVouchDetail.couponType == 1 && !cb.utils.isEmpty(couponPrice[retailVouchDetail.cCouponId]) && Math.abs(retailVouchDetail.fQuotePrice - couponPrice[retailVouchDetail.cCouponId]) != 0)
                  || (retailVouchDetail.couponType == 1 && cb.utils.isEmpty(couponPrice[retailVouchDetail.cCouponId]))){
                  checkCardPrice = true;
                  errorMessage = errorMessage+retailVouchDetail.product_cName+',';
                }
              }
              retailVouchDetail["retailVouchCouponSN!cGiftTokensn"] = retailVouchDetail.cCouponsn;
            }
            if (hasRealCardType && hasVirtualCardType) {
              args.isSaving = false;
              args.errorMsg = '不允许同时结算电子卡券与实体卡券';
              return false;
            }
            if (checkCardNumMustInput) {
              args.isSaving = false;
              args.errorMsg = '卡券商品请输入卡券号';
              return false;
            }
            if (bIsBack) {
              args.isSaving = false;
              args.errorMsg = '卡券非原单退,卡券数量应为-1,请勾选退货商品';
              return false;
            }
            if (checkRealCardNum) {
              args.isSaving = false;
              args.errorMsg = '实体卡券商品销售,卡券数量应为1';
              return false;
            }
            if (checkCardPrice) {
              args.isSaving = false;
              args.errorMsg = '卡券商品['+errorMessage+']零售价与券档案减免金额不符,请检查';
              return false;
            }
          }
          args.config.params.data = JSON.stringify(saveInfo);
        } else if (viewmodel.getBillingContext('billingStatus')() == 'FormerBackBill' || viewmodel.getParams().bCardCouponOriginBack) {
          let saveInfo = JSON.parse(args.config.params.data);
          let retailVouchDetails = saveInfo.rm_retailvouch.retailVouchDetails;
          if (retailVouchDetails && retailVouchDetails.length > 0) {
            for (var i = 0; i < retailVouchDetails.length; i++) {
              let retailVouchDetail = retailVouchDetails[i];
              if (!cb.utils.isEmpty(retailVouchDetail.cCouponId)) {
                if (cb.utils.isEmpty(retailVouchDetail.cCouponsn) && cb.utils.isEmpty(retailVouchDetail.beginCouponsn) && cb.utils.isEmpty(retailVouchDetail.endCouponsn)) {
                  args.isSaving = false;
                  args.errorMsg = '卡券商品原单退货,请输入卡券号';
                  return false;
                }
                else if (!cb.utils.isEmpty(retailVouchDetail.cCouponsn) && retailVouchDetail.fQuantity != -1) {
                  args.isSaving = false;
                  args.errorMsg = '卡券商品原单退货,卡券数量应为-1';
                  return false;
                }
                retailVouchDetail["retailVouchCouponSN!cGiftTokensn"] = retailVouchDetail.cCouponsn;
              }
            }
          }
          args.config.params.data = JSON.stringify(saveInfo);
        }

        /* 卡券支付时为收款单子表赋卡券溢收金额、卡券分摊折扣额 */
        if (JSON.parse(args.config.params.data)
          && JSON.parse(args.config.params.data).rm_gatheringvouch
          && JSON.parse(args.config.params.data).rm_gatheringvouch.gatheringVouchDetail
          && JSON.parse(args.config.params.data).rm_gatheringvouch.gatheringVouchDetail.find(detail => detail.iPaytype == 21)) {
          let coupons = viewmodel.getBillingContext('coupons', 'product')();
          if (coupons) {
            let saveInfo = JSON.parse(args.config.params.data);
            let rm_gatheringvouch = saveInfo.rm_gatheringvouch;
            let gatheringVouchDetail = rm_gatheringvouch.gatheringVouchDetail;
            let amountofdecimal = cb.rest.AppContext.option.amountofdecimal;
            for (let i = 0; i < gatheringVouchDetail.length; i++) {
              if (gatheringVouchDetail[i].iPaytype == 21) { //卡券收款方式
                for (let j = 0; j < coupons.length; j++) {
                  //卡券溢收金额
                  if (coupons[j].dl_paytype == 1 && coupons[j].paymentMethodId == gatheringVouchDetail[i].iPaymentid && !cb.utils.isEmpty(coupons[j].overFlowMoney)) {
                    if (cb.utils.isEmpty(gatheringVouchDetail[i].overFlowMoney)) {
                      gatheringVouchDetail[i].overFlowMoney = cb.utils.getRoundValue(coupons[j].overFlowMoney, amountofdecimal);
                    } else {
                      gatheringVouchDetail[i].overFlowMoney = cb.utils.getRoundValue(1 * gatheringVouchDetail[i].overFlowMoney + 1 * coupons[j].overFlowMoney, amountofdecimal);
                    }
                  }
                  //卡券分摊折扣额
                  if (coupons[j].dl_paytype == 1 && coupons[j].paymentMethodId == gatheringVouchDetail[i].iPaymentid && coupons[j].iSaleDiscountType == 1) {
                    // 1:减少销售金额 无需处理
                  } else if (coupons[j].dl_paytype == 1 && coupons[j].paymentMethodId == gatheringVouchDetail[i].iPaymentid) {
                    //0:不影响销售金额
                    if (cb.utils.isEmpty(gatheringVouchDetail[i].fCardDisApportion)) {
                      gatheringVouchDetail[i].fCardDisApportion = cb.utils.getRoundValue(coupons[j].affectDiscountMoney, amountofdecimal);
                    } else {
                      gatheringVouchDetail[i].fCardDisApportion = cb.utils.getRoundValue(1 * gatheringVouchDetail[i].fCardDisApportion + 1 * coupons[j].affectDiscountMoney, amountofdecimal);
                    }
                  }

                }
              }
            }
            args.config.params.data = JSON.stringify(saveInfo);
          }
        }

        // /* 判断储值卡支付时是否已有孙表 */
        // if (!JSON.parse(args.config.params.data).backinfo
        //   && JSON.parse(args.config.params.data).rm_gatheringvouch.gatheringVouchDetail
        //   && JSON.parse(args.config.params.data).rm_gatheringvouch.gatheringVouchDetail.find(detail => detail.iPaytype == 18)) {          // 是储值卡支付
        //   let saveInfo = JSON.parse(args.config.params.data);
        //   // 如果包含储值卡结算方式就执行下面的
        //   let gatherCardPayInfo = saveInfo.rm_gatheringvouch.gatheringVouchDetail.find(detail => detail.iPaytype == 18);
        //   if (gatherCardPayInfo && gatherCardPayInfo.fMoney != 0
        //     && (!gatherCardPayInfo.gatheringvouchPaydetail || gatherCardPayInfo.gatheringvouchPaydetail.length == 0)) {     // 如果是原单退
        //     args.isSaving = false;
        //     args.errorMsg = '请检查储值卡是否正确有效';
        //     return false;
        //   }
        // }

        // /* 判断原单退货时是否自动带下收款孙表 */
        // if (JSON.parse(args.config.params.data).backinfo) {          // 是原单退货
        //   let saveInfo = JSON.parse(args.config.params.data);
        //   // 如果包含储值卡结算方式就执行下面的
        //   let backCardPayInfo = saveInfo.backinfo.rm_gatheringvouch.gatheringVouchDetail.find(detail => detail.iPaytype == 18);
        //   let gatherCardPayInfo = saveInfo.rm_gatheringvouch.gatheringVouchDetail.find(detail => detail.iPaytype == 18);
        //   if (backCardPayInfo && gatherCardPayInfo && gatherCardPayInfo.fMoney != 0
        //     && (!gatherCardPayInfo.gatheringvouchPaydetail || gatherCardPayInfo.gatheringvouchPaydetail.length == 0)) {     // 如果是原单退
        //     args.isSaving = false;
        //     args.errorMsg = '请检查退款储值卡是否正确有效';
        //     return false;
        //   }
        // }

        //选配套餐
        let isPackageInput = false;
        let products = viewmodel.getBillingContext('products')()
        for (let i = 0; i < products.length; i++) {
          if (products[i]["isPackageInput"] == true) {
            isPackageInput = true;
            break;
          }
        }

        if (isPackageInput) {
          cb.utils.alert('套餐商品未录入完毕,不允许执行保存', 'error');
          return false;
        }

        // 金额调整单
        let data = JSON.parse(config.params.data)
        if (data.rm_retailvouch.bAmountAdjustment == true) { //如果是金额调整零售单，零售单子表数量为0
          // 重新生成调整单单据编号：原单编号加调整次数后缀
          let adjustCode = "";
          let adjustNum = data.rm_retailvouch.iAmountAdjustNum + 1;
          adjustCode = adjustCode + adjustNum;
          //  adjustCode = adjustCode.substring(adjustCode.length - 5);
          adjustCode = data.rm_retailvouch.billNo + "-" + adjustCode;
          data.rm_retailvouch.code = adjustCode;
          data.rm_retailvouch.iPresellState = iPresellState_1;
          //应收不等于实收，重新给GatheringMoney赋值
          let retailVouchGatherings = data.rm_retailvouch.retailVouchGatherings;
          if (!cb.utils.isEmpty(retailVouchGatherings) && retailVouchGatherings.length == 1) {
            data.rm_retailvouch.fGatheringMoney = data.rm_retailvouch.retailVouchGatherings[0].fMoney;
            data.rm_gatheringvouch.fGatheringMoney = data.rm_retailvouch.retailVouchGatherings[0].fMoney;
          } else if (!cb.utils.isEmpty(retailVouchGatherings) && retailVouchGatherings.length == 0) {
            data.rm_retailvouch.fGatheringMoney = "0";
            data.rm_gatheringvouch.fGatheringMoney = "0";
          }
          if (data.rm_retailvouch.fMoneySum != data.rm_retailvouch.fGatheringMoney) { //如果收款额和金额合计不等，收款状态为未收款完毕
            data.rm_retailvouch.iPayState = 0;
          }
          data.rm_retailvouch.fQuantitySum = 0;
          data.rm_retailvouch.fQuoteMoneySum = 0;
          data.rm_retailvouch.retailVouchDetails.forEach(function (item) {
            item.fAdjustAmount = 0;
            item.fQuantity = 0;
            item.fQuoteMoney = 0;
          });
        }

        //离线单据状态下预定相关的业务不允许结算
        let lineConnection_p = viewmodel.getBillingContext('lineConnection', 'offLine')();
        if (!lineConnection_p) {
          let presellStatus = viewmodel.getBillingContext('billingStatus')();
          let billingStatusList = ['PresellBill', 'Shipment', 'PresellBack'];
          if (billingStatusList.includes(presellStatus)) {
            args.isSaving = false;
            args.errorMsg = "当前处于离线状态,不允许结算保存";
            return false;
          }
        }

        //零售单存盘前拼接cEInvoiceURL(app离线开单打印二维码相关)
        if (!cb.utils.isEmpty(data.rm_retailvouch.cEInvoiceURL)) {
          if (!cb.utils.isEmpty(data.rm_retailvouch.cGUID))
            data.rm_retailvouch.cEInvoiceURLPrint = data.rm_retailvouch.cEInvoiceURL + data.rm_retailvouch.cGUID;
        }
        //预订变更单，保存前处理主子表数据
        if (viewmodel.getParams().presellChange) {
          //预订变更应收不等于实收需要处理应收金额统计
          let retailVouchGatherings = data.rm_retailvouch.retailVouchGatherings;
          if (!cb.utils.isEmpty(retailVouchGatherings) && retailVouchGatherings.length != 0) {
            //遍历收款单子表的收款金额
            let gatheringMoneySum = 0.0;
            for (let i = 0; i < retailVouchGatherings.length; i++) {
              gatheringMoneySum = gatheringMoneySum + 1 * retailVouchGatherings[i].fMoney;
            }
            data.rm_retailvouch.fGatheringMoney = gatheringMoneySum;
            data.rm_gatheringvouch.fGatheringMoney = gatheringMoneySum;
          } else if (!cb.utils.isEmpty(retailVouchGatherings) && retailVouchGatherings.length == 0) {
            data.rm_retailvouch.fGatheringMoney = "0";
            data.rm_gatheringvouch.fGatheringMoney = "0";
          }
          let fPreGatheringMoney = data.rm_retailvouch.fGatheringMoney;
          let fPreMoneySum = data.rm_retailvouch.fMoneySum;
          let fPrePresellPayMoney = data.rm_retailvouch.fPresellPayMoney;
          if (!cb.utils.isEmpty(fPreGatheringMoney)) {
            fPreGatheringMoney = 1 * fPreGatheringMoney;
          } else {
            fPreGatheringMoney = 0.0;
          }
          if (!cb.utils.isEmpty(fPreMoneySum)) {
            fPreMoneySum = 1 * fPreMoneySum;
          } else {
            fPreMoneySum = 0.0;
          }
          if (!cb.utils.isEmpty(fPrePresellPayMoney)) {
            fPrePresellPayMoney = 1 * fPrePresellPayMoney;
          } else {
            fPrePresellPayMoney = 0.0;
          }
          if ((fPrePresellPayMoney + fPreGatheringMoney) != fPreMoneySum) { //如果收款额和金额合计不等，收款状态为未收款完毕
            data.rm_retailvouch.iPayState = 0;
          }
          //-----------end
          let oldDetails = data.presellinfo.rm_retailvouch.retailVouchDetails;
          let oldRetailvouchgifttoken = data.presellinfo.rm_retailvouch.retailvouchgifttoken;
          let deleteDetails = JSON.parse(JSON.stringify(oldDetails)); //将原来的数据备份到新的对象中
          let oldfGatheringMoney = data.presellinfo.rm_retailvouch.fGatheringMoney; //获取原单的fGatheringMoney 类型为数字型
          for (let i = 0; i < deleteDetails.length; i++) {
            deleteDetails[i]._status = "Delete";
            deleteDetails[i].key = deleteDetails[i].key + "_Delete";
            data.rm_retailvouch.retailVouchDetails.push(deleteDetails[i]);
          }
          if(!cb.utils.isEmpty(oldRetailvouchgifttoken)){ //如果原单有卡券子表，将原单相关数据置delete状态拼到本单中
            let deleteGifttoken = JSON.parse(JSON.stringify(oldRetailvouchgifttoken));
            for(let i=0; i<deleteGifttoken.length; i++){
              deleteGifttoken[i]._status = "Delete";
              if(!cb.utils.isEmpty(data.rm_retailvouch.retailvouchgifttoken)){
                data.rm_retailvouch.retailvouchgifttoken.push(deleteGifttoken[i]);
              }
            }
            //如果本单没有卡券子表，则将原单变为delete状态拼接到本单中
            if(cb.utils.isEmpty(data.rm_retailvouch.retailvouchgifttoken)) data.rm_retailvouch.retailvouchgifttoken = deleteGifttoken;
          }
          //主表数据更新为update
          data.rm_retailvouch._status = "Update";
          data.rm_retailvouch.iDeliveryState = 0;  //预订变更后交货状态还是“未交”
          data.rm_retailvouch.iPresellState = 1;   //预订单状态为预订
          let fPresellPayMoney = data.rm_retailvouch.fPresellPayMoney; //已收款金额 类型为字符串型
          let fGatheringMoney = data.rm_retailvouch.fGatheringMoney; //本次实收金额 字符串型
          //将本次实收金额累积到已收款金额,累记实收金额
          data.rm_retailvouch.fPresellPayMoney = viewmodel.billingFunc.formatMoney(1 * fPresellPayMoney + 1 * fGatheringMoney).toFixed(cb.rest.AppContext.option.amountofdecimal);
          data.rm_retailvouch.fGatheringMoney = viewmodel.billingFunc.formatMoney(1 * fGatheringMoney + oldfGatheringMoney).toFixed(cb.rest.AppContext.option.amountofdecimal);
          //收款单vouchdate维护为本次变更时间
          data.rm_gatheringvouch.vouchdate = (new Date()).format('yyyy-MM-dd hh:mm:ss');
          if (data.rm_gatheringvouch) { //如果收款单没有子表，则将收款单主表置空
            if (cb.utils.isEmpty(data.rm_gatheringvouch.gatheringVouchDetail) || (data.rm_gatheringvouch.gatheringVouchDetail.length == 0)) {
              data.rm_gatheringvouch = {};
            }else{ //收款单不置空时，维护收款单主表的收款类型字段
              data.rm_gatheringvouch.iGathtype = 1;
            }
          }
        }

        let originBillHeader = viewmodel.getBillingContext('originBillHeader')()
        let billingStatus = viewmodel.getBillingContext('billingStatus')();
        if (billingStatus === 'FormerBackBill') {
          var bReturnStore_1 = viewmodel.get("bReturnStore_1") && viewmodel.get("bReturnStore_1").getValue();
          let iTakeway = originBillHeader.iTakeway;
          if (cb.rest.AppContext.tenant.industry == 19 || iTakeway == 2) {
            //退回门店时：退货零售单生成时为“已交货”状态
            if (bReturnStore_1 == 'true') {
              data.rm_retailvouch.iDeliveryState = 1;
            } else {
              //非退回门店时：退货零售单生成时为“未交货”状态
              data.rm_retailvouch.iDeliveryState = 0;
            }
          }

        }

        if(viewmodel.getParams().backMallStoragecard){ //如果有退回商城的储值卡相关的则给收款单子表维护分摊金额和折扣额
          let backData = viewmodel.getParams().backMallStoragecard;
          if(data && data.rm_gatheringvouch && data.rm_gatheringvouch.gatheringVouchDetail){
            for(let i=0; i<data.rm_gatheringvouch.gatheringVouchDetail.length; i++){
              if(backData.paymethodId == data.rm_gatheringvouch.gatheringVouchDetail[i].iPaymentid){
                if(!cb.utils.isEmpty(backData.fCardApportionSum) &&(backData.fCardApportionSum != 0)){
                  data.rm_gatheringvouch.gatheringVouchDetail[i].fCardCoPay = viewmodel.billingFunc.formatMoney(backData.fCardApportionSum).toFixed(cb.rest.AppContext.option.amountofdecimal) ;
                }
                if(!cb.utils.isEmpty(backData.fCardDisApportionSum) && (backData.fCardDisApportionSum != 0)){
                  data.rm_gatheringvouch.gatheringVouchDetail[i].fCardDisApportion = viewmodel.billingFunc.formatMoney(backData.fCardDisApportionSum).toFixed(cb.rest.AppContext.option.amountofdecimal);
                }
              }
            }
          }
        }
        //预订交货，退品商品行处理到退品单字表中(只有预订交货处理，预订变更不处理)
        if (billingStatus == 'Shipment' && (!viewmodel.getParams().presellChange)) {
          let RetailVouchReturnDetail = [];
          for (let i = 0; i < data.rm_retailvouch.retailVouchDetails.length; i++) {
            let iReturnStatus = data.rm_retailvouch.retailVouchDetails[i].iReturnStatus;
            if (iReturnStatus == 2) {
              let backProduct = data.rm_retailvouch.retailVouchDetails[i];
              RetailVouchReturnDetail.push(backProduct);
              data.rm_retailvouch.retailVouchDetails.splice(i, 1);
              i = i - 1;
            }
          }
          data.rm_retailvouch.retailVouchReturnDetails = RetailVouchReturnDetail;
        }
        //预订交货和变更时来源不是开单预订的单子，收款单相关数据维护(维护为本次新的收款单)
        if(billingStatus == 'Shipment'){
          if (data.rm_gatheringvouch && (data.rm_retailvouch.ibillSource != 0)){
            if(!cb.utils.isEmpty(data.rm_gatheringvouch.dMakeDate)){
              let newDate = new Date();
              data.rm_gatheringvouch.dMakeDate = newDate.format('yyyy-MM-dd hh:mm:ss');
              data.rm_gatheringvouch.dDate = newDate.format('yyyy-MM-dd') + " " + "00:00:00";
            }
            if(!cb.utils.isEmpty(data.rm_gatheringvouch.ibillSource)) data.rm_gatheringvouch.ibillSource = 0;

          }
        }

        //预定变更交货 原单使用过卡券收款方式且变更过优惠券的 生成反向收款反单抵消原卡券收款方式
        if(billingStatus == 'Shipment' && checkCouponUsed()){
          let amountofdecimal = cb.rest.AppContext.option.amountofdecimal;
          let rm_retailvouch = data.rm_retailvouch;
          let rm_gatheringvouch = data.rm_gatheringvouch;
          let rm_presellinfo = data.presellinfo;
          //判断预定单是否有卡券结算方式
          if(rm_presellinfo && rm_presellinfo.rm_gatheringvouch && rm_presellinfo.rm_gatheringvouch.gatheringVouchDetail && rm_presellinfo.rm_gatheringvouch.gatheringVouchDetail.find(detail => detail.iPaytype == 21)){
            let targetDetails = rm_presellinfo.rm_gatheringvouch.gatheringVouchDetail;
            //根据时间倒序排列
            targetDetails.sort((item1, item2) => {
              return item1.pubts < item2.pubts?1:-1;
            })
            //先遍历targetDetails取最新日期的卡券结算方式 锁定范围 判断是否需生成反向收款单
            let tempTargetDetail = [];
            for (let i = 0; i < targetDetails.length; i++) {
              let targetDetail = targetDetails[i];
              if(targetDetail.iPaytype == 21 && targetDetail.pubts == targetDetails[0].pubts && targetDetail.fMoney - 0 > 0){
                tempTargetDetail.push(targetDetail);
              }
            }

            if(tempTargetDetail.length > 0){
              let originPresellPayMoney = 0.0;
              targetDetails = tempTargetDetail;
              let gatheringVouchDetail = (rm_gatheringvouch.gatheringVouchDetail && rm_gatheringvouch.gatheringVouchDetail.length > 0)?rm_gatheringvouch.gatheringVouchDetail:[];
              //收银台收款时卡券结算方式收款单子表赋值
              for (let i = 0; i < targetDetails.length; i++) {
                let targetDetail = targetDetails[i];
                originPresellPayMoney = cb.utils.getRoundValue(1 * originPresellPayMoney + 1 * targetDetail.fMoney,amountofdecimal);
                //收款单支付孙表
                let gatheringvouchPaydetail = [];
                if(targetDetail.gatheringvouchPaydetail && targetDetail.gatheringvouchPaydetail.length > 0){
                  let dPayTime = new Date().format('yyyy-MM-dd hh:mm:ss');
                  for (let j = 0; j < targetDetail.gatheringvouchPaydetail.length; j++) {
                    let targetPayDetail = targetDetail.gatheringvouchPaydetail[j];
                    gatheringvouchPaydetail.push({
                      fAmount: -1 * targetPayDetail.fAmount,
                      dPayTime: dPayTime,
                      iPaymentid: targetPayDetail.iPaymentid,
                      iPaytype: targetPayDetail.iPaytype,
                      _status: 'Insert'
                    });
                  }

                  //收款单支付子表
                  gatheringVouchDetail.push({
                    fMoney: -1 * targetDetail.fMoney,
                    Paymentname: targetDetail.iPaymentid_name,
                    iPaymentid: targetDetail.iPaymentid,
                    iPaymentid_name: targetDetail.iPaymentid_name,
                    iPaytype: targetDetail.iPaytype,
                    gatheringvouchPaydetail: gatheringvouchPaydetail,
                    iOrder: gatheringVouchDetail.length + 1,
                    _status: "Insert"
                  });
                }
              }

              //重算收款单 零售单表头金额
              let newGatheringMoney = 0.0;
              for (let i = 0; i < gatheringVouchDetail.length; i++) {
                newGatheringMoney = cb.utils.getRoundValue(1 * newGatheringMoney + 1 * gatheringVouchDetail[i].fMoney,amountofdecimal);
              }

              //更新零售单表头收款金额
              rm_retailvouch.fGatheringMoney = newGatheringMoney;
              if(!viewmodel.getParams().presellChange){
                rm_retailvouch.fPresellPayMoney = cb.utils.getRoundValue(1 * rm_retailvouch.fPresellPayMoney + 1 * originPresellPayMoney);
              }
              //更新零售单收款方式子表
              rm_retailvouch.retailVouchGatherings = gatheringVouchDetail
              //更新收款单表头收款金额
              rm_gatheringvouch.fGatheringMoney = newGatheringMoney;
              //更新收款单收款方式子表
              rm_gatheringvouch.gatheringVouchDetail = gatheringVouchDetail;
              //保存修改
              config.params.data = JSON.stringify(data);
            }

          }
        }

        //原单退货，如果有捞出来的退品行数据需要维护一个退品单子表
        if(viewmodel.getBillingContext('billingStatus')() == 'FormerBackBill'){
          if(viewmodel.getParams().retailVouchReturnDetailsNew){
            let RetailVouchReturnDetail = [];
            let retailVouchReturnDetails = viewmodel.getParams().retailVouchReturnDetailsNew;
            for(let i=0; i<retailVouchReturnDetails.length; i++){
              if(retailVouchReturnDetails[i].isReturnProduct){
                RetailVouchReturnDetail.push(retailVouchReturnDetails[i]);
              }
            }
            if(!cb.utils.isEmpty(RetailVouchReturnDetail)){
              data.rm_retailvouch.retailVouchReturnDetails = RetailVouchReturnDetail;
            }
          }
        }
        //零售单主表维护门店所属部门id，打印时需要打印门店部门(haoyj)
        let userStores = cb.rest.AppContext.user.userStores;
        for (let i = 0; i < userStores.length; i++) {
          if (data.rm_retailvouch.store == userStores[i].store) {
            data.rm_retailvouch.iDepartmentid = userStores[i].dept;
            data.rm_retailvouch.iDepartmentid_name = userStores[i].dept_name;
          }
        }

        //如果表体行含有房费商品，且处理状态iProcessingState = 0的，则将其状态改为3
        if(!cb.utils.isEmpty(data.rm_retailvouch.retailVouchDetails)){
          let retailVouchDetails = data.rm_retailvouch.retailVouchDetails;
          let haveRoomProduct = false;
          let roomProducts = [];
          retailVouchDetails.forEach(function (item){
            if(item['product_productProps!define1'] && (item['product_productProps!define1'].includes('房费'))
            && (item.iReturnStatus != 2)){
              haveRoomProduct = true;
              roomProducts.push(item);
            }
          })
          if((data.rm_retailvouch.iProcessingState == 0 || cb.utils.isEmpty(data.rm_retailvouch.iProcessingState)) && haveRoomProduct) data.rm_retailvouch.iProcessingState = 3;
          //如果含有房费商品，则把第一行房费商品的房间类型和时段维护到表头自定义项7和8中,预定单
          if(roomProducts.length > 0 && ('PresellBill' == viewmodel.getBillingContext('billingStatus')())){
            data.rm_retailvouch['retailVouchCustom!define7'] = roomProducts[0].free2;
            data.rm_retailvouch['retailVouchCustom!define8'] = roomProducts[0].free1;
          }
        }
        //处理现场折扣相关的字段
        processDiscount(data);
        // 零售单保存前数据校验
        let checkResult = checkBillData(args, JSON.parse(JSON.stringify(data)));//retailRows为参加数据统计的商品行
        if (checkResult == false) { //如果校验不通过
          return false;
        }
        //保存前收款单处理（如果收款单只有表头没有表体，则将收款单置空）
        if(!cb.utils.isEmptyObject(data.rm_retailvouch)){
          if (cb.utils.isEmptyObject(data.rm_gatheringvouch.gatheringVouchDetail) || (data.rm_gatheringvouch.gatheringVouchDetail.length == 0)) {
            data.rm_gatheringvouch = {};
          }
        }
        if (collectMoneyMethod && collectMoneyMethod.value === '2') {
          data.rm_retailvouch.iGatheringType = 2 // 收银台收款
          let coupons = viewmodel.getBillingContext('coupons', 'product')();
          if (coupons && coupons.find(coupon => coupon.dl_paytype == 1)){
            //收银台收款时 如果存在卡券结算方式 不清空收款单
          }else{
            data.rm_gatheringvouch = {}
          }
          config.params.data = JSON.stringify(data)
          return true
        }
        config.params.data = JSON.stringify(data)
        //零售单保存前校验，收款金额为0时给出提示
        if(data){
          if(data.rm_retailvouch){
            let fMoneySum = data.rm_retailvouch.fMoneySum;
            if(fMoneySum){
              fMoneySum = viewmodel.billingFunc.formatMoney(fMoneySum);
            }
            let promise = new cb.promise();
            if(fMoneySum == 0){
              cb.utils.confirm('本单金额为0，是否继续？', function () {
                // 确认,继续结算操作
                promise.resolve()
              }, function () {  //否，停留在当前界面不结算
                // 取消
                args.isSaving = false;
                args.errorMsg = '本单实收金额为0，请进行确认！';
                viewmodel.billingFunc.closePaymodal();  //回滚数据(有抹零的回滚到抹零前的数据)
                promise.reject()
              })
              return promise;
            }
          }
        }
        // return true
      })

      /*原单退货表头确定前事件*/
      viewmodel.on('beforeUpdateHeader', function (args) {
        let originBillHeader = viewmodel.getBillingContext('originBillHeader')()
        let billingStatus = viewmodel.getBillingContext('billingStatus')();
        var bReturnStore_1 = viewmodel.get("bReturnStore_1").getValue();
        var iReturnWarehousid_1 = viewmodel.get("iReturnWarehousid_1").getValue();
        var iReturnWarehousid_1_name = viewmodel.get("iReturnWarehousid_1_name").getValue();
        if (billingStatus === 'FormerBackBill') {
          let iTakeway = originBillHeader.iTakeway;
          if (cb.rest.AppContext.tenant.industry == 19 || iTakeway == 2) {
            //'退回门店'为否时显示'退货仓库'且非空
            if ((bReturnStore_1 == false || bReturnStore_1 == "false") && cb.utils.isEmpty(iReturnWarehousid_1)) {
              cb.utils.alert('退回门店为否时,退货仓库不能为空！', 'error');
              return false;
            }
          }
          originBillHeader.bReturnStore = bReturnStore_1;
          originBillHeader.iReturnWarehousid = iReturnWarehousid_1;
          originBillHeader.iReturnWarehousid_name = iReturnWarehousid_1_name;
        }
      })
      //调用网络打印--线上订单
      var goMallNetworkPrint = function (bill_id, isCheckstand, isKitchen) {
        let billID = null;
        if (!cb.utils.isEmpty(bill_id)) billID = "" + bill_id;
        let params = {//参数形式为字符串的id
          id: billID,
          isCheckstand: isCheckstand,
          isKitchen: isKitchen
        };
        let getNetworkPrint = cb.rest.DynamicProxy.create({
          settle: {
            url: '/bill/PrintNetwork',
            method: 'POST',
            options: { mask: false }
          }
        });
        getNetworkPrint.settle(params, function (err, result) {
          if (err) {
            cb.utils.alert(err.message, 'error');
            cb.utils.alert('获取网络打印设置失败！', 'error');
          }
          if (result != undefined) {
            for (let i = 0; i < result.length; i++) { //服务返回的数据中，有多少个网络打印机IP就调几次打印机
              if (!cb.utils.isEmpty(result[i].printerIP)) {
                let printerIP = result[i].printerIP;
                let url = 'http://' + printerIP + ':3000/print_for_temp';
                let params1 = { data: result[i] };
                let proxy = cb.rest.DynamicProxy.create({
                  settle: {
                    url: url,
                    method: 'POST',
                    options: { timeout: 30000 }
                  }
                });
                proxy.settle(params1, function (err1, result1) {
                  if (err1) {
                    cb.utils.alert(err1.message, 'error');
                    cb.utils.alert('线上订单网络打印失败！', 'error');
                  }
                })
              }
            }

          }
        });
      }

      //获取线上订单网络打印数据
      var getMallPrintkitchens = function () {
        let store = cb.rest.AppContext.user.storeId;
        let params = { storeId: store };
        let getMallPrintkitchens = cb.rest.DynamicProxy.create({
          settle: {
            url: '/bill/mallprintkitchens',
            method: 'POST',
            options:{mask: false}
          }
        });
        getMallPrintkitchens.settle(params, function (err, result) {
          if (err) {
            cb.utils.alert(err.message, 'error');
            cb.utils.alert('获取线上自动打印数据失败！', 'error');
          }
          if (result != undefined && !cb.utils.isEmpty(result.data)) {
            let billId = "" + result.id;
            let networkCheckstandPrint = false; //是否启用网络收银打印标志
            if (cb.rest.AppContext.option._internetPrint) networkCheckstandPrint = cb.rest.AppContext.option._internetPrint;
            if (!cb.utils.isEmpty(result.data) && result.data.length > 0) { //有厨打商品
              if (networkCheckstandPrint) { //启用了网络收银打
                goMallNetworkPrint(billId, true, true);
              } else {
                goMallNetworkPrint(billId, false, true);
              }
            } else { //无厨打商品
              if (networkCheckstandPrint) {
                goMallNetworkPrint(billId, true, false);
              }
            }
            //  goMallNetworkPrint(billId,false, true);
          }
        })
      }

      var isGoMallPrint = function () {
        let acceptCaterBill = cb.rest.AppContext.option._acceptCaterBill;
        if (acceptCaterBill) getMallPrintkitchens(); //启用接收线上单据，自动调用，线上自动打印
      }
      if (cb.rest.AppContext.user.industry == 20) {
        var interval;
        //判断是否启用了线上自动打印，和刷新数据时间
        interval = setInterval(function () { isGoMallPrint(); }, 60000); //获取线上自动打印数据
      }
      /* 打印前处理数据 */
      viewmodel.on('beforePrint', function (args) {
        // 获取支付孙表数据
        let data = args.middle.code;
        let type = typeof args.middle.code;
        if (type == 'string')
          data = JSON.parse(args.middle.code)
        let cardPaymode = null;
        if (data && data.retailVouchGatherings && data.retailVouchGatherings.length > 0) {
          cardPaymode = data.retailVouchGatherings.find(paymode => paymode.iPaytype == 18);
        }
        if (cardPaymode && cardPaymode.gatheringvouchPaydetail && cardPaymode.gatheringvouchPaydetail.length > 0) {
          data.retailVouchGatheringPays = cardPaymode.gatheringvouchPaydetail;
          if (type == 'string')
            args.middle.code = JSON.stringify(data);
          else
            args.middle.code = data;
        }
        if (!cb.utils.isEmpty(data.id)) { //非离线模式下才进行网络打印相关的逻辑
          //网络打印获取打印设置并打印
          var goNetworkPrint = function (isCheckstand, isKitchen) {
            let billID = null;
            if (!cb.utils.isEmpty(data.id)) billID = "" + data.id;
            let params = {//参数形式为字符串的id
              id: billID,
              isCheckstand: isCheckstand,
              isKitchen: isKitchen
            };
            let getNetworkPrint = cb.rest.DynamicProxy.create({
              settle: {
                url: '/bill/PrintNetwork',
                method: 'POST',
                options: { mask: false }
              }
            });
            getNetworkPrint.settle(params, function (err, result) {
              if (err) {
                cb.utils.alert(err.message, 'error');
                cb.utils.alert('获取网络打印设置失败！', 'error');
              }
              if (result != undefined) {
                for (let i = 0; i < result.length; i++) { //服务返回的数据中，有多少个网络打印机IP就调几次打印机
                  if (!cb.utils.isEmpty(result[i].printerIP)) {
                    let printerIP = result[i].printerIP;
                    let url = 'http://' + printerIP + ':3000/print_for_temp';
                    let params1 = { data: result[i] };
                    let proxy = cb.rest.DynamicProxy.create({
                      settle: {
                        url: url,
                        method: 'POST',
                        options: { timeout: 30000 }
                      }
                    });
                    proxy.settle(params1, function (err1, result1) {
                      if (err1) {
                        cb.utils.alert(err1.message, 'error');
                        cb.utils.alert('网络打印失败！', 'error');
                      }
                    })
                  }
                }

              }
            });
          }
          //打印前提示是否厨打--网络打印
          let isSupportKitchenPrint = cb.rest.AppContext.option.isSupportKitchenPrint;
          let industry = cb.rest.AppContext.user.industry;
          let networkCheckstandPrint = false; //是否启用网络收银打印标志
          if (cb.rest.AppContext.option._internetPrint) networkCheckstandPrint = cb.rest.AppContext.option._internetPrint;
          let kitchenPrintSelect = false;  //是否选择厨打判断标志
          let localPrint = false;   //本地打印机判断标志
          let flag_presell = "";  // 用来判断是否是预订单的一种标记
          if (data.billingStatus == 'Shipment') {
            flag_presell = "Shipment";
          }
          // if (20 == industry) {
          if (!cb.electron.getSharedObject()) { //获取本地打印机失败
            localPrint = false;
          } else if (cb.electron.getSharedObject().config.bReceiptPrinter) { //
            localPrint = true;
          }
          if (isSupportKitchenPrint && (data.billingStatus != 'PresellBack')) { //如果支持厨打的情况下,且不是退订状态
            let params = data;
            let printkitchens = cb.rest.DynamicProxy.create({
              settle: {
                url: '/bill/printkitchens',
                method: 'POST',
                options: { mask: false }
              }
            });
            printkitchens.settle(params, function (err, result) {
              if (err) {
                cb.utils.alert(err.message, 'error');
                cb.utils.alert('获取是否弹出厨打提示信息失败！', 'error');
              }
              if (result != undefined && (result.data.length > 0)) { //当前商品行在厨打行有对应的商品分类设置，给出是否进行厨打的弹窗
                if (data.iPresellState != 1 || (flag_presell == 'Shipment')) { //非预定单，预订变更也不提示
                  if (networkCheckstandPrint) { //如果启用了网络收银打，则调用网络打印机的收银和厨打
                    goNetworkPrint(true, true);
                  } else { //网络收银打未启用，只调用网络打印的厨打
                    goNetworkPrint(false, true);
                  }
                } else { //预定单据
                  let promise = new cb.promise();
                  cb.utils.confirm('是否需要厨打？', function () {
                    // 确认
                    if (networkCheckstandPrint) { //如果启用了网络收银打，则调用网络打印机的收银和厨打
                      goNetworkPrint(true, true);
                    } else { //网络收银打未启用，只调用网络打印的厨打
                      goNetworkPrint(false, true);
                    }

                    promise.resolve()
                  }, function () {  //不需要厨打，本地有打印机调本地，没打印机才掉网络打印机的收银打印
                    // 取消
                    if (networkCheckstandPrint) { //如果启用网络收银打印，调用网络打印机的收银打印
                      goNetworkPrint(true, false);
                    }
                    promise.resolve()
                  })
                }
              } else { //商品没有厨打设置的分类，只需判断现在是否调用网络收银打
                if (networkCheckstandPrint) { //如果启用网络收银打印，调用网络打印机的收银打印
                  goNetworkPrint(true, false);
                }
              }
            });

          } else { //如果支持厨打参数为否，如果本地有设置则走本地打，没有则网络打印
            if (networkCheckstandPrint) { //如果启用网络收银打印，调用网络打印机的收银打印
              goNetworkPrint(true, false);
            }
          }

          // }//if--industry
        }//非离线状态
      })

      /* 取储值卡的打印模版： 字符串格式 */
      viewmodel.on('beforeLocalprint', function (args) {
        /* 此事件逻辑代码走完，保证都调用了callback方法 */
        let { callback } = args;

        if (viewmodel.getParams().bStorageCardRecharge || localStorage.getItem("billing_lastIsCardRecharge").toString() === 'true') {   // 如果是储值状态
          var proxy = cb.rest.DynamicProxy.create({
            ensure: {
              url: '/print/getTemplateContent',
              method: 'POST'
            }
          });
          var params = {
            billno: 'rm_retailvouch',
            templateCode: cb.rest.AppContext.option.storageDefaultTemplate
          }
          proxy.ensure(params, function (err, result) {
            if (err) {
              callback();
              cb.utils.alert('获取储值打印模板失败', 'error');
              return false;
            }
            if (!result) {
              callback();
              cb.utils.alert('获取储值打印模板失败', 'error');
              return false;
            }
            callback(JSON.stringify(result));
          })

        } else {
          callback()
        }
      })

      /* 云打印前 */
      viewmodel.on('beforeCloudPrit', function (args) {
        if (viewmodel.getParams().bStorageCardRecharge) {
          if (cb.rest.AppContext.option.storageDefaultTemplate) {
            args.params.template = cb.rest.AppContext.option.storageDefaultTemplate;
            return true;
          }
        }
        return true;
      })

      viewmodel.get('bReturnStore_1') && viewmodel.get('bReturnStore_1').on('afterValueChange', function (data) {
        var bReturnStore_1 = viewmodel.get("bReturnStore_1").getValue();
        if (!data.value) return;
        if (bReturnStore_1 == 'true') {
          viewmodel.get("iReturnWarehousid_1_name").setValue(null);
          viewmodel.get("iReturnWarehousid_1_name").setReadOnly(true);
        } else {
          viewmodel.get("iReturnWarehousid_1_name").setReadOnly(false);
        }
      })

      /*改行确定前事件*/
      viewmodel.on('beforeUpdateRow', function (args) {
        let { formatMoney } = viewmodel.billingFunc;
        let ERPsysaddress = cb.rest.AppContext.option.ERPsysaddress;
        let originBillHeader = viewmodel.getBillingContext('originBillHeader')()
        let bAmountAdjustment = originBillHeader ? originBillHeader.bAmountAdjustment : false;
        let row = args.row;
        let rowData = this.get('retailVouchDetails').getEditRowModel().getAllData();

        //修改母件时候将子件同步修改
        if (row.ikitType == 1) {
          let focusedRow = viewmodel.getBillingContext('focusedRow')()
          let products = viewmodel.getBillingContext('products')()
          let productsNew = [];
          let index=0;
          let productChild;
          let discountSum=0.00;
          let discountTotal=0.00;

          let fMoneySum=0.00;
          let fMoneyTotal=0.00;

          let fPromotionDiscountSum=0.00;
          let fPromotionDiscountTotal=0.00;

          let rate = row["fQuantity"] / focusedRow["fQuantity"];
          let pricerate=row["fPrice"] / focusedRow["fPrice"];
          rate=rate * pricerate;
          let quantityrate = row["fQuantity"] / focusedRow["fQuantity"];
          for (let i = 0; i < products.length; i++) {

            //原单退货行上的Key  kitproduct变了
            if(products[i]["parentkey"])
            {
            if (products[i]["parentkey"] == row.originalkey) {
              discountTotal=discountTotal+ products[i]["foldDiscount"] ;
              fMoneyTotal=fMoneyTotal+products[i]["fMoney"];
              fPromotionDiscountTotal=fPromotionDiscountTotal+products[i]["fPromotionDiscount"];

              products[i]["fQuantity"] = quantityrate * products[i]["fQuantity"];
              products[i]["fMoney"] = formatMoney(products[i]["fMoney"] * rate);
              products[i]["fQuoteMoney"] = formatMoney(products[i]["fQuoteMoney"] * rate);
              products[i]["fDiscount"] = formatMoney(products[i]["fDiscount"] * rate);
              products[i]["fSceneDiscount"] =formatMoney( products[i]["fSceneDiscount"] * rate);
              products[i]["fVIPDiscount"] =formatMoney( products[i]["fVIPDiscount"] * rate);
              products[i]["fPromotionDiscount"] = formatMoney(products[i]["fPromotionDiscount"] * rate);
              products[i]["foldDiscount"] = formatMoney(products[i]["foldDiscount"] * rate);

              products[i]["iBackid"] = row.iBackid;
              products[i]["iBackid_reason"] = row.iBackid_reason;

              let b=products[i]["foldDiscount"];
              discountSum=discountSum+b;

              fMoneySum=fMoneySum+products[i]["fMoney"];
              fPromotionDiscountSum=fPromotionDiscountSum+products[i]["fPromotionDiscount"];
              index=productsNew.length;

            }
          }
            productsNew.push(products[i]);
          }

          discountTotal=discountTotal*rate;

          if(discountSum!=discountTotal)
          {
            let result=discountTotal-discountSum;
            productsNew[index]["foldDiscount"]=productsNew[index]["foldDiscount"]+result;
          }

          fMoneyTotal=fMoneyTotal*rate;

          if(fMoneySum!=fMoneyTotal)
          {
                let result=fMoneyTotal-fMoneySum;
                productsNew[index]["fMoney"]=productsNew[index]["fMoney"]+result;
          }

          fPromotionDiscountTotal=fPromotionDiscountTotal*rate;

          if(fPromotionDiscountSum!=fPromotionDiscountTotal)
          {
                let result=fPromotionDiscountTotal-fPromotionDiscountSum;
                productsNew[index]["fPromotionDiscount"]=productsNew[index]["fPromotionDiscount"]+result;
          }

          if (productsNew.length > 0) {
            viewmodel.billingFunc.updateProducts(productsNew);

          }
        }

        //改行确定时 卡券号/卡券号范围赋值
        if (row.cCouponId) {
          let cardList = [];
          let rowSNData = viewmodel.get('retailVouchCouponSN').getEditRowModel().getAllData();
          if(!cb.utils.isEmpty(rowSNData.beginCouponsn)){
            try {
              cardList = getCardList(rowSNData.beginCouponsn, rowSNData.endCouponsn);
            } catch (e) {
              cb.utils.alert(e.message, 'error');
              return false;
            }
          }

          if(!cb.utils.isEmpty(rowSNData.cCouponsn)){
            row["cCouponsn"] = rowSNData.cCouponsn;
            row["retailVouchCouponSN!cGiftTokensn"] = rowSNData.cCouponsn;
            let quantity = row.fQuantity;//原数量
            if(viewmodel.getParams().bCardCoupon){
              row.fQuantity = 1;//卡券号数量
            }else{
              row.fQuantity = -1;//卡券号数量 退货
            }
            row.fQuoteMoney = viewmodel.billingFunc.formatMoney(row.fQuotePrice * row.fQuantity); //零售金额
            row.fMoney = viewmodel.billingFunc.formatMoney(row.fPrice * row.fQuantity); //实销金额

            if(row.fDiscount){
              let discount = viewmodel.billingFunc.formatMoney(row.fDiscount / quantity); //单个折扣额
              row.fDiscount = viewmodel.billingFunc.formatMoney(discount * row.fQuantity);  //折扣额
            }
            if(row.fVIPDiscount){
              let vipdiscount = viewmodel.billingFunc.formatMoney(row.fVIPDiscount / quantity); //单个会员折扣额
              row.fVIPDiscount = viewmodel.billingFunc.formatMoney(vipdiscount * row.fQuantity);  //会员折扣额
            }
            if(row.fPromotionDiscount){
              let prodiscount = viewmodel.billingFunc.formatMoney(row.fPromotionDiscount / quantity); //单个促销折扣额
              row.fPromotionDiscount = viewmodel.billingFunc.formatMoney(prodiscount * row.fQuantity);  //促销折扣额
            }
            if(row.fCoDiscount){
              let codiscount = viewmodel.billingFunc.formatMoney(row.fCoDiscount / quantity); //单个退货折扣额
              row.fCoDiscount = viewmodel.billingFunc.formatMoney(codiscount * row.fQuantity);  //退货折扣额
            }
            if(row.foldDiscount){
              let folddisc = viewmodel.billingFunc.formatMoney(row.foldDiscount / quantity); //单个原单退货折扣额
              row.foldDiscount = viewmodel.billingFunc.formatMoney(folddisc * row.fQuantity);  //原单退货折扣额
            }
          }
          if(!cb.utils.isEmpty(rowSNData.beginCouponsn)){
            row["beginCouponsn"] = rowSNData.beginCouponsn;
            row["endCouponsn"] = rowSNData.endCouponsn;
            row["retailVouchCouponSN"] = cardList.map(item => { return { cGiftTokensn: item } });
            let quantity = row.fQuantity;//原数量
            if(viewmodel.getParams().bCardCoupon){
              row.fQuantity = cardList.length;//卡券号数量
            }else{
              row.fQuantity = -1 * cardList.length;//卡券号数量 退货
            }
            row.fQuoteMoney = viewmodel.billingFunc.formatMoney(row.fQuotePrice * row.fQuantity); //零售金额
            row.fMoney = viewmodel.billingFunc.formatMoney(row.fPrice * row.fQuantity); //实销金额

            if(row.fDiscount){
              let discount = viewmodel.billingFunc.formatMoney(row.fDiscount / quantity); //单个折扣额
              row.fDiscount = viewmodel.billingFunc.formatMoney(discount * row.fQuantity);  //折扣额
            }
            if(row.fVIPDiscount){
              let vipdiscount = viewmodel.billingFunc.formatMoney(row.fVIPDiscount / quantity); //单个会员折扣额
              row.fVIPDiscount = viewmodel.billingFunc.formatMoney(vipdiscount * row.fQuantity);  //会员折扣额
            }
            if(row.fPromotionDiscount){
              let prodiscount = viewmodel.billingFunc.formatMoney(row.fPromotionDiscount / quantity); //单个促销折扣额
              row.fPromotionDiscount = viewmodel.billingFunc.formatMoney(prodiscount * row.fQuantity);  //促销折扣额
            }
            if(row.fCoDiscount){
              let codiscount = viewmodel.billingFunc.formatMoney(row.fCoDiscount / quantity); //单个退货折扣额
              row.fCoDiscount = viewmodel.billingFunc.formatMoney(codiscount * row.fQuantity);  //退货折扣额
            }
            if(row.foldDiscount){
              let folddisc = viewmodel.billingFunc.formatMoney(row.foldDiscount / quantity); //单个原单退货折扣额
              row.foldDiscount = viewmodel.billingFunc.formatMoney(folddisc * row.fQuantity);  //原单退货折扣额
            }
          }
          viewmodel.billingFunc.updateFocusedRow(row);
        }

        //改行确定时 卡券退货金额赋值
        if ((viewmodel.getParams().bCardCouponBack || viewmodel.getParams().bCardCouponOriginBack) && row.cCouponId) {
          let proxy = cb.rest.DynamicProxy.create({
            query: {
              url: '/bill/queryPriceOfCoupon',
              method: 'POST'
            }
          });
          let cCouponsn = row.cCouponsn?row.cCouponsn:row.beginCouponsn;
          let parms = {
            cCouponsn: cCouponsn,
            cCouponId:row.cCouponId,
            couponType:row.couponType
          };
          let promise = new cb.promise();
          proxy.query(parms, (err, result) => {
            if (err) {
              cb.utils.alert(err.message, 'error');
              promise.reject();
              return false;
            }
            if (result) {
              row.fPrice = result;//实销价 单价
              row.foldPrice = result;//原销售价 单价
              row.fMoney = -1*row.fPrice//实销金额 金额
              row.fDiscount = row.fPrice - row.fQuotePrice//折扣额
              row.fDiscountRate = 100*row.fPrice/row.fQuotePrice//折扣率
              row.fCoDiscount = row.fPrice - row.foldPrice//退货折扣额
              viewmodel.billingFunc.updateFocusedRow(row);
              promise.resolve();
            } else {
              cb.utils.alert('未查询到该计次卡可退金额信息', 'error');
              promise.reject();
              return false;
            }
          });
          return promise;
        }

        //改行录入储值卡号
        if (viewmodel.get('retailVouchCouponSN')) {
          let cCouponsn = viewmodel.get('retailVouchCouponSN').getEditRowModel().get('cCouponsn');
          let beginCouponsn = viewmodel.get('retailVouchCouponSN').getEditRowModel().get('beginCouponsn');
          let endCouponsn = viewmodel.get('retailVouchCouponSN').getEditRowModel().get('endCouponsn');
          let isGiftCard = row.iPromotionProduct === 1 && row.productrealProductAttributeType === 3;    // 赠品
          let isPromotionCard = !isGiftCard && row.promotionwrite != null && row.productrealProductAttributeType === 3; // 商品促销
          if (viewmodel.getParams().bStorageCardSale || viewmodel.getParams().bStorageCardBackBill || isGiftCard || isPromotionCard) {
            let rowSNData = viewmodel.get('retailVouchCouponSN').getEditRowModel().getAllData();  // 改行里面的值
            let products = viewmodel.getBillingContext('products')();
            let cardNum = rowSNData.cCouponsn;  // 改行里面的卡券号
            let beginCard = rowSNData.beginCouponsn;  //改行里面的卡券开始
            let endCard = rowSNData.endCouponsn;  //改行里面的卡券结束

            if (!cardNum){  // 校验卡券号是否输入
              if(!beginCard && !endCard){
                cb.utils.alert('请录入卡券号', 'error');
                return false;
              } else if((beginCard && !endCard) || (!beginCard && endCard)){
                cb.utils.alert('开始卡券号和结束卡券号必须同时录入', 'error');
                return false;
              }
            }

            // 已经执行优惠, 不能修改卡券号和卡券号范围
            if (cardNum || (beginCard && endCard)) {
              let hasDonePromotion = row.fSceneDiscount || row.fPromotionDiscount || row.fGiftTokenDiscount || row.fPointPayDiscount || row.fCouponPayApportion;
              let isChangeCouponsnChange = cardNum && cardNum != row.cStorageCardNum;
              let isChangeCouponRangeChange = beginCard && endCard && (beginCard != row.beginCouponsn || endCard != row.endCouponsn);
              if (hasDonePromotion && (isChangeCouponsnChange || isChangeCouponRangeChange)) {
                cb.utils.alert('已执行过优惠活动,不允许修改卡券号和卡券号范围', 'error');
                return false;
              }
            }

            if(cardNum) { // 输入卡券号
              // 校验卡券号是否已经录入
              let existProduct = products && products.find(p => p.cStorageCardNum == cardNum);
              let focusedRow = viewmodel.getBillingContext('focusedRow')();
              if (existProduct && focusedRow.cStorageCardNum != cardNum) {
                cb.utils.alert('该卡号已经录入', 'error');
                return false;
              } else {
                let cardProxy = cb.rest.DynamicProxy.create({
                  query: {
                    url: 'mall/bill/ref/getProducts.do',
                    method: 'POST'
                  }
                })
                let isNegative = false; // 退货商品标记
                if (viewmodel.getParams().bStorageCardBackBill) {
                  let backBill_checked = viewmodel.getBillingContext('backBill_checked', 'product')();
                  backBill_checked ? isNegative = true : isNegative = false;
                }
                let cardParams = {
                  keyword: cardNum,
                  billDate: (new Date()).format('yyyy-MM-dd hh:mm:ss'),
                  scanRange: ['StorageCard'],
                  giftProductIds: null,
                  isNegative: isNegative,
                  isReturn: 0,
                  showType: "N"
                }
                let promise = new cb.promise();
                cardProxy.query(cardParams, (err, result) => {
                  if (err) {
                    cb.utils.alert(err.message ? err.message : err);
                    promise.reject();
                    return false;
                  }
                  let returndata = null;
                  if (result && result.data && result.data.recordList && result.data.recordList[0]) {
                    returndata = result.data.recordList[0];
                  } else {
                    cb.utils.alert('未找到该储值卡号对应实体卡', 'error');
                    promise.reject();
                    return false;
                  }
                  if (returndata.product != row.product) {
                    cb.utils.alert('改行前后商品不相同', 'error');
                    promise.reject();
                    return false;
                  }
                  if (returndata.cardNum === undefined || returndata.cardNum === null) {
                    cb.utils.alert('未找到该储值卡号对应实体卡', 'error');
                    promise.reject();
                    return false;
                  }
                  let skuSalePrice = 0;
                  if (returndata.productskus && returndata.productskus[0]) {
                    skuSalePrice = returndata.productskus[0].skuSalePrice;
                  } else {
                    cb.utils.alert('未取到该储值卡号对应实体卡的初始价格', 'error');
                    promise.reject();
                    return false;
                  }

                  row.cStorageCardNum = returndata.cardNum;
                  if (isNegative) { // 储值卡退卡:售卡时可以使用现场折扣, 储值卡退卡根据余额和折扣额计算出实际应退的金额
                    let initial_balance = returndata.productskus[0].initial_balance;
                    let storage_balance = returndata.productskus[0].storage_balance ? returndata.productskus[0].storage_balance : returndata.productskus[0].initial_balance;
                    let storage_disaccount = returndata.productskus[0].storage_disaccount ? returndata.productskus[0].storage_disaccount : 0;
                    skuSalePrice = viewmodel.billingFunc.formatMoney(storage_balance - storage_disaccount);
                    if (returndata.productskus && returndata.productskus.length == 1) {
                      row.fQuotePrice = initial_balance;  //零售价
                      row.fQuoteMoney = viewmodel.billingFunc.formatMoney(initial_balance * row.fQuantity); //零售金额
                      row.fPrice = skuSalePrice; //实销价 单价
                      row.fMoney = viewmodel.billingFunc.formatMoney(skuSalePrice * row.fQuantity); //实销金额 金额
                      row.foldPrice = initial_balance; //原销售价
                      row.fDiscount = viewmodel.billingFunc.formatMoney(storage_disaccount * row.fQuantity);  //折扣额
                      row.fDiscountRate = Number(cb.utils.getRoundValue((storage_balance - storage_disaccount) * 100 / storage_balance, 2));  //折扣率
                      row.fCoDiscount = viewmodel.billingFunc.formatMoney(storage_disaccount * row.fQuantity);  //退货折扣额
                    }
                  } else {  // 储值卡售卡
                    if (isGiftCard) {
                      row.fQuotePrice = skuSalePrice;
                      row.fQuoteMoney = skuSalePrice;
                      row.fDiscount = viewmodel.billingFunc.formatMoney(skuSalePrice - row.fMoney);
                      row.fDiscountRate = cb.utils.getRoundValue(row.fPrice * 100 / row.fQuotePrice, 2);
                      row.fPromotionDiscount = viewmodel.billingFunc.formatMoney(skuSalePrice - row.fMoney);
                      row.fPromotionDiscount_origin = viewmodel.billingFunc.formatMoney(skuSalePrice - row.fMoney);
                      if (row.promotionwrite && row.promotionwrite.length == 1) {
                        row.promotionwrite[0].fAmount = row.fDiscount;
                      }
                    } else if (isPromotionCard) {
                      row.fQuotePrice = skuSalePrice;
                      row.fQuoteMoney = skuSalePrice;
                      row.fDiscount = viewmodel.billingFunc.formatMoney(skuSalePrice - row.fMoney);
                      row.fDiscountRate = cb.utils.getRoundValue(row.fPrice * 100 / row.fQuotePrice, 2);
                      row.fPromotionDiscount = viewmodel.billingFunc.formatMoney(skuSalePrice - row.fMoney);
                      row.fPromotionDiscount_origin = viewmodel.billingFunc.formatMoney(skuSalePrice - row.fMoney);
                      if (row.promotionwrite && row.promotionwrite.length == 1) {
                        row.promotionwrite[0].fAmount = row.fDiscount;
                      }
                    } else {
                      row.fPrice = skuSalePrice;
                      row.fMoney = skuSalePrice * row.fQuantity;
                      row.fQuotePrice = skuSalePrice;
                      row.fQuoteMoney = skuSalePrice * row.fQuantity;
                    }
                  }
                  viewmodel.billingFunc.updateFocusedRow(row);
                  promise.resolve();
                })
                if (isGiftCard) {
                  stopReadCard();
                } else {
                  if (viewmodel.getParams().cardSaleParams) {
                    viewmodel.getParams().cardSaleParams.isEditRow = false;
                  }
                }
                return promise;
              }
            } else if(beginCard && endCard) { // 输入卡券范围
              let cardList = [];
              try {
                cardList = getCardList(beginCard, endCard); // 获取卡号范围
              } catch (e) {
                cb.utils.alert(e.message, 'error');
                return false;
              }
              let existCardList = []; // 已录入卡号列表
              products.forEach(item => {
                if(item.key === row.key){ // 不判断正在改的行
                  return;
                }
                if(item.cStorageCardNum){
                  existCardList.push(item.cStorageCardNum);
                } else if(item.retailVouchCouponSN){
                  item.retailVouchCouponSN.forEach(item1 => {
                    existCardList.push(item1.cGiftTokensn);
                  })
                }
              })
              let existCard = null;
              for(let i = 0; i < existCardList.length ; i++){
                for(let j = 0; j < cardList.length; j++){
                  if(existCardList[i] == cardList[j]){
                    existCard = existCardList[i];
                    break;
                  }
                }
              }
              if(existCard){
                cb.utils.alert(`卡号范围内${existCard}已录入`, 'error');
                return false;
              } else {
                let cardProxy = cb.rest.DynamicProxy.create({
                  query: {
                    url: '/storedValueCard/checkstoredcards',
                    method: 'POST'
                  }
                })
                let isNegative = false;
                if (viewmodel.getParams().bStorageCardBackBill) {
                  let backBill_checked = viewmodel.getBillingContext('backBill_checked', 'product')();
                  backBill_checked ? isNegative = true : isNegative = false;
                }
                let promise = new cb.promise();
                let cardParams = {
                  product: row.product,
                  cardnum: cardList.join(','),
                  isNegative: isNegative
                };
                cardProxy.query(cardParams, (err, result) => {
                  if (err) {
                    cb.utils.alert(err.message ? err.message : err);
                    promise.reject();
                    return false;
                  }
                  let { data, errormessage } = result;
                  if (errormessage && errormessage.length > 0) {
                    let info = '';
                    for (let i = 0; i < errormessage.length; i++) {
                      if (errormessage[i].cards && errormessage[i].cards.length > 0) {
                        if (i < 9) {
                          info = info + errormessage[i].errMessage + ':' + errormessage[i].cards.join(',') + ";";
                        } else {
                          info = info + errormessage[i].errMessage + ";";
                        }
                      }
                    }
                    if (info) {
                      cb.utils.alert(info, 'error');
                      promise.reject();
                      return false;
                    }
                  }

                  let returndata = null;
                  if (data && data[0]) {
                    returndata = data[0];
                  } else {
                    cb.utils.alert('未找到该储值卡号对应实体卡', 'error');
                    promise.reject();
                    return false;
                  }
                  if (returndata.goods_id != row.product) {
                    cb.utils.alert('改行前后商品不相同', 'error');
                    promise.reject();
                    return false;
                  }
                  // if (returndata.cardNum === undefined || returndata.cardNum === null) {
                  //   cb.utils.alert('未找到该储值卡号对应实体卡', 'error');
                  //   promise.reject();
                  //   return false;
                  // }
                  let skuSalePrice = 0;
                  if (returndata.initial_balance !== null) {
                    skuSalePrice = viewmodel.billingFunc.formatNum('price', returndata.initial_balance);
                  } else {
                    cb.utils.alert('未取到该储值卡号对应实体卡的初始价格', 'error');
                    promise.reject();
                    return false;
                  }

                  // row.cStorageCardNum = returndata.cardNum;
                  row.retailVouchCouponSN = cardList.map(item => { return { cGiftTokensn: item } }); // 添加卡券号孙表
                  row.beginCouponsn = beginCard;
                  row.endCouponsn = endCard;
                  if (isNegative) { // 储值卡售卡可以使用现场折扣, 储值卡退卡根据售卡时的余额和折扣额计算出实际应退的金额
                    let initial_balance = returndata.initial_balance;
                    let storage_balance = returndata.storage_balance ? returndata.storage_balance : returndata.initial_balance;
                    let storage_disaccount = returndata.storage_disaccount ? returndata.storage_disaccount : 0;
                    skuSalePrice = viewmodel.billingFunc.formatMoney(storage_balance - storage_disaccount);
                    row.fQuantity = row.retailVouchCouponSN.length * -1;
                    row.fQuotePrice = initial_balance;  //零售价
                    row.fQuoteMoney = viewmodel.billingFunc.formatMoney(initial_balance * row.fQuantity); //零售金额
                    row.fPrice = skuSalePrice; //实销价 单价
                    row.fMoney = viewmodel.billingFunc.formatMoney(skuSalePrice * row.fQuantity); //实销金额 金额
                    row.foldPrice = initial_balance; //原销售价
                    row.fDiscount = viewmodel.billingFunc.formatMoney(storage_disaccount * row.fQuantity);  //折扣额
                    row.fDiscountRate = Number(cb.utils.getRoundValue((storage_balance - storage_disaccount) * 100 / storage_balance, 2));  //折扣率
                    row.fCoDiscount = viewmodel.billingFunc.formatMoney(storage_disaccount * row.fQuantity);  //退货折扣额
                  } else {
                    if (isGiftCard) {
                      row.fQuantity = row.retailVouchCouponSN.length;
                      row.fQuotePrice = skuSalePrice;
                      row.fQuoteMoney = viewmodel.billingFunc.formatMoney(skuSalePrice * row.fQuantity);
                      row.fMoney = viewmodel.billingFunc.formatMoney(row.fMoney * row.fQuantity);
                      row.fDiscount = viewmodel.billingFunc.formatMoney(skuSalePrice - row.fMoney);
                      row.fDiscountRate = cb.utils.getRoundValue(row.fPrice * 100 / row.fQuotePrice, 2);
                      row.fPromotionDiscount = viewmodel.billingFunc.formatMoney(row.fQuoteMoney - row.fMoney);
                      row.fPromotionDiscount_origin = viewmodel.billingFunc.formatMoney(row.fQuoteMoney - row.fMoney);
                      if (row.promotionwrite && row.promotionwrite.length == 1) {
                        row.promotionwrite[0].fAmount = row.fDiscount;
                      }
                    } else if (isPromotionCard) {
                      row.fQuantity = row.retailVouchCouponSN.length;
                      row.fQuotePrice = skuSalePrice;
                      row.fQuoteMoney = viewmodel.billingFunc.formatMoney(skuSalePrice * row.fQuantity);
                      row.fMoney = viewmodel.billingFunc.formatMoney(row.fMoney * row.fQuantity);
                      row.fDiscount = viewmodel.billingFunc.formatMoney(skuSalePrice - row.fMoney);
                      row.fDiscountRate = cb.utils.getRoundValue(row.fPrice * 100 / row.fQuotePrice, 2);
                      row.fPromotionDiscount = viewmodel.billingFunc.formatMoney(row.fQuoteMoney - row.fMoney);
                      row.fPromotionDiscount_origin = viewmodel.billingFunc.formatMoney(row.fQuoteMoney - row.fMoney);
                      if (row.promotionwrite && row.promotionwrite.length == 1) {
                        row.promotionwrite[0].fAmount = row.fDiscount;
                      }
                    } else {
                      row.fQuantity = row.retailVouchCouponSN.length;
                      row.fPrice = skuSalePrice;
                      row.fMoney = viewmodel.billingFunc.formatMoney(skuSalePrice * row.fQuantity);
                      row.fQuotePrice = skuSalePrice;
                      row.fQuoteMoney = viewmodel.billingFunc.formatMoney(skuSalePrice * row.fQuantity);
                    }
                  }
                  viewmodel.billingFunc.updateFocusedRow(row);
                  promise.resolve();
                })
                if (isGiftCard) {
                  stopReadCard();
                } else {
                  if (viewmodel.getParams().cardSaleParams) {
                    viewmodel.getParams().cardSaleParams.isEditRow = false;
                  }
                }
                return promise;
              }

            }
          }
        }

        if (bAmountAdjustment == true) {
          if (!cb.utils.isEmpty(rowData.fAdjustAmount_1)) {
            row.fAdjustAmount_1 = rowData.fAdjustAmount_1;
          } else {
            cb.utils.alert('本次调整金额不能为空！', 'error');
            return false;
          }
          if (!cb.utils.isEmpty(rowData.beforeAdjustDiscount))
            row.beforeAdjustDiscount = rowData.beforeAdjustDiscount;
          if (!cb.utils.isEmpty(rowData.beforeAdjustMoney))
            row.beforeAdjustMoney = rowData.beforeAdjustMoney;
          if (!cb.utils.isEmpty(rowData.afterAdjustDiscount))
            row.afterAdjustDiscount = rowData.afterAdjustDiscount;
          else {
            cb.utils.alert('调整后折扣不能为空！', 'error');
            return false;
          }
          if (!cb.utils.isEmpty(rowData.afterAdjustMoney)) {
            row.afterAdjustMoney = rowData.afterAdjustMoney;
            if (row.afterAdjustMoney < 0) {
              cb.utils.alert('调整后金额不能小于0！', 'error');
              return false;
            }
          } else {
            cb.utils.alert('调整后金额不能为空！', 'error');
            return false;
          }
          if (!cb.utils.isEmpty(rowData.cMemo_1))
            row.cMemo_1 = rowData.cMemo_1;
          let fAdjustAmount = 1 * rowData.fAdjustAmount_1;
          if (fAdjustAmount == 0) {
            cb.utils.alert('本次调整金额不能为0！', 'error');
            return false;
          } else if (fAdjustAmount > 0) {
            if (ERPsysaddress == 4) { //如果是ERP系统是渠道云，本次调整金额必须必须小于0
              cb.utils.alert('本次调整金额不能大于0！', 'error');
              return false;
            }
          }
          row.cMemo = row.cMemo_1;
          row.fMoney = row.fAdjustAmount_1;
          viewmodel.billingFunc.updateFocusedRow(row);
          return true
        }
        // viewmodel.billingFunc.updateFocusedRow(row);
        // return false
        //ktv行业表体行时间相关字段校验
        if (cb.rest.AppContext.user.industry == 20 && (row['product_productProps!define1']) && (row['product_productProps!define1'].includes('房费'))) { //房费商品处理时间相关字段
          let timePeriod = time_period;
          let beginTimeModel = editRowModel.get('retailVouchDetailCustom!define1');
          let endTimeModel = editRowModel.get('retailVouchDetailCustom!define2');
          let timeLengthModel = editRowModel.get('retailVouchDetailCustom!define3');
          let nowDate = new Date();
          let beginTime = "";
          let endTime = "";
          let timeLength = "";
          let starttime = "";//时段开始时间
          let endtime = "";   //时段结束时间
          let iExtend = false; //是否跨日
          let peridName = ""; //时段名称
          let active = 0;  //时段时长（分钟）
          if (!cb.utils.isEmpty(row.free1)) { //获取当前时段的数据
            for (let i = 0; i < timePeriod.length; i++) {
              if (row.free1 == timePeriod[i].name) {
                iExtend = timePeriod[i].iExtend;
                starttime = timePeriod[i].starttime;
                endtime = timePeriod[i].endtime;
                active = timePeriod[i].active;
              }
            }
          }
          nowDate = nowDate.format('yyyy-MM-dd');
          if (beginTimeModel) {
            beginTime = beginTimeModel.getValue();
            if (row['product_productProps!define1'].includes('房费') && (cb.utils.isEmpty(beginTime))) { //计时房费
              cb.utils.alert('房费商品开始时间不能为空！', 'error');
              return false;
            }
            // if (beginTime) {
            //   let beginDate = new Date(beginTime);
            //   beginDate = beginDate.format('yyyy-MM-dd');
            //   if (beginDate < nowDate) {
            //     cb.utils.alert('房费商品开始时间不能早于今天！', 'error');
            //     return false;
            //   }
            // }
          }
          if (endTimeModel) {
            endTime = endTimeModel.getValue();
            if (row['product_productProps!define1'].includes('房费') && (cb.utils.isEmpty(endTime))) { //计时房费
              cb.utils.alert('房费商品结束时间不能为空！', 'error');
              return false;
            }
            if (endTime < beginTime) {
              cb.utils.alert('结束时间应大于开始时间！', 'error');
              return false;
            }
            let beginArr = beginTime.split(' '); //拆分开始时间
            let endArr = endTime.split(' ');  //拆分结束时间
            if(cb.utils.isIos()){
              beginArr[0] = beginArr[0].replace(/-/g, "/");
              endArr[0] = endArr[0].replace(/-/g, "/");
            }
            let beginDate = new Date(beginArr[0] + " " + "00:00:00");
            let endDate = new Date(endArr[0] + " " + "00:00:00");
            timeLength = timeLengthModel.getValue();
            if (iExtend) { //跨日时段
              let alertTime = starttime + "--次日" + endtime;
              if ((endDate.getTime() - beginDate.getTime()) > (24 * 60 * 60 * 1000)) {
                cb.utils.alert('时间区间最多允许跨一天！请重新选择时间!', 'error')
                return false;
              }
              if (endDate.getTime() != beginDate.getTime()) { //所选时段有跨日
                if (beginArr[1] < starttime) { //可能 1是当天时间小于开始时间 2是选择的次日时间小于结束时间（且此时开始和结束日期应为同一天）
                  cb.utils.alert("当前时段区间为：" + alertTime + ",请重新选择时间！", 'error');
                  return false;
                } else { //开始时段设置正确，结束时间不允许超出时段范围
                  if (timeLength > active) {
                    cb.utils.alert("当前时段区间为：" + alertTime + ",请重新选择时间！", 'error');
                    return false;
                  }
                }
              } else { //所选时段无跨日(1前一天 2后一天)
                let alertExtend = true;
                if((beginArr[1]>= starttime) && (endArr[1] <= "23:59:59")){
                  alertExtend = false;
                }else if((endArr[1].substr(0,5) <= endtime.substr(0,5)) && (beginArr[1] >= "00:00:00")){
                  alertExtend = false;
                }
                if (alertExtend) {
                  cb.utils.alert("当前时段区间为：" + alertTime + ",请重新选择时间！", 'error');
                  return false;
                }
              }
            } else { //非跨日时段
              let alertTime = starttime + "--" + endtime;
              if (endDate.getTime() != beginDate.getTime()) {
                cb.utils.alert("当前时段不允许跨日！请重新选择时间！", 'error')
                return false;
              }
              if (beginArr[1].substr(0,5) < starttime.substr(0,5) || (endArr[1].substr(0,5) > endtime.substr(0,5))) {
                cb.utils.alert("当前时段区间为：" + alertTime + ",请重新选择时间！", 'error');
                return false;
              }
            }
          }
          if (timeLengthModel) {
            timeLength = timeLengthModel.getValue();
            if (row['product_productProps!define1'].includes('房费') && (cb.utils.isEmpty(timeLength))) { //计时房费
              cb.utils.alert('房费商品时长不能为空！', 'error');
              return false;
            }
          }
          let isNotDiscount = true;  //用来判断是否执行过优惠活动，若执行过优惠活动则改时间时不影响数量
          if(row.fDiscount != 0)  isNotDiscount = false;
          if (beginTime && endTimeModel && timeLength && (row['product_productProps!define1'] == '计时房费') && (row.ikitType != 2) && isNotDiscount) { //房费房费商品为子件商品时,没有执行过优惠时,不影响数量
            let quantitydecimal = cb.rest.AppContext.option.quantitydecimal;
            let quantity = timeLength / 60;
            quantity = 1 * quantity.toFixed(quantitydecimal);
            // if (quantity < 1) quantity = 1;
            let promise = new cb.promise();
            if (quantity < 1) {
              cb.utils.confirm('房费商品数量小于1小时，是否按1小时收费？', function () {
                // 确认,继续结算操作,房费按1小时算
                quantity = 1;
                viewmodel.billingFunc.modifyQuantity(row, quantity);//回写表体行数量
                promise.resolve()
              }, function () {  //否，继续结算，房费按实际分钟/60算
                // 取消，取实际的数量
                viewmodel.billingFunc.modifyQuantity(row, quantity);//回写表体行数量
                promise.resolve()
              })
              return promise;
            }else{
              viewmodel.billingFunc.modifyQuantity(row, quantity);//回写表体行数量
            }
          }

        }

      });

      /*改行初始事件*/
      viewmodel.on('afterInitEditRowData', function (args) {
        if (args.params.activeKey == 'backInfo') {
          //退货时候子件不允许修改退货信息
          let billingStatus = viewmodel.getBillingContext('billingStatus')();
          if (billingStatus === 'FormerBackBill') {
            let row = viewmodel.getBillingContext('focusedRow')();
            if (row.ikitType == 2) {
              args.params.activeKey = 'editRow';
              args.params.showBackInfo = false;
            }
            else {
              args.params.activeKey = 'backInfo';
              args.params.showBackInfo = true;
            }
          }

        }
      });

      var fAdjustAmountModel = editRowModel.get('fAdjustAmount_1');
      var afterAdjustDiscountModel = editRowModel.get('afterAdjustDiscount');
      var afterAdjustMoneyModel = editRowModel.get('afterAdjustMoney');
      /*改行弹出事件*/
      viewmodel.on('onOpenEditRow', function (args) {
        let { formatMoney } = viewmodel.billingFunc;
        let originBillHeader = viewmodel.getBillingContext('originBillHeader')()
        let bAmountAdjustment = originBillHeader ? originBillHeader.bAmountAdjustment : false;
        let row = args.row;
        if (bAmountAdjustment == true) {
          if (cb.utils.isEmpty(row.fAdjustAmount_1)) {
            let defaultAdjustAmount = 0;
            let ofMoney = 0;
            let ofAdjustAmount = 0;
            let ofQuoteMoney = 0;
            let beforeAdjustDiscount = 0;
            let afterAdjustDiscount = 0;
            if (row.fMoney != null && row.fMoney != undefined) {
              ofMoney = row.fMoney;
            }
            if (row.fAdjustAmount != null && row.fAdjustAmount != undefined) {
              ofAdjustAmount = row.fAdjustAmount;
            }
            if (row.fQuoteMoney != null && row.fQuoteMoney != undefined) {
              ofQuoteMoney = row.fQuoteMoney;
            }
            if (ofQuoteMoney != 0) {
              beforeAdjustDiscount = (ofMoney + ofAdjustAmount) / ofQuoteMoney * 100;
              afterAdjustDiscount = beforeAdjustDiscount;
            } else {
              cb.utils.alert("零售金额为0，计算折扣错误！", 'error');
              return false;
            }
            let beforeAdjustMoney = ofMoney + ofAdjustAmount;
            let afterAdjustMoney = beforeAdjustMoney;
            //首次弹出改行窗口，赋初始值
            defaultAdjustAmount = formatMoney(defaultAdjustAmount);
            beforeAdjustMoney = formatMoney(beforeAdjustMoney);
            afterAdjustMoney = formatMoney(afterAdjustMoney);
            afterAdjustDiscount = Math.round(afterAdjustDiscount * 100) / 100;
            beforeAdjustDiscount = Math.round(beforeAdjustDiscount * 100) / 100;
            editRowModel.get('fAdjustAmount_1').setValue(defaultAdjustAmount);
            editRowModel.get('beforeAdjustDiscount').setValue(beforeAdjustDiscount);
            editRowModel.get('beforeAdjustMoney').setValue(beforeAdjustMoney);
            editRowModel.get('afterAdjustDiscount').setValue(afterAdjustDiscount);
            editRowModel.get('afterAdjustMoney').setValue(afterAdjustMoney);
          }
          if (!cb.utils.isEmpty(row.fAdjustAmount_1) && fAdjustAmountModel)
            editRowModel.get('fAdjustAmount_1').setValue(row.fAdjustAmount_1);
          if (!cb.utils.isEmpty(row.beforeAdjustDiscount))
            editRowModel.get('beforeAdjustDiscount').setValue(row.beforeAdjustDiscount);
          if (!cb.utils.isEmpty(row.beforeAdjustMoney))
            editRowModel.get('beforeAdjustMoney').setValue(row.beforeAdjustMoney);
          if (!cb.utils.isEmpty(row.afterAdjustDiscount))
            editRowModel.get('afterAdjustDiscount').setValue(row.afterAdjustDiscount);
          if (!cb.utils.isEmpty(row.afterAdjustMoney))
            editRowModel.get('afterAdjustMoney').setValue(row.afterAdjustMoney);
          if (!cb.utils.isEmpty(row.cMemo_1))
            editRowModel.get('cMemo_1').setValue(row.cMemo_1);
        }
        let billingStatus = viewmodel.getBillingContext('billingStatus')();
        if (billingStatus === 'FormerBackBill') {
          let iTakeway = originBillHeader.iTakeway;
          if (cb.rest.AppContext.tenant.industry == 19 || iTakeway == 2) {
            var bReturnStore = originBillHeader.bReturnStore;
            let rowData = viewmodel.get('retailVouchDetails').getEditRowModel().getAllData();
            //原单退货的“原销售价”变更：等于（金额＋调整金额）÷数量
            rowData.foldPrice = (parseFloat(rowData.fMoney) + parseFloat(rowData.fAdjustAmount ? rowData.fAdjustAmount : 0)) / parseFloat(rowData.fQuantity);
            if (bReturnStore == 'true') {
              //本单“退回门店”为是时，表体批号、效期、序列号可修改
              editRowModel.get("cBatchno").setDisabled(false);
              editRowModel.get("invaliddate").setDisabled(false);
              editRowModel.get("cSerialNo").setDisabled(false);
            } else {
              rowData.iWarehouseid = originBillHeader.iReturnWarehousid;
              rowData.iWarehouseid_name = originBillHeader.iReturnWarehousid_name;
              editRowModel.get("iWarehouseid_name").setValue([{ name: originBillHeader.iReturnWarehousid_name, id: originBillHeader.iReturnWarehousid }]);
              editRowModel.get("cBatchno").setDisabled(true);
              editRowModel.get("invaliddate").setDisabled(true);
              editRowModel.get("cSerialNo").setDisabled(true);
            }
          }
        }

        //改行中添加柜组相关字段--haoyj
        if(viewmodel.get('retailVouchDetails').getEditRowModel().get('iCabinetgroup_name')){
          let iCabinetgroupModel = viewmodel.get('retailVouchDetails').getEditRowModel().get('iCabinetgroup_name');
          iCabinetgroupModel.setReadOnly(false);
          let condition = { "isExtend": true, simpleVOs: [] };
          let store = cb.rest.AppContext.user.storeId
          condition.simpleVOs.push({//只显示当前门店的相关数据
            field: 'store',
            op: 'eq',
            value1: store
          });
          iCabinetgroupModel.setFilter(condition);
        }
        if(viewmodel.get('retailVouchDetails').getEditRowModel().get('iCabinetgroupType_name')){
          let iCabinetgroupTypeModel = viewmodel.get('retailVouchDetails').getEditRowModel().get('iCabinetgroupType_name');
          iCabinetgroupTypeModel.setReadOnly(false);
        }

        //改行弹出前控制卡券号状态并赋值 sunhyu
        if (viewmodel.get('retailVouchCouponSN')) {
          let couponEditRowModel = viewmodel.get('retailVouchCouponSN').getEditRowModel().get("cCouponsn")
          let beginCouponEdit = viewmodel.get('retailVouchCouponSN').getEditRowModel().get("beginCouponsn")
          let endCouponEdit = viewmodel.get('retailVouchCouponSN').getEditRowModel().get("endCouponsn")
          couponEditRowModel.setReadOnly(false);
          couponEditRowModel.setDisabled(true);
          beginCouponEdit.setReadOnly(false);
          beginCouponEdit.setDisabled(true);
          endCouponEdit.setReadOnly(false);
          endCouponEdit.setDisabled(true);
          //卡券售卡
          if (viewmodel.getParams().bCardCoupon) {
            if (row.productrealProductAttributeType == 2) {
              checkSelectWayOfCoupon('cCouponsn',row,couponEditRowModel,beginCouponEdit,endCouponEdit);
            }
          }
          //卡券非原单退
          if (viewmodel.getParams().bCardCouponBack) {
            checkSelectWayOfCoupon('cCouponsn',row,couponEditRowModel,beginCouponEdit,endCouponEdit);
          }
          //卡券原单退
          if ((billingStatus == 'FormerBackBill' || viewmodel.getParams().bCardCouponOriginBack) && !cb.utils.isEmpty(row.cCouponId)) {
            checkSelectWayOfCoupon('cCouponsn',row,couponEditRowModel,beginCouponEdit,endCouponEdit);
          }
          //增品中含有卡券商品
          if (row.iPromotionProduct == 1 && !cb.utils.isEmpty(row.cCouponId)) {
            couponEditRowModel.setDisabled(false);
            couponEditRowModel.setValue(row.cCouponsn);
          }
        }

        //改行录入储值卡号
        if (viewmodel.get('retailVouchCouponSN') && viewmodel.get('retailVouchCouponSN').getEditRowModel().get("cCouponsn")) {
          if (viewmodel.getParams().cardSaleParams) {
            viewmodel.getParams().cardSaleParams.isEditRow = false;
          }
          let couponEditRowModel = viewmodel.get('retailVouchCouponSN').getEditRowModel().get("cCouponsn");
          let beginCouponEdit = viewmodel.get('retailVouchCouponSN').getEditRowModel().get("beginCouponsn");
          let endCouponEdit = viewmodel.get('retailVouchCouponSN').getEditRowModel().get("endCouponsn");
          // couponEditRowModel.setReadOnly(false);
          // couponEditRowModel.setDisabled(true);
          // beginCouponEdit.setReadOnly(false);
          // beginCouponEdit.setDisabled(true);
          // endCouponEdit.setReadOnly(false);
          // endCouponEdit.setDisabled(true);
          if (viewmodel.getParams().bStorageCardSale || viewmodel.getParams().bStorageCardBackBill) {
            checkSelectWayOfCoupon('cStorageCardNum',row,couponEditRowModel,beginCouponEdit,endCouponEdit);
            if (viewmodel.getParams().cardSaleParams) {
              viewmodel.getParams().cardSaleParams.isEditRow = true;
            }
          }
          //增品中含有储值卡实体卡商品
          if (row.iPromotionProduct == 1 && row.productrealProductAttributeType == 3) {
            checkSelectWayOfCoupon('cStorageCardNum',row,couponEditRowModel,beginCouponEdit,endCouponEdit);
            // 这里也扫码
            if (viewmodel.getParams().cardSaleParams) {  // 已经在读卡,
              viewmodel.getParams().cardSaleParams.isEditRow = true;
            } else {
              startReadCard(true);
            }
          }
        }
        return true;
      });
      /*调整-- 本次调整金额*/
      fAdjustAmountModel && fAdjustAmountModel.on('afterValueChange', function (args) {
        let { formatMoney } = viewmodel.billingFunc;
        let originBillHeader = viewmodel.getBillingContext('originBillHeader')()
        let bAmountAdjustment = originBillHeader ? originBillHeader.bAmountAdjustment : false;
        if (bAmountAdjustment == true) {
          let afterAdjustMoney = 1 * editRowModel.get('beforeAdjustMoney').getValue() + 1 * editRowModel.get('fAdjustAmount_1').getValue();
          let fQuoteMoney = 1 * editRowModel.get('fQuoteMoney').getValue();
          let afterAdjustDiscount = 0;
          if (fQuoteMoney != 0) {
            afterAdjustDiscount = afterAdjustMoney / fQuoteMoney * 100;
          } else {
            cb.utils.alert("零售金额为0，计算折扣错误！", 'error');
            return false;
          }
          afterAdjustMoney = formatMoney(afterAdjustMoney);
          afterAdjustDiscount = Math.round(afterAdjustDiscount * 100) / 100;
          editRowModel.get('afterAdjustMoney').setValue(afterAdjustMoney);
          editRowModel.get('afterAdjustDiscount').setValue(afterAdjustDiscount);
        }
      });
      //调整 -- 调整后折扣
      afterAdjustDiscountModel && afterAdjustDiscountModel.on('afterValueChange', function (args) {
        let { formatMoney } = viewmodel.billingFunc;
        let originBillHeader = viewmodel.getBillingContext('originBillHeader')()
        let bAmountAdjustment = originBillHeader ? originBillHeader.bAmountAdjustment : false;
        if (bAmountAdjustment == true) {
          let fQuoteMoney = 1 * editRowModel.get('fQuoteMoney').getValue();
          let afterAdjustMoney = fQuoteMoney * editRowModel.get('afterAdjustDiscount').getValue() / 100;
          let fAdjustAmount = afterAdjustMoney - 1 * editRowModel.get('beforeAdjustMoney').getValue();
          afterAdjustMoney = formatMoney(afterAdjustMoney);
          fAdjustAmount = formatMoney(fAdjustAmount);
          editRowModel.get('afterAdjustMoney').setValue(afterAdjustMoney);
          editRowModel.get('fAdjustAmount_1').setValue(fAdjustAmount);
        }
      });
      //调整 -- 调整后金额
      afterAdjustMoneyModel && afterAdjustMoneyModel.on('afterValueChange', function (args) {
        let { formatMoney } = viewmodel.billingFunc;
        let originBillHeader = viewmodel.getBillingContext('originBillHeader')()
        let bAmountAdjustment = originBillHeader ? originBillHeader.bAmountAdjustment : false;
        if (bAmountAdjustment == true) {
          let fQuoteMoney = 1 * editRowModel.get('fQuoteMoney').getValue();
          let afterAdjustDiscount = 0;
          if (fQuoteMoney != 0) {
            afterAdjustDiscount = editRowModel.get('afterAdjustMoney').getValue() / fQuoteMoney * 100;
          } else {
            cb.utils.alert("零售金额为0，计算折扣错误！", 'error');
            return false;
          }
          let fAdjustAmount = 1 * editRowModel.get('afterAdjustMoney').getValue() - 1 * editRowModel.get('beforeAdjustMoney').getValue();
          fAdjustAmount = formatMoney(fAdjustAmount);
          afterAdjustDiscount = Math.round(afterAdjustDiscount * 100) / 100;
          editRowModel.get('afterAdjustDiscount').setValue(afterAdjustDiscount);
          editRowModel.get('fAdjustAmount_1').setValue(fAdjustAmount);
        }
      });
      //改行中字段相关事件
      let ktvIndustry = cb.rest.AppContext.user.industry;
      let beginTimeModel = editRowModel.get('retailVouchDetailCustom!define1');
      let endTimeModel = editRowModel.get('retailVouchDetailCustom!define2');
      let timeLengthModel = editRowModel.get('retailVouchDetailCustom!define3');
      if (ktvIndustry == 20) {
        //开始时间
        beginTimeModel && beginTimeModel.on('afterValueChange', function (args) {
          let timePeriod = time_period;
          let endTime = endTimeModel.getValue();
          let beginTime = beginTimeModel.getValue();
          let timeLength = timeLengthModel.getValue();
          let focusedRow = viewmodel.getBillingContext('focusedRow')();
          let iExtend = false;
          if (!cb.utils.isEmpty(focusedRow.free1)) { //获取当前时段的数据
            for (let i = 0; i < timePeriod.length; i++) {
              if (focusedRow.free1 == timePeriod[i].name) {
                iExtend = timePeriod[i].iExtend;
              }
            }
          }
          //开始时间变化后，应处理结束时间 = 开始时间 + 时长
          if (endTime && beginTime) { //开始时间/结束时间非空，处理时长
            if(cb.utils.isIos()){
              endTime = endTime.replace(/-/g, "/");
              beginTime = beginTime.replace(/-/g, "/");
            }
            let endTime_1 = new Date(endTime);
            let beginTime_1 = new Date(beginTime);
            let endTime_new = new Date(beginTime_1.getTime() + timeLength * 60 * 1000);
            endTime_new = endTime_new.format('yyyy-MM-dd hh:mm:ss');
            endTimeModel.setValue(endTime_new);

          }
        })
        //结束时间
        endTimeModel && endTimeModel.on('afterValueChange', function (args) {
          let timePeriod = time_period;
          let endTime = endTimeModel.getValue();
          let beginTime = beginTimeModel.getValue();
          let focusedRow = viewmodel.getBillingContext('focusedRow')();
          let iExtend = false;
          if (!cb.utils.isEmpty(focusedRow.free1)) { //获取当前时段的数据
            for (let i = 0; i < timePeriod.length; i++) {
              if (focusedRow.free1 == timePeriod[i].name) {
                iExtend = timePeriod[i].iExtend;
              }
            }
          }
          //结束时间修改后，修改时长 =  结束时间 -  开始时间
          if (endTime && beginTime) { //开始时间/结束时间非空，处理时长
            if(cb.utils.isIos()){
              endTime = endTime.replace(/-/g, "/");
              beginTime = beginTime.replace(/-/g, "/");
            }
            let endTime_1 = new Date(endTime);
            let beginTime_1 = new Date(beginTime)
            let endHou = endTime_1.getHours();
            let endMin = endTime_1.getMinutes();
            let endSec = endTime_1.getSeconds();
            let beginHou = beginTime_1.getHours();
            let beginMin = beginTime_1.getMinutes();
            let beginSec = beginTime_1.getSeconds();
            let beginArr = beginTime.split(' '); //拆分开始时间
            let endArr = endTime.split(' ');  //拆分结束时间
            let totalMin = 0;
            if (beginArr[0] != endArr[0]) { //跨日时间处理
              let hour = 23 - beginHou + endHou;
              let min = 59 - beginMin + endMin;
              let sec = 59 - beginSec + endSec;
              totalMin = hour * 60 + min;
              if (sec >= 30) { //大于等于30秒，记1分钟
                totalMin = totalMin + 1;
              }
            } else { //非跨日时间处理
              totalMin = (endHou - beginHou) * 60 + (endMin - beginMin);
              if ((endSec - beginSec) >= 30) {
                totalMin = totalMin + 1;
              }
            }
            if (timeLengthModel) {
              timeLengthModel.setValue(totalMin);
            }
          }
        })
      }
      /* 储值卡充值 */
      viewmodel.on('StorageCardRecharge', function (wrapFunc, transfer) {
        let products = viewmodel.getBillingContext('products')();
        if (!viewmodel.getParams().bStorageCardRecharge && products && products.length > 0) {
          cb.utils.alert('业务类型非储值且开单行非空, 不允许充值', 'error');
          return false;
        }
        if (!cb.rest.AppContext.option.isUseStorageCard) {
          cb.utils.alert('该门店未启用储值卡业务', 'error');
          return false;
        }
        var params = {
          entryType: 'storageCard',
          memberInfo: viewmodel.getBillingContext('memberInfo')()
        };
        var data = {
          billtype: 'freeview',
          billno: 'aa_storagecardrecharge',
          params
        };
        cb.loader.runCommandLine('bill', data, viewmodel, function (vm) {
          /* 定义方法 */
          var addProductToPanel = function (data) {
            var cardinfo = vm.getParams().storageCardInfo;
            var vm_cardnum = vm.getParams().vm_cardnum;
            if (!cardinfo) {
              cb.utils.alert('请设置有效卡', 'error');
              return false;
            }
            let cardnum = vm.get(vm_cardnum).getValue();
            let rechargeAmount = vm.get('rechargeAmount').getValue();
            let bonusAmount = vm.get('bonusAmount').getValue();
            if (!cardnum) {
              cb.utils.alert('储值卡号为空', 'error');
              return false;
            }
            if (!rechargeAmount) {
              cb.utils.alert('充值金额为空', 'error');
              return false;
            }

            var proxy = cb.rest.DynamicProxy.create({
              ensure: {
                url: '/storedValueCard/getcardrechargeitem',
                method: 'POST'
              }
            });

            var params = {
              cardinfo: JSON.stringify(vm.getParams().storageCardInfo),
              fBalance: vm.getParams().storageCardInfo.storage_balance + rechargeAmount + bonusAmount,
              card_num: cardnum,
              flotmoney: rechargeAmount,
              flotgivemoney: bonusAmount,
              iWarehouseid: viewmodel.getBillingContext('defaultWarehouse')() ? viewmodel.getBillingContext('defaultWarehouse')().iWarehouseid : null
            };
            let activeinfo = vm.getParams().activityInfo;
            if (activeinfo && activeinfo.id) {
              if (activeinfo.gift_coupons_details && activeinfo.gift_coupons_details.length > 0) {
                let coupons = [];
                if (activeinfo.is_double == '1' && activeinfo.storage_sum && activeinfo.recharge_amount) {
                  let multiplication = Math.floor(activeinfo.recharge_amount / activeinfo.storage_sum);
                  activeinfo.gift_coupons_details.forEach(item => coupons.push({
                    coupon_id: item.reward_id,
                    quantity: item.quantity * multiplication
                  }))
                }
                activeinfo["coupons"] = coupons;
              }
              params["activeinfo"] = JSON.stringify(activeinfo);
            }
            proxy.ensure(params, (err, result) => {
              if (err) {
                cb.utils.alert(err.message, 'error');
                return false;
              }
              if (!result || result.length === 0) {
                cb.utils.alert('返回结果为空', 'error');
                return false;
              }

              vm.get('rechargeAmount').setState('focused', false);
              vm.get(vm_cardnum).setState('focused', true);

              viewmodel.getParams().bStorageCardRecharge = true;    // 标记当前零售单为[充值]状态, 用于修改业务类型
              viewmodel.billingFunc.getDefaultBusinessType(30);     // 设置默认业务类型销售方式为30-储值
              var products = viewmodel.getBillingContext('products')();     //获取当前开单界面的商品行

              // 设置零售单表体数据
              let existCard = products.find(item => item.cStorageCardNum === result.cStorageCardNum);
              if (products && existCard) {            // 如果零售单已经有记录, 则更新表行记录, 否则新增一行
                // 判断充值状态
                if (viewmodel.getParams().cCardRechargeStates && viewmodel.getParams().cCardRechargeStates == '现销充值' && result.fMoney < 0) {
                  cb.utils.alert('当前为充值状态，不允许添加退货充值行。', 'error');
                  return false;
                } else if (viewmodel.getParams().cCardRechargeStates && viewmodel.getParams().cCardRechargeStates == '退货充值' && result.fMoney > 0) {
                  cb.utils.alert('当前为退货充值状态，不允许添加充值行。', 'error');
                  return false;
                }
                if (result.fMoney >= 0) {             // 如果充值金额为非负数
                  existCard.fDiscount = result.fDiscount;
                  // existCard.fCoDiscount = 0;       // 退货折扣
                  existCard.fCoDiscount = null;       // 退货折扣
                  existCard.fDiscountRate = result.fDiscountRate;
                  existCard.fMoney = result.fMoney;
                  existCard.fPrice = result.fPrice;
                  existCard.fQuoteMoney = result.fQuoteMoney;
                  existCard.fQuotePrice = result.fQuotePrice;
                  existCard.fRechargeMoney = result.fRechargeMoney;
                  existCard.fBalance = vm.getParams().storageCardInfo.storage_balance + result.fQuoteMoney;     // 设置充值后的余额, 打印用
                  existCard.selectedActivity = vm.getParams().selectedActivity;       //设置选中的活动, 充值调整用
                  existCard.activityInfo = vm.getParams().activityInfo;               //设置活动信息
                  existCard.retailvouchgifttoken = result.retailvouchgifttoken;       //设置赠券信息
                  vm.getParams().selectedActivity = null;
                  vm.getParams().activityInfo = null;
                  existCard.storageCardInfo = vm.getParams().storageCardInfo;         //设置储值卡信息
                  if (existCard.selectedActivity) {                                  //记录折扣信息
                    existCard.fPromotionDiscount = existCard.fDiscount;
                    existCard.fSceneDiscount = 0;
                    existCard.fSceneDiscountRate = 0;
                  } else {
                    // existCard.fPromotionDiscount = 0;
                    existCard.fPromotionDiscount = null;
                    existCard.fSceneDiscount = existCard.fDiscount;
                    existCard.fSceneDiscountRate = existCard.fDiscountRate;
                  }
                } else {                            // 如果充值金额为负数, 则充值金额记为退款金额, 赠送金额记为实退金额
                  existCard.fDiscount = result.fDiscount;
                  existCard.fCoDiscount = result.fCoDiscount;       // 退货折扣
                  existCard.fDiscountRate = result.fDiscountRate;
                  // existCard.fPromotionDiscount = 0;                       // 促销折扣
                  existCard.fPromotionDiscount = null;                       // 促销折扣
                  existCard.fSceneDiscount = 0;                           // 现场折扣
                  existCard.fSceneDiscountRate = 0;
                  existCard.fMoney = result.fMoney;                  // 金额 充值金额
                  existCard.fPrice = result.fPrice;                   // 单价
                  existCard.fQuoteMoney = result.fQuoteMoney;
                  existCard.fQuotePrice = result.fQuotePrice;
                  existCard.fRechargeMoney = result.fRechargeMoney;
                  existCard.fBalance = vm.getParams().storageCardInfo.storage_balance + result.fQuoteMoney;     // 设置充值后的余额, 打印用
                  existCard.selectedActivity = null;                            //设置选中的活动, 充值调整用
                  existCard.activityInfo = null;                                //设置活动信息
                  existCard.retailvouchgifttoken = null;                        //设置赠券信息
                  existCard.storageCardInfo = vm.getParams().storageCardInfo;         //设置储值卡信息
                }
                // 更新商品行
                viewmodel.billingFunc.updateFocusedRow(existCard);
                // // 储值卡充值设置赠品
                // _rechargePromotion.updateRechargeInfo(result.cStorageCardNum, existCard.activityInfo);
                // let giftFilter = _rechargePromotion.getGiftFilter();
                // viewmodel.billingFunc.setPromotionFilter(giftFilter);
              } else {
                // 根据充值金额为正为负不同处理折扣
                if (result.fMoney >= 0) {   // 如果充值金额为非负数
                  // 添加储值卡充值自定义单据状态
                  if (viewmodel.getParams().cCardRechargeStates == null) {
                    viewmodel.getParams().cCardRechargeStates = '现销充值';
                  }
                } else {    // 如果充值金额为负数
                  // 添加储值卡充值自定义单据状态
                  if (viewmodel.getParams().cCardRechargeStates == null) {
                    viewmodel.getParams().cCardRechargeStates = '退货充值';
                  }
                }

                // 判断充值状态
                if (viewmodel.getParams().cCardRechargeStates && viewmodel.getParams().cCardRechargeStates == '现销充值' && result.fMoney < 0) {
                  cb.utils.alert('当前为充值状态，不允许添加退货充值行。', 'error');
                  return false;
                } else if (viewmodel.getParams().cCardRechargeStates && viewmodel.getParams().cCardRechargeStates == '退货充值' && result.fMoney >= 0) {
                  cb.utils.alert('当前为退货充值状态，不允许添加充值行。', 'error');
                  return false;
                }

                // 新增充值商品行
                let ts = new Date().valueOf();
                result.productsku
                  ? result.key = `${result.product}|${result.productsku}_${ts}`   // sku
                  : result.key = `${result.product}_${ts}`;                       // 商品
                result.selectedActivity = vm.getParams().selectedActivity;        //设置选中的活动, 充值调整用
                result.activityInfo = vm.getParams().activityInfo;                //设置活动信息
                vm.getParams().selectedActivity = null;
                vm.getParams().activityInfo = null;
                result.storageCardInfo = vm.getParams().storageCardInfo;         //设置储值卡信息
                // 设置充值后的余额, 打印用
                result.fBalance = vm.getParams().storageCardInfo.storage_balance + result.fQuoteMoney;

                // 根据充值金额为正为负不同处理折扣
                if (result.fMoney >= 0) {   // 如果充值金额为非负数
                  if (result.selectedActivity) {               //有活动记录促销折扣, 没有记现场折扣
                    result.fPromotionDiscount = result.fDiscount;       //记录促销折扣
                  } else {
                    result.fSceneDiscount = result.fDiscount;
                    result.fSceneDiscountRate = result.fDiscountRate;   //记录现场折扣
                  }
                } else {    // 如果充值金额为负数
                  result.fCoDiscount = result.fDiscount;        // 记录退货折扣
                }

                let warehouse = viewmodel.getBillingContext('defaultWarehouse')();
                result.iWarehouseid = warehouse.iWarehouseid;
                result.iWarehouseid_erpCode = warehouse.iWarehouse_erpCode;
                result.iWarehouseid_name = warehouse.iWarehouseid_name;
                result.has_go_this_lz = true;                                 //不走换货

                let retailVouchHeader = { retailVouchDetails: [result] };           // 构造零售单的对象
                let memberInfo = viewmodel.getBillingContext('memberInfo')();   //添加会员信息
                if (memberInfo) {
                  retailVouchHeader.iMemberid = memberInfo.mid;
                  retailVouchHeader.iMemberid_cphone = memberInfo.phone;
                  retailVouchHeader.levelId = memberInfo.level_id;
                  retailVouchHeader.iMemberid_levelid_cMemberLevelName = memberInfo.level_name
                  retailVouchHeader.iMemberid_name = memberInfo.realname;
                }
                let mock = [{ rm_retailvouch: retailVouchHeader }];
                if(viewmodel.getParams().cCardRechargeStates == '退货充值'){
                  wrapFunc(mock, 'NoFormerBackBill', true);
                } else {
                  wrapFunc(mock, null, true);
                }
                // // 储值卡充值设置赠品
                // _rechargePromotion.updateRechargeInfo(result.cStorageCardNum, result.activityInfo);
                // let giftFilter = _rechargePromotion.getGiftFilter();
                // viewmodel.billingFunc.setPromotionFilter(giftFilter);
              }
              if (!products || products.length == 0) {    //第一次添加储值卡商品时, 修改商品列
                let changeObj = [
                  { dataIndex: 'cStorageCardNum', states: [{ name: 'isLineShow', value: true }] },
                  { dataIndex: 'fMoney', states: [{ name: 'name', value: '充值金额' }] },
                  { dataIndex: 'fDiscount', states: [{ name: 'name', value: '赠送金额' }] }
                ]
                viewmodel.get('retailVouchDetails') && viewmodel.get('retailVouchDetails').setColumnStates(changeObj)
              }

              // 添加过滤条件

            });
            return true;
          };
          /* 赠品过滤 */
          var getProductFilter = function (products) {
            let productFilters = [];
            let storageCards = [];
            let gifts = [];
            for (let i = 0; i < products.length; i++) {
              if (products[i].cStorageCardNum) {
                storageCards.push(products[i]);
              } else {
                gifts.push(products[i]);
              }
            }
            for (let i = 0; i < storageCards.length; i++) {
              let goods_ids = JSON.parse(storageCards[i].activityInfo.goods_ids);
              for (let j = 0; j < goods_ids; j++) {
                let oldFilter = productFilters.find(item => item.goodsId == goods_ids[j]);
                if (oldFilter) {
                  oldFilter.number += 1;
                } else {
                  let newFilter = {
                    // activity: storageCards[i].activityInfo.id,
                    filterType: 4,
                    productid: goods_ids[j].goodsId,
                    skuid: 0,
                    flotQuantity: Number(goods_ids[j].number)
                  }
                  productFilters.push(newFilter);
                }
              }
            }
            for (let i = 0; i < gifts.length; i++) {
              for (let j = 0; j < productFilters.length; j++) {
                let filter = productFilters.find(item => item.goodsId == gifts[i].product);
                filter.flotQuantity -= gifts[i].fQuantity;
              }
            }
            return productFilters;
          }

          /* 获取优惠券 */
          var getCoupons = function (products) {
            let coupons = [];
            for (let i = 0; i < products.length; i++) {
              if (!products[i].cStorageCardNum) { }
              let couponids = products.activityInfo.coupons_ids;
              for (let j = 0; j < couponids.length; j++) {
                let coupon = coupons.find(item => item.couponid = couponids[j]);
                if (coupon) {
                  coupon.number += 1;
                } else {
                  coupons.push({
                    couponid: couponids[j],
                    number: 1
                  });
                }
              }
            }
          }

          /* 清除界面信息 */
          var clearRechargeWindow = function (vm) {
            var vm_cardnum = vm.getParams().vm_cardnum;
            vm.getGridModel().execute('setSelectedAreaArr', []);
            vm.get(vm_cardnum).setValue(null);
            vm.get('storage_balance').setValue((0).toFixed(cb.rest.AppContext.option.amountofdecimal));
            vm.get('giftInfo').setValue(null);
            vm.get('rechargeAmount').setValue(0);
            vm.get('bonusAmount').setValue(0);
            if(cb.rest.AppContext.option.storageCardUseStyle != '3'){ //射频卡不处理读卡框
              vm.get(vm_cardnum).setReadOnly(false);
            }
            vm.get('rechargeAmount').setReadOnly(false);
            vm.get('bonusAmount').setReadOnly(false);
          };

          /* 注册事件 */
          /* 点击确定 */
          vm.on('sureClick', function (data) {
            if (addProductToPanel()) {
              viewmodel.communication({
                type: 'modal',
                payload: { data: false }
              });
              return true;
            }
            return false;
          });
          /* 点击添加卡片 */
          vm.on('addNextClick', function (data) {
            if (addProductToPanel()) {
              clearRechargeWindow(vm);
            }
            return false;
          });
          /* 点击返回 */
          vm.on('abandonClick', function () {
            viewmodel.communication({
              type: 'modal',
              payload: { data: false }
            })
            return true;
          });
          return true;
        })
      });

      /* 会员钱包充值 */
      viewmodel.on('MemberWalletRecharge', function (wrapFunc, transfer) {
        let products = viewmodel.getBillingContext('products')();
        if (products && products.length > 0) {
          cb.utils.alert('已有商品行, 不允许钱包充值', 'error');
          return false;
        }
        // 判断是否启用会员钱包
        var proxy = cb.rest.DynamicProxy.create({
          ensure: {
            url: '/memberwallet/getrule',
            method: 'POST'
          }
        });
        var params = {};
        proxy.ensure(params, (err, result) => {
          if (err) { cb.utils.alert(err.message, 'error'); return false; }
          if (!result && result.length == 0) { cb.utils.alert('获取启用会员钱包参数失败', 'error'); return false; }
          if (result[0] && result[0].storage_enable != 1) { cb.utils.alert('未启用会员钱包', 'error'); return false; }
          if (!viewmodel.getBillingContext('memberInfo')()) { cb.utils.alert('请先录入要充值的会员', 'error'); return false; }
          var params = {
            entryType: 'memberWallet',
            memberInfo: viewmodel.getBillingContext('memberInfo')(),
            focusedRow: viewmodel.getBillingContext('focusedRow')()
          };
          var data = {
            billtype: 'freeview',
            billno: 'aa_memberwalletrecharge',
            params
          };
          openWalletRechargeView(data, viewmodel, wrapFunc, transfer);
        });
      });

      /* 充值调整 */
      viewmodel.on('RechargeAdjust', function (wrapFunc, transfer) {
        if (!viewmodel.getParams().bStorageCardRecharge && !viewmodel.getParams().bMemberWalletRecharge) {
          cb.utils.alert('当前业务类型非储值, 不允许使用充值调整', 'error');
          return false;
        }
        let focusedRow = viewmodel.getBillingContext('focusedRow')();
        let memberInfo = viewmodel.getBillingContext('memberInfo')();
        let isCardRecharge = viewmodel.getParams().bStorageCardRecharge;
        // 储值卡充值调整
        if (isCardRecharge) {
          if (!cb.rest.AppContext.option.isUseStorageCard) {
            cb.utils.alert('该门店未启用储值卡业务', 'error');
            return false;
          }
          var params = {
            entryType: 'rechargeAdjust',
            memberInfo: memberInfo,
            focusedRow: focusedRow
          };
          var data = {
            billtype: 'freeview',
            billno: 'aa_storagecardrecharge',
            params
          };
          cb.loader.runCommandLine('bill', data, viewmodel, function (vm) {
            /* 定义方法 */
            var addProductToPanel = function () {
              var cardinfo = vm.getParams().storageCardInfo;
              var vm_cardnum = vm.getParams().vm_cardnum;
              if (!cardinfo) {
                cb.utils.alert('请设置有效卡', 'error');
                return false;
              }
              var proxy = cb.rest.DynamicProxy.create({
                ensure: {
                  url: '/storedValueCard/getcardrechargeitem',
                  method: 'POST'
                }
              });
              let cardnum = vm.get(vm_cardnum).getValue();
              let rechargeAmount = vm.get('rechargeAmount').getValue();
              let bonusAmount = vm.get('bonusAmount').getValue();
              if (!cardnum) {
                cb.utils.alert('储值卡号为空', 'error');
                return false;
              }
              if (!rechargeAmount) {
                cb.utils.alert('充值金额为空', 'error');
                return false;
              }
              var params = {
                cardinfo: JSON.stringify(vm.getParams().storageCardInfo),
                fBalance: vm.getParams().storageCardInfo.storage_balance + rechargeAmount + bonusAmount,
                card_num: cardnum,
                flotmoney: rechargeAmount,
                flotgivemoney: bonusAmount,
                iWarehouseid: viewmodel.getBillingContext('defaultWarehouse')() ? viewmodel.getBillingContext('defaultWarehouse')().iWarehouseid : null
              };
              let activeinfo = vm.getParams().activityInfo;
              if (activeinfo && activeinfo.id) {
                if (activeinfo.gift_coupons_details && activeinfo.gift_coupons_details.length > 0) {
                  let coupons = [];
                  if (activeinfo.is_double == '1' && activeinfo.storage_sum && activeinfo.recharge_amount) {
                    let multiplication = Math.floor(activeinfo.recharge_amount / activeinfo.storage_sum);
                    activeinfo.gift_coupons_details.forEach(item => coupons.push({
                      coupon_id: item.reward_id,
                      quantity: item.quantity * multiplication
                    }))
                  }
                  activeinfo["coupons"] = coupons;
                }
                params["activeinfo"] = JSON.stringify(activeinfo);
              }
              proxy.ensure(params, (err, result) => {
                if (err) {
                  cb.utils.alert(err.message, 'error');
                  return false;
                }
                if (!result || result.length === 0) {
                  cb.utils.alert('返回结果为空', 'error');
                  return false;
                }

                vm.get('rechargeAmount').setState('focused', false);
                vm.get(vm_cardnum).setState('focused', true);

                viewmodel.getParams().bStorageCardRecharge = true;    // 标记当前零售单为[充值]状态, 用于修改业务类型
                viewmodel.billingFunc.getDefaultBusinessType(30);     // 设置默认业务类型销售方式为30-储值
                var products = viewmodel.getBillingContext('products')();     //获取当前开单界面的商品行
                // 设置零售单表体数据
                let existCard = products.find(item => item.cStorageCardNum === result.cStorageCardNum);
                if (products && existCard) {            // 如果零售单已经有记录, 则更新表行记录, 否则新增一行
                  // 判断充值状态
                  if (viewmodel.getParams().cCardRechargeStates && viewmodel.getParams().cCardRechargeStates == '现销充值' && result.fMoney < 0) {
                    cb.utils.alert('当前为充值状态，不允许添加退货充值行。', 'error');
                    return false;
                  } else if (viewmodel.getParams().cCardRechargeStates && viewmodel.getParams().cCardRechargeStates == '退货充值' && result.fMoney > 0) {
                    cb.utils.alert('当前为退货充值状态，不允许添加充值行。', 'error');
                    return false;
                  }
                  if (result.fMoney >= 0) {             // 如果充值金额为非负数
                    existCard.fDiscount = result.fDiscount;
                    // existCard.fCoDiscount = 0;       // 退货折扣
                    existCard.fCoDiscount = null;       // 退货折扣
                    existCard.fDiscountRate = result.fDiscountRate;
                    existCard.fMoney = result.fMoney;
                    existCard.fPrice = result.fPrice;
                    existCard.fQuoteMoney = result.fQuoteMoney;
                    existCard.fQuotePrice = result.fQuotePrice;
                    existCard.fRechargeMoney = result.fRechargeMoney;
                    existCard.fBalance = vm.getParams().storageCardInfo.storage_balance + result.fQuoteMoney;     // 设置充值后的余额, 打印用
                    existCard.selectedActivity = vm.getParams().selectedActivity;       //设置选中的活动, 充值调整用
                    existCard.activityInfo = vm.getParams().activityInfo;               //设置活动信息
                    existCard.retailvouchgifttoken = result.retailvouchgifttoken;       //设置赠券信息
                    vm.getParams().selectedActivity = null;
                    vm.getParams().activityInfo = null;
                    existCard.storageCardInfo = vm.getParams().storageCardInfo;         //设置储值卡信息
                    if (existCard.selectedActivity) {                                  //记录折扣信息
                      existCard.fPromotionDiscount = existCard.fDiscount;
                      existCard.fSceneDiscount = 0;
                      existCard.fSceneDiscountRate = 0;
                    } else {
                      // existCard.fPromotionDiscount = 0;
                      existCard.fPromotionDiscount = null;
                      existCard.fSceneDiscount = existCard.fDiscount;
                      existCard.fSceneDiscountRate = existCard.fDiscountRate;
                    }
                  } else {                            // 如果充值金额为负数, 则充值金额记为退款金额, 赠送金额记为实退金额
                    existCard.fDiscount = result.fDiscount;
                    existCard.fCoDiscount = result.fCoDiscount;       // 退货折扣
                    existCard.fDiscountRate = result.fDiscountRate;
                    // existCard.fPromotionDiscount = 0;                       // 促销折扣
                    existCard.fPromotionDiscount = null;                       // 促销折扣
                    existCard.fSceneDiscount = 0;         // 现场折扣
                    existCard.fSceneDiscountRate = 0;
                    existCard.fMoney = result.fMoney;                   // 金额 充值金额
                    existCard.fPrice = result.fPrice;                   // 单价
                    existCard.fQuoteMoney = result.fQuoteMoney;
                    existCard.fQuotePrice = result.fQuotePrice;
                    existCard.fRechargeMoney = result.fRechargeMoney;
                    existCard.fBalance = vm.getParams().storageCardInfo.storage_balance + result.fQuoteMoney;     // 设置充值后的余额, 打印用
                    existCard.selectedActivity = null;                            //设置选中的活动, 充值调整用
                    existCard.activityInfo = null;                                //设置活动信息
                    existCard.retailvouchgifttoken = null;                        //设置赠券信息
                    existCard.storageCardInfo = vm.getParams().storageCardInfo;         //设置储值卡信息
                  }
                  // 更新商品行
                  viewmodel.billingFunc.updateFocusedRow(existCard);
                } else {
                  // 根据充值金额为正为负不同处理折扣
                  if (result.fMoney >= 0) {   // 如果充值金额为非负数
                    // 添加储值卡充值自定义单据状态
                    if (viewmodel.getParams().cCardRechargeStates == null) {
                      viewmodel.getParams().cCardRechargeStates = '现销充值';
                    }
                  } else {    // 如果充值金额为负数
                    // 添加储值卡充值自定义单据状态
                    if (viewmodel.getParams().cCardRechargeStates == null) {
                      viewmodel.getParams().cCardRechargeStates = '退货充值';
                    }
                  }

                  // 判断充值状态
                  if (viewmodel.getParams().cCardRechargeStates && viewmodel.getParams().cCardRechargeStates == '现销充值' && result.fMoney < 0) {
                    cb.utils.alert('当前为充值状态，不允许添加退货充值行。', 'error');
                    return false;
                  } else if (viewmodel.getParams().cCardRechargeStates && viewmodel.getParams().cCardRechargeStates == '退货充值' && result.fMoney > 0) {
                    cb.utils.alert('当前为退货充值状态，不允许添加充值行。', 'error');
                    return false;
                  }
                  // 新增充值商品行
                  let ts = new Date().valueOf();
                  result.productsku
                    ? result.key = `${result.product}|${result.productsku}_${ts}`   // sku
                    : result.key = `${result.product}_${ts}`;                       // 商品
                  result.selectedActivity = vm.getParams().selectedActivity;        //设置选中的活动, 充值调整用
                  result.activityInfo = vm.getParams().activityInfo;                //设置活动信息
                  vm.getParams().selectedActivity = null;
                  vm.getParams().activityInfo = null;
                  result.storageCardInfo = vm.getParams().storageCardInfo;         //设置储值卡信息
                  // 设置充值后的余额, 打印用
                  result.fBalance = vm.getParams().storageCardInfo.storage_balance + result.fQuoteMoney;

                  // 根据充值金额为正为负不同处理折扣
                  if (result.fMoney >= 0) {   // 如果充值金额为非负数
                    if (result.selectedActivity) {               //有活动记录促销折扣, 没有记现场折扣
                      result.fPromotionDiscount = result.fDiscount;       //记录促销折扣
                    } else {
                      result.fSceneDiscount = result.fDiscount;
                      result.fSceneDiscountRate = result.fDiscountRate;   //记录现场折扣
                    }
                  } else {    // 如果充值金额为负数
                    result.fCoDiscount = result.fDiscount;        // 记录退货折扣
                  }

                  let warehouse = viewmodel.getBillingContext('defaultWarehouse')();
                  result.iWarehouseid = warehouse.iWarehouseid;
                  result.iWarehouseid_erpCode = warehouse.iWarehouse_erpCode;
                  result.iWarehouseid_name = warehouse.iWarehouseid_name;
                  result.has_go_this_lz = true;                                 //不走换货

                  let retailVouchHeader = { retailVouchDetails: [result] };           // 构造零售单的对象
                  let memberInfo = viewmodel.getBillingContext('memberInfo')();   //添加会员信息
                  if (memberInfo) {
                    retailVouchHeader.iMemberid = memberInfo.mid;
                    retailVouchHeader.iMemberid_cphone = memberInfo.phone;
                    retailVouchHeader.levelId = memberInfo.level_id;
                    retailVouchHeader.iMemberid_levelid_cMemberLevelName = memberInfo.level_name
                    retailVouchHeader.iMemberid_name = memberInfo.realname;
                  }
                  let mock = [{ rm_retailvouch: retailVouchHeader }];
                  if(viewmodel.getParams().cCardRechargeStates == '退货充值'){
                    wrapFunc(mock, 'NoFormerBackBill', true);
                  } else {
                    wrapFunc(mock, null, true);
                  }
                }
              });
              return true;
            };

            /* 清除界面信息 */
            var clearRechargeWindow = function (vm, data) {
              var vm_cardnum = vm.getParams().vm_cardnum;
              vm.getGridModel().execute('setSelectedAreaArr', []);
              vm.get(vm_cardnum).setValue(null);
              vm.get('storage_balance').setValue((0).toFixed(cb.rest.AppContext.option.amountofdecimal));
              vm.get('giftInfo').setValue(null);
              vm.get('rechargeAmount').setValue(0);
              vm.get('bonusAmount').setValue(0);

              vm.get(vm_cardnum).setReadOnly(false);
              vm.get('rechargeAmount').setReadOnly(false);
              vm.get('bonusAmount').setReadOnly(false);
            };

            /* 注册事件 */
            /* 点击确定 */
            vm.on('sureClick', function (data) {
              if (addProductToPanel()) {
                viewmodel.communication({
                  type: 'modal',
                  payload: { data: false }
                });
                return true;
              }
              return false;
            });
            /* 点击添加卡片 */
            vm.on('addNextClick', function (data) {
              if (addProductToPanel()) {
                clearRechargeWindow(vm, data);
              }
              return false;
            });
            /* 点击返回 */
            vm.on('abandonClick', function () {
              viewmodel.communication({
                type: 'modal',
                payload: { data: false }
              })
              return true;
            });
            return true;
          })
        }
        // 会员钱包充值调整
        else {
          // 判断是否启用会员钱包
          var proxy = cb.rest.DynamicProxy.create({
            ensure: {
              url: '/memberwallet/getrule',
              method: 'POST'
            }
          });
          var params = {};
          proxy.ensure(params, (err, result) => {
            if (err) { cb.utils.alert(err.message, 'error'); return false; }
            if (!result && result.length == 0) { cb.utils.alert('获取启用会员钱包参数失败', 'error'); return false; }
            if (result[0] && result[0].storage_enable != 1) { cb.utils.alert('未启用会员钱包', 'error'); return false; }
            if (!viewmodel.getBillingContext('memberInfo')()) { cb.utils.alert('请先录入要充值的会员', 'error'); return false; }
            var params = {
              entryType: 'rechargeAdjust',
              memberInfo: memberInfo,
              focusedRow: focusedRow
            };
            var data = {
              billtype: 'freeview',
              billno: 'aa_memberwalletrecharge',
              params
            };
            openWalletRechargeView(data, viewmodel, wrapFunc, transfer);
          })
        }
      });

      /* 储值卡密码变更 */
      viewmodel.on('UpdateCardPassword', function (args) {
        // 判断是否启用密码校验
        var proxy = cb.rest.DynamicProxy.create({
          ensure: {
            url: '/storedValueCard/queryCommonSet',
            method: 'POST'
          }
        });
        let data = JSON.stringify([{ model_id: "MM", key: "storage_card_pwd" }]);
        var params = { data: data }
        proxy.ensure(params, (err, result) => {
          if (err) { cb.utils.alert(err.message, 'error'); return false; }
          if (!result || result.length == 0) { cb.utils.alert('获取是否密码校验参数失败', 'error'); return false; }
          let enablePwd = result.find(item => item.key == 'storage_card_pwd').value.toString() != '0';
          if (!enablePwd) { cb.utils.alert('未启用消费密码管理，不能修改密码', 'error'); return false; }

          var params = {
            // mode: 'add'
          };
          var data = {
            billtype: 'freeview',
            billno: 'aa_storagecardpwdchange',
            params
          };
          cb.loader.runCommandLine('bill', data, viewmodel, function (vm) {
            /* 确定按钮 */
            vm.on('sureClick', (data) => {
              let { cardnum, oldDrowssap, newDrowssap } = data;
              // 更新密码
              let updatePWDProxy = cb.rest.DynamicProxy.create({
                ensure: {
                  url: '/storedValueCard/setNewCardPwd',
                  method: 'POST'
                }
              })
              let updatePWDparams = {
                "card_no": cardnum,
                "old_password": oldDrowssap,
                "new_password": newDrowssap
              }
              let promise = new cb.promise();
              updatePWDProxy.ensure(updatePWDparams, (err, result) => {
                if (err) {
                  cb.utils.alert(err.message ? err.message : err, 'error');
                  promise.reject();
                  // return false;
                } else {
                  cb.utils.alert('密码修改成功', 'success');
                  viewmodel.communication({
                    type: 'modal',
                    payload: { data: false }
                  });
                  promise.resolve();
                  // return true;
                }
              })
              return promise;
            })
            /* 取消按钮 */
            vm.on('abandonClick', (data) => {
              viewmodel.communication({
                type: 'modal',
                payload: { data: false }
              })
              return true;
            })
            return true;
          })
        })
      })

      /* 储值卡会员钱包支付结算 */
      viewmodel.on('storageCardPay', function (args) {
        let { paymode, paymodes } = args;               // paymode 储值卡支付方式 paymodes所有支付方式
        let { setPaymodes, formatMoney } = viewmodel.billingFunc;    // setPaymodes 设置支付方式方法

        if (paymode.paymentType == 5) {     // 会员钱包
          let walletInfo = paymode.walletInfo;
          if (!walletInfo || !walletInfo.wallet || walletInfo.wallet.length < 1) {
            cb.utils.alert('钱包账户信息错误', 'error');
            return false;
          }
          var params = {
            mode: 'add',
            paymode: paymode,
            walletInfo: walletInfo,
            productRows: viewmodel.getBillingContext('products')()
          };
          var data = {
            billtype: 'freeview',
            billno: 'aa_memberwalletpay',
            params
          };
          openWalletPayView(paymode, paymodes, data, viewmodel);
        }

        if (paymode.paymentType == 18) {    // 储值卡
          let billingStatus = viewmodel.getBillingContext('billingStatus')();
          if (billingStatus == 'PresellBill') {
            let bDeliveryModify = viewmodel.getBillingContext('bDeliveryModify', 'reserve')();
            if (bDeliveryModify == true) {
              cb.utils.alert('预订且“交货时可修改商品”为是, 不允许储值卡结算', 'error');
              return false;
            }
          }
          if (billingStatus == 'Shipment') {   // 预定交货业务类型信息需要从单据头取
            let originBillHeader = viewmodel.getBillingContext('originBillHeader')();
            if (originBillHeader && originBillHeader.bDeliveryModify == false) {
              cb.utils.alert('预订交货且“交货时可修改商品”为否, 不允许储值卡结算', 'error');
              return false;
            }
          }
          if (!cb.rest.AppContext.option.isUseStorageCard) {
            cb.utils.alert('该门店未启用储值卡业务', 'error');
            return false;
          }
          // 判断是否启用密码校验
          var proxy = cb.rest.DynamicProxy.create({
            ensure: {
              url: '/storedValueCard/queryCommonSet',
              method: 'POST'
            }
          });
          let data = JSON.stringify([{ model_id: "MM", key: "storage_card_pwd" }]);
          var params = { data: data }
          proxy.ensure(params, (err, result) => {
            if (err) { cb.utils.alert(err.message, 'error'); return false; }
            if (!result || result.length == 0) { cb.utils.alert('获取是否密码校验参数失败', 'error'); return false; }
            let enablePwd = result.find(item => item.key == 'storage_card_pwd').value.toString() != '0';
            var params = {
              mode: 'add',
              enablePwd: enablePwd,
              paymode: paymode,
            };
            var data = {
              billtype: 'freeview',
              billno: 'aa_storagecardpay',
              params
            };
            openCardPayView(paymode, paymodes, data, viewmodel);
          })
        }

      });

      /* 快捷结算 */
      viewmodel.on('interventionShortCutView', function (args) {
        let { paymodes } = args;                        // paymodes所有支付方式
        let { setPaymodes } = viewmodel.billingFunc;    // setPaymodes 设置支付方式方式
        let quickPaymode = null;                        // 当前快捷支付方式
        let key = null;                                 // 当前快捷支付方式key
        for (let attr in paymodes) {
          if (paymodes[attr].show && paymodes[attr].show != 0) {
            quickPaymode = paymodes[attr];
            key = attr;
          }
        }

        //售卡状态不允许结算
        if (viewmodel.getParams().bStorageCardSale && viewmodel.getBillingContext('businessType')().name != '售卡') {
          cb.utils.alert('当前业务类型不能售卡', 'error');
          return false;
        }
        // 储值卡非原单退不允许结算
        if (viewmodel.getParams().bStorageCardBackBill && viewmodel.getBillingContext('businessType')().name != '售卡') {
          cb.utils.alert('当前业务类型不能退卡', 'error');
          return false;
        }

        // 1.会员钱包快捷支付
        if (quickPaymode && quickPaymode.paymentType == 5) {
          let billingStatus = viewmodel.getBillingContext('billingStatus')();
          if (billingStatus == 'PresellBill') {
            let bDeliveryModify = viewmodel.getBillingContext('bDeliveryModify', 'reserve')();
            if (bDeliveryModify == true) {
              cb.utils.alert('预订且“交货时可修改商品”为是, 不允许会员钱包结算', 'error');
              return false;
            }
          }
          if (billingStatus == 'Shipment') {   // 预定交货业务类型信息需要从单据头取
            let originBillHeader = viewmodel.getBillingContext('originBillHeader')();
            if (originBillHeader && originBillHeader.bDeliveryModify == false) {
              cb.utils.alert('预订交货且“交货时可修改商品”为否, 不允许会员钱包结算', 'error');
              return false;
            }
          }
          if (viewmodel.getParams().bStorageCardRecharge || viewmodel.getParams().bMemberWalletRecharge) {
            cb.utils.alert('储值业务类型下不能使用会员钱包支付', 'error');
            return false;
          }
          // 判断是否启用会员钱包
          var proxy = cb.rest.DynamicProxy.create({
            ensure: {
              url: '/memberwallet/getrule',
              method: 'POST'
            }
          });
          var params = {}
          // let billingStatus = viewmodel.getBillingContext('billingStatus')();
          let promise = new cb.promise();
          proxy.ensure(params, (err, result) => {
            if (err) {
              cb.utils.alert(err.message, 'error');
              viewmodel.billingFunc.closePaymodal();
              promise.reject();
              return false;
            }
            if (!result || result.length == 0) {
              cb.utils.alert('获取是否启用会员钱包参数失败', 'error');
              viewmodel.billingFunc.closePaymodal();
              promise.reject();
              return false;
            }
            let enableWallet = result[0].storage_enable == 1;
            if (!enableWallet) {
              cb.utils.alert('未启用会员钱包', 'error');
              viewmodel.billingFunc.closePaymodal();
              promise.reject();
              return false;
            }
            let memberInfo = viewmodel.getBillingContext('memberInfo')();
            if (!memberInfo || memberInfo.mid == null) {
              cb.utils.alert('请先录入会员！', 'error');
              viewmodel.billingFunc.closePaymodal();
              return false;
            }
            var walletProxy = cb.rest.DynamicProxy.create({   // 查询当前会员钱包信息
              queryWallet: {
                url: '/memberwallet/query',
                method: 'POST'
              }
            })
            let memberId = memberInfo.mid;
            let storeId = cb.rest.AppContext.user.storeId;
            let productRows = viewmodel.getBillingContext('products')();
            let details = [];
            let getMoneyMap = viewmodel.getBillingContext('getMoneyMap')();
            let moneyMapGathering = getMoneyMap ? (getMoneyMap['Gathering'] ? getMoneyMap['Gathering'].value : 0) : 0;
            if(billingStatus === 'NoFormerBackBill' && moneyMapGathering <= 0) { // 非原单退货金额为负, 不能使用会员钱包支付
              cb.utils.alert('非原单退货应收金额为负, 不能使用会员钱包支付', 'error');
              promise.reject();
              return false;
            }
            if (moneyMapGathering <= 0) {    // 结算金额小于0时, 交给后端处理; = 0时, 不处理
              promise.resolve();
              return;
            }
            productRows.forEach(
              productRow => {
                // 原单退货可以销售商品, 结算金额大于0时, 仅计算销售商品可用钱包进行分摊; 结算金额小于0时, 交给后端处理
                // 结算金额 > 0, 记录数量大于0的行, 以及参与折扣计算的行(非狭义换货行)
                if (productRow.fQuantity > 0 && productRow.bCanDiscount && (!productRow.ikitType || productRow.ikitType == 1)) {
                  details.push({
                    "index": productRow.rowNumber,
                    "goods_id": productRow.product,
                    "goods_sku_id": productRow.productsku,
                    "goods_class_path": productRow.product_productClass_path,
                    "sum": productRow.fMoney
                  })
                }
              });
            var data = {
              "mid": memberId,
              "store": storeId,
              "store_tag_type": 1,  // 1:按商品分类
              "details": details
            }
            var params = { data: JSON.stringify(data) }

            walletProxy.queryWallet(params, (err, walletInfo) => {
              if (err) {
                cb.utils.alert(err.message);
                viewmodel.billingFunc.closePaymodal()
                promise.reject();
                return false;
              }
              if (!walletInfo || !walletInfo.wallet || walletInfo.wallet == 0) {
                cb.utils.alert('无可用会员钱包', 'error');
                viewmodel.billingFunc.closePaymodal()
                promise.reject();
                return false;
              }

              let wallets = walletInfo.wallet;    // 全部可用钱包
              if (wallets.length == 1) {
                if (wallets[0].suit_index.length < details.length) {
                  cb.utils.alert('钱包不适用全部商品, 不能快速结算', 'error');
                  viewmodel.billingFunc.closePaymodal()
                  promise.reject();
                  return false;
                }
                let productSum = 0;
                details.forEach(
                  detail =>
                    productSum = Number(cb.utils.getRoundValue(productSum + detail.sum, cb.rest.AppContext.option.amountofdecimal))
                )
                // 非原单退货存在换货行, 会抵消一部分金额, 此时应收金额(moneyMapGathering)小于适用商品金额(productSum)
                let payValue = moneyMapGathering < productSum ? moneyMapGathering : productSum;
                if (wallets[0].available < payValue) {
                  cb.utils.alert('钱包可用余额不足, 不能快速结算', 'error');
                  viewmodel.billingFunc.closePaymodal()
                  promise.reject();
                  return false;
                }

                let gatheringvouchPaydetail = [];
                gatheringvouchPaydetail.push({
                  isSingleWallet: true,       // 标记是否单钱包
                  cCardCode: wallets[0].account_id,
                  fBalance: wallets[0].balance,
                  pament_available_balance: payValue,
                  fAmount: null,
                  dPayTime: null,
                  iPaymentid: quickPaymode.paymethodId,
                  iPaytype: quickPaymode.paymentType,
                  _status: 'Insert'
                })
                quickPaymode.gatheringvouchPaydetail = gatheringvouchPaydetail;
                quickPaymode.walletInfo = walletInfo;

                paymodes[key] = quickPaymode;
                viewmodel.billingFunc.setPaymodes(paymodes);
                promise.resolve();     // 自己不设置paymode, 走公共逻辑??
              }
              else if (wallets.length > 1) {
                if (billingStatus == "NoFormerBackBill" && moneyMapGathering < 0) {    // 非原单退不能使用会员多钱包支付
                  cb.utils.alert('非原单退不能使用会员多钱包支付', 'error');
                  viewmodel.billingFunc.closePaymodal()
                  promise.reject();
                  return false;
                }
                let walletSum = 0;
                wallets.forEach(
                  wallet => {
                    walletSum = Number(cb.utils.getRoundValue(walletSum + Number(wallet.available), cb.rest.AppContext.option.amountofdecimal))
                  }
                )
                if (walletSum < moneyMapGathering) {
                  cb.utils.alert('会员钱包可用余额不足或不适用全部商品', 'error');
                  viewmodel.billingFunc.closePaymodal();
                  promise.reject();
                  return false;
                }
                quickPaymode.walletInfo = walletInfo;

                paymodes[key] = quickPaymode;
                viewmodel.billingFunc.setPaymodes(paymodes);
                // promise.resolve();     // 自己不设置paymode, 走公共逻辑??

                // 钱包支付弹窗
                paymodes = viewmodel.getBillingContext('paymodes')();
                quickPaymode = paymodes[key];
                var params = {
                  mode: 'add',
                  paymode: quickPaymode,
                  isQuickPay: true,
                  walletInfo: walletInfo,
                  productRows: viewmodel.getBillingContext('products')()
                };
                var data = {
                  billtype: 'freeview',
                  billno: 'aa_memberwalletpay',
                  params
                };
                cb.loader.runCommandLine('bill', data, viewmodel, function (vm) {
                  /* 定义方法 */
                  /* 添加收款单支付孙表 */
                  var addGatheringvouchPaydetail = function () {
                    let paymode = vm.getParams().paymode;
                    let rows = vm.getGridModel().getRows();   //获取行
                    let gatheringvouchPaydetail = [];         //收款单支付孙表
                    let dPayTime = new Date().format('yyyy-MM-dd hh:mm:ss');
                    let amountsum = 0;
                    for (let i = 0; i < rows.length; i++) {
                      if (rows[i].payment_amount == 0) continue;      //不添加支付金额为0的钱包
                      amountsum += Number(rows[i].payment_amount);
                      gatheringvouchPaydetail.push({
                        cCardCode: rows[i].payment_account_name,
                        cTransactionCode: rows[i].payment_account,
                        fBalance: Number((rows[i].payment_balance - rows[i].payment_amount).toFixed(cb.rest.AppContext.option.amountofdecimal)),     //会员钱包应该不会同时在多个地方支付, 余额应该是不会变的                    pament_available_balance: rows[i].pament_available_balance,
                        pament_available_balance: rows[i].pament_available_balance,
                        fAmount: rows[i].payment_amount,
                        dPayTime: dPayTime,
                        iPaymentid: paymode.paymethodId,
                        iPaytype: paymode.paymentType,
                        _status: 'Insert'
                      });
                    }
                    if (paymode.value != amountsum) {
                      cb.utils.alert('支付金额不相等', 'error');
                      return false;
                    }
                    paymode.gatheringvouchPaydetail = gatheringvouchPaydetail;
                    for (let attr in paymodes) {
                      if (paymodes[attr].paymethodId == paymode.paymethodId) {
                        paymodes[attr] = paymode;
                        break;
                      }
                    }
                    setPaymodes(paymodes);
                    return true;
                  }
                  /* 关闭方法 */
                  var closeView = function () { }

                  /* 注册方法 */
                  vm.on('sure', function (data) {
                    if (addGatheringvouchPaydetail()) {
                      promise.resolve();
                      viewmodel.communication({
                        type: 'modal',
                        payload: { data: false }
                      });
                    }
                    return false;
                  });
                  vm.on('abandon', function (data) {
                    // closeView();
                    viewmodel.billingFunc.closePaymodal();
                    promise.reject();
                    viewmodel.communication({
                      type: 'modal',
                      payload: { data: false }
                    })
                    return false;
                  });
                  vm.on('afterClose', function (data) {
                    // closeView();
                    viewmodel.billingFunc.closePaymodal();
                    promise.reject();
                    viewmodel.communication({
                      type: 'modal',
                      payload: { data: false }
                    })
                    return false;
                  });
                  return true
                })
              }
            })
          })
          return promise;
        }

        // 2.储值卡快捷支付
        if (quickPaymode && quickPaymode.paymentType == 18) {
          if (viewmodel.getParams().bStorageCardRecharge || viewmodel.getParams().bMemberWalletRecharge) { //当前业务类型
            cb.utils.alert('储值业务类型下充值不能使用储值卡支付', 'error');
            return false;
          }
          let billingStatus = viewmodel.getBillingContext('billingStatus')();
          if (billingStatus == 'PresellBill') {
            let bDeliveryModify = viewmodel.getBillingContext('bDeliveryModify', 'reserve')();
            if (bDeliveryModify == true) {
              cb.utils.alert('预订且“交货时可修改商品”为是, 不允许储值卡结算', 'error');
              return false;
            }
          }
          if (billingStatus == 'Shipment') {   // 预定交货业务类型信息需要从单据头取
            let originBillHeader = viewmodel.getBillingContext('originBillHeader')();
            if (originBillHeader && originBillHeader.bDeliveryModify == false) {
              cb.utils.alert('预订交货且“交货时可修改商品”为否, 不允许储值卡结算', 'error');
              return false;
            }
          }
          if (!cb.rest.AppContext.option.isUseStorageCard) {
            cb.utils.alert('该门店未启用储值卡业务', 'error');
            return false;
          }
          // 判断是否启用密码校验
          var proxy = cb.rest.DynamicProxy.create({
            ensure: {
              url: '/storedValueCard/queryCommonSet',
              method: 'POST'
            }
          });
          let data = JSON.stringify([{ model_id: "MM", key: "storage_card_pwd" }]);
          var params = { data: data }
          var promise = new cb.promise();
          proxy.ensure(params, (err, result) => {
            if (err) {
              cb.utils.alert(err.message, 'error');
              viewmodel.billingFunc.closePaymodal()
              promise.reject();
              return false;
            }
            if (!result || result.length == 0) {
              cb.utils.alert('获取是否密码校验参数失败', 'error');
              viewmodel.billingFunc.closePaymodal()
              promise.reject();
              return false;
            }
            let enablePwd = result.find(item => item.key == 'storage_card_pwd').value.toString() != '0';
            var params = {
              mode: 'add',
              enablePwd: enablePwd,
              paymode: quickPaymode,
              isQuickPay: true
            };
            var data = {
              billtype: 'freeview',
              billno: 'aa_storagecardpay',
              params
            };
            // if (openQuickCardPayViewCount > 0) {
            //   return;
            // }
            openQuickCardPayViewCount += 1;
            cb.loader.runCommandLine('bill', data, viewmodel, function (vm) {
              /* 定义方法 */
              /* 添加收款单支付孙表 */
              var addGatheringvouchPaydetail = function () {
                let paymode = vm.getParams().paymode;
                let rows = vm.getGridModel().getRows();   //获取行
                let gatheringvouchPaydetail = [];         //收款单支付孙表
                let dPayTime = new Date().format('yyyy-MM-dd hh:mm:ss');
                let amountsum = 0;
                for (let i = 0; i < rows.length; i++) {
                  if (rows[i].payment_amount == 0) continue;      //不添加支付金额为0的卡
                  amountsum += Number(rows[i].payment_amount);
                  gatheringvouchPaydetail.push({
                    cCardCode: rows[i].payment_cardnum,
                    fBalance: Number((rows[i].payment_balance - rows[i].payment_amount).toFixed(cb.rest.AppContext.option.amountofdecimal)),     //一张卡应该不会同时在多个地方支付, 余额应该是不会变的
                    fAmount: rows[i].payment_amount,
                    password: rows[i].password,
                    dPayTime: dPayTime,
                    iPaymentid: paymode.paymethodId,
                    iPaytype: paymode.paymentType,
                    _status: 'Insert'
                  });
                }
                if (paymode.value != amountsum) {
                  cb.utils.alert('支付金额不相等', 'error');
                  return false;
                }
                paymode.gatheringvouchPaydetail = gatheringvouchPaydetail;
                for (let attr in paymodes) {
                  if (paymodes[attr].paymethodId == paymode.paymethodId) {
                    paymodes[attr] = paymode;
                    break;
                  }
                }
                setPaymodes(paymodes);
                return true;
              }
              /* 关闭方法 */
              var closeView = function () { }

              /* 注册方法 */
              vm.on('sureClick', function (data) {
                if (addGatheringvouchPaydetail()) {
                  openQuickCardPayViewCount -= 1;
                  promise.resolve();
                  viewmodel.communication({
                    type: 'modal',
                    payload: { data: false }
                  });
                  return true;
                }
                return false;
              });
              vm.on('abandonClick', function (data) {
                openQuickCardPayViewCount -= 1;
                viewmodel.billingFunc.closePaymodal();
                // closeView();
                promise.reject();
                viewmodel.communication({
                  type: 'modal',
                  payload: { data: false }
                })
                return true;
              });
              vm.on('afterCloseClick', function (data) {
                openQuickCardPayViewCount -= 1;
                viewmodel.billingFunc.closePaymodal();
                // closeView();
                promise.reject();
                viewmodel.communication({
                  type: 'modal',
                  payload: { data: false }
                })
                return true;
              });
              return true
            })
          })
          return promise;
        }

        return true;
      });

      /* 新开单之后 */
      viewmodel.on('afterClear', function (args) {
        if (viewmodel.getParams().bStorageCardRecharge) {   // 储值卡充值
          let changeObj = [
            { dataIndex: 'cStorageCardNum', states: [{ name: 'isLineShow', value: false }] },
            { dataIndex: 'fMoney', states: [{ name: 'name', value: '金额' }] },           // 新开单恢复储值卡修改字段
            { dataIndex: 'fDiscount', states: [{ name: 'name', value: '折扣额' }] }
          ]
          viewmodel.get('retailVouchDetails') && viewmodel.get('retailVouchDetails').setColumnStates(changeObj)
          // 新开单清除储值卡充值相关参数
          delete viewmodel.getParams()['bStorageCardRecharge'];
          delete viewmodel.getParams()['cCardRechargeStates'];
          viewmodel.billingFunc.getDefaultBusinessType(1);     // 设置默认业务类型销售方式为1-现销
        }

        if (viewmodel.getParams().bMemberWalletRecharge) {   // 会员钱包充值
          // 新开单清除会员钱包充值相关参数
          delete viewmodel.getParams()['bMemberWalletRecharge'];
          viewmodel.billingFunc.getDefaultBusinessType(1);     // 设置默认业务类型销售方式为1-现销
        }

        if (viewmodel.getParams().bStorageCardSale || viewmodel.getParams().bStorageCardBackBill) {   //售卡退卡
          let changeObj = [
            { dataIndex: 'cStorageCardNum', states: [{ name: 'isLineShow', value: false }] },
            { dataIndex: 'fMoney', states: [{ name: 'name', value: '金额' }] },           // 新开单恢复储值卡修改字段
            { dataIndex: 'fDiscount', states: [{ name: 'name', value: '折扣额' }] }
          ]
          viewmodel.get('retailVouchDetails') && viewmodel.get('retailVouchDetails').setColumnStates(changeObj)
          if (viewmodel.getParams().bStorageCardBackBill) {
            viewmodel.billingFunc.ModifyBillStatus('CashSale');
          }
          // 新开单清除储值卡售卡退卡相关参数
          delete viewmodel.getParams()['bStorageCardSale'];
          delete viewmodel.getParams()['bStorageCardBackBill'];
          viewmodel.billingFunc.getDefaultBusinessType(1);     // 设置默认业务类型销售方式为1-现销
        }

        if (window) {
          if (viewmodel.getParams().cardSaleParams && viewmodel.getParams().cardSaleParams.ipcRenderer) {
            cb.electron.sendOrder('stopGetCardnum');
            viewmodel.getParams().cardSaleParams.ipcRenderer
              .removeListener('afterGetCardnumFromDevice', afterGetCardnumFromDevice);
            delete viewmodel.getParams()['cardSaleParams'];
          }
        }

        //卡券业务类型新开单初始化设置 sunhyu
        if (viewmodel.getParams().bCardCoupon) {
          delete viewmodel.getParams()['bCardCoupon'];          // 清除卡券业务类型参数
          viewmodel.billingFunc.getDefaultBusinessType(1);     // 设置默认业务类型销售方式为1-现销
          delete viewmodel.getParams()['couponPrice'];
        } else if (viewmodel.getParams().bCardCouponBack) {
          delete viewmodel.getParams()['bCardCouponBack'];
          viewmodel.billingFunc.getDefaultBusinessType(1);
          viewmodel.billingFunc.ModifyBillStatus('CashSale');
          delete viewmodel.getParams()['couponPrice'];
        } else if (viewmodel.getParams().bCardCouponOriginBack) {
          delete viewmodel.getParams()['bCardCouponOriginBack'];
        }else if(viewmodel.getParams().usedCouponPaymentOriginBack){
          //优惠券收款方式零售单原单退货逻辑控制
          delete viewmodel.getParams()['usedCouponPaymentOriginBack'];
        }

        //预订单不算卡券结算方式原始已收款金额
        // if (viewmodel.getParams().fOriginNoCouponMoney) {
        //   delete viewmodel.getParams()['fOriginNoCouponMoney'];
        // }

        // if(viewmodel.getParams().beforeMemberProducts ){
        //   delete viewmodel.getParams()['beforeMemberProducts'];
        // }
        viewmodel.getParams().beforeMemberProducts = []; //每次新开单，维护一个参数
        //新开单后清除，若执行优惠，是否允许增加会员的判断标记
        if(viewmodel.getParams().isAddMember){
          delete viewmodel.getParams()['isAddMember'];
        }
        //新开单后清除与退品相关的标记
        if (viewmodel.getParams().presellChange) {
          delete viewmodel.getParams()['presellChange'];
        }
        if (viewmodel.getParams().retailVouchReturnDetails) { //退品子表数据缓存数据
          delete viewmodel.getParams()['retailVouchReturnDetails'];
        }
        if (viewmodel.getParams().retailVouchReturnDetailsNew) { //退品子表数据缓存数据
          delete viewmodel.getParams()['retailVouchReturnDetailsNew'];
        }
        //新开单后清楚缓存的商城储值卡退款分摊相关的数据
        if(viewmodel.getParams().backMallStoragecard){
          delete viewmodel.getParams()['backMallStoragecard'];
        }

        //新开单清除oldGiftTokens
        if (viewmodel.getParams().oldGiftTokens) {
          delete viewmodel.getParams()['oldGiftTokens'];
        }
      })

      /* 录入会员后执行会员折扣前 */
      viewmodel.on('afterMemberGetMemberPrice', function (args) {
        if (viewmodel.getParams().bStorageCardRecharge || viewmodel.getParams().bMemberWalletRecharge) {    //储值业务不执行会员折扣
          return false;
        }
      })

      /* 结算界面点击结算方式 */
      viewmodel.on('afterPayTabsClick', function (args) {
        // paymodes:原始结算方式状态集合；obj:经公共处理后的最新结算方式状态结合
        let { key, paymodes, obj } = args;
        let paymode = paymodes[key] ? paymodes[key] : null;

        //结算方式有卡券时 选择新的结算方式不清空卡券金额 sunhyu
        let cBillingStatus = viewmodel.getBillingContext('billingStatus')();
        let coupons = viewmodel.getBillingContext('coupons', 'product')();
        if (coupons) {
          let fCouponPaymentMoney = 0.0;
          coupons.forEach(function (coupon) {
            if (coupon.dl_paytype == 1) {
              fCouponPaymentMoney = fCouponPaymentMoney + 1 * coupon.fMoney;
            }
          });
          if (fCouponPaymentMoney > 0) {
            let { formatMoney } = viewmodel.billingFunc;
            let amountofdecimal = cb.rest.AppContext.option.amountofdecimal;
            let fMoneySum = 0.0;
            let keyIndex = 0;
            let hasChangedMoney = false;
            for (let attr in paymodes) {
              let paymode = paymodes[attr];
              if (paymode.paymentType == 21 && paymode.value > 0) {
                obj && obj.forEach(function (objitem) {
                  if (objitem.paymethodId == paymode.paymethodId) {
                    if(objitem.value && objitem.value - paymode.value == 0){
                      hasChangedMoney = true;
                      // 改过金额 不再处理
                    }else{
                      objitem.value = cb.utils.getRoundValue(paymode.value, amountofdecimal);
                    }
                  }
                });
              }
            }
            for (let i = 0; i < obj.length; i++) {
              if (obj[i].paymethodId == key) {
                keyIndex = i;
              }
            }
            // let getMoneyMap = viewmodel.getBillingContext('getMoneyMap')();
            // if (getMoneyMap && getMoneyMap['Gathering']) {
            //   fMoneySum = getMoneyMap['Gathering'].value;
            // }
            if(!hasChangedMoney){
              obj[keyIndex].value = cb.utils.getRoundValue(obj[keyIndex].value - fCouponPaymentMoney, amountofdecimal);
            }
          }
        } else if (cBillingStatus == 'FormerBackBill') {
          let { formatMoney } = viewmodel.billingFunc;
          let amountofdecimal = cb.rest.AppContext.option.amountofdecimal;
          let fCouponPaymentMoney = 0.0;
          let fMoneySum = 0.0;
          let keyIndex = 0;
          let hasChangedMoney = false;
          for (let attr in paymodes) {
            let paymode = paymodes[attr];
            if ((paymode.paymentType == 21 || paymode.paymentType == 5) && paymode.value && paymode.value != 0) {
              obj && obj.forEach(function (objitem) {
                if (objitem.paymethodId == paymode.paymethodId) {
                  if(objitem.value && objitem.value - paymode.value == 0){
                    hasChangedMoney = true;
                    objitem._readOnly = true;
                    objitem._noDelete = true;
                    fCouponPaymentMoney = fCouponPaymentMoney + 1 * paymode.value;
                    // 改过金额 不再处理
                  }else{
                    objitem.value = cb.utils.getRoundValue(paymode.value, amountofdecimal);
                    objitem._readOnly = true;
                    objitem._noDelete = true;
                    fCouponPaymentMoney = fCouponPaymentMoney + 1 * paymode.value;
                  }
                }
              });
            }
          }
          for (let i = 0; i < obj.length; i++) {
            if (obj[i].paymethodId == key) {
              keyIndex = i;
            }
          }
          // let getMoneyMap = viewmodel.getBillingContext('getMoneyMap')();
          // if (getMoneyMap && getMoneyMap['Gathering']) {
          //   fMoneySum = getMoneyMap['Gathering'].value;
          // }
          if(!hasChangedMoney){
            obj[keyIndex].value = cb.utils.getRoundValue(obj[keyIndex].value - fCouponPaymentMoney, amountofdecimal);
          }
        }

        if (paymode && paymode.paymentType == 5) {            //会员钱包支付
          let billingStatus = viewmodel.getBillingContext('billingStatus')();
          // if (billingStatus == 'FormerBackBill'){
          //   let retailVouchDetails = viewmodel.getBillingContext('products')();
          //   let walletPaySum = 0;
          //   retailVouchDetails.forEach(item => {
          //     let payDetails = item.retailVouchCardDetails;
          //     let walletPay = 0;
          //     let fSettMoney = 0; //结算金额
          //     let fOriCoMoney = 0; //	原单退货金额
          //     let fDiscountMoney = 0; //		折扣金额
          //     let fCoMoney = 0; //		已退货金额
          //     if(payDetails && payDetails.length > 0){
          //       payDetails.forEach(detail => {
          //         if(detail.iPayType == 5){
          //           fSettMoney = viewmodel.billingFunc.formatMoney(detail.fSettMoney);
          //           fOriCoMoney = viewmodel.billingFunc.formatMoney(detail.fOriCoMoney);
          //           fDiscountMoney = viewmodel.billingFunc.formatMoney(detail.fDiscountMoney);
          //           fCoMoney = viewmodel.billingFunc.formatMoney(detail.fCoMoney);
          //         }
          //       })
          //     }
          //     let restquantity = oriquantity - coquantity;
          //     let thispay = viewmodel.billingFunc.formatMoney(walletPay * fquantity / restquantity);
          //     walletPaySum = viewmodel.billingFunc.formatMoney(walletPaySum + thispay);
          //   })
          // }
          if (billingStatus == 'PresellBill') {
            let bDeliveryModify = viewmodel.getBillingContext('bDeliveryModify', 'reserve')();
            if (bDeliveryModify == true) {
              cb.utils.alert('预订且“交货时可修改商品”为是, 不允许会员钱包结算', 'error');
              return false;
            }
          }
          if (billingStatus == 'Shipment') {   // 预定交货业务类型信息需要从单据头取
            let originBillHeader = viewmodel.getBillingContext('originBillHeader')();
            if (originBillHeader && originBillHeader.bDeliveryModify == false) {
              cb.utils.alert('预订交货且“交货时可修改商品”为否, 不允许会员钱包结算', 'error');
              return false;
            }
          }
          let billPaymodes = viewmodel.getBillingContext('billPaymodes', 'paymode')();
          let hasUseWallet = false;
          for (let attr in billPaymodes) {
            if (billPaymodes[attr] && billPaymodes[attr].paymentType == 5
              && billPaymodes[attr].originValue != null && billPaymodes[attr].show) {
              hasUseWallet = true;
              break;
            }
          }
          if (billingStatus == 'PresellBack' && !hasUseWallet) {
            cb.utils.alert('预订时未使用会员钱包支付, 退订时不允许使用会员钱包支付', 'error');
            return false;
          }
          let objPaymode = null;
          let objIndex = -1;
          for (let i = 0; i < obj.length; i++) {
            if (obj[i] && obj[i].paymentType == 5 && obj[i].paymethodId == key) {
              objIndex = i;
              objPaymode = obj[i];
            }
          }
          if (!objPaymode) {
            cb.utils.alert('获取支付方式失败', 'error');
            return false;
          }
          if (viewmodel.getParams().bStorageCardRecharge || viewmodel.getParams().bMemberWalletRecharge) {
            cb.utils.alert('储值业务类型下不能使用会员钱包支付', 'error');
            return false;
          }
          let memberInfo = viewmodel.getBillingContext('memberInfo')();
          if (!memberInfo || memberInfo.mid == null) {
            cb.utils.alert('请先录入会员！', 'error');
            return false;
          }
          // 判断是否启用会员钱包
          var proxy = cb.rest.DynamicProxy.create({
            ensure: {
              url: '/memberwallet/getrule',
              method: 'POST'
            }
          });
          var params = {}
          // let billingStatus = viewmodel.getBillingContext('billingStatus')();
          let promise = new cb.promise();
          proxy.ensure(params, (err, result) => {
            if (err) { cb.utils.alert(err.message, 'error'); promise.reject(); return false; }
            if (!result || result.length == 0) { cb.utils.alert('获取是否启用会员钱包参数失败', 'error'); promise.reject(); return false; }
            let enableWallet = result[0].storage_enable == 1;
            if (!enableWallet) { cb.utils.alert('未启用会员钱包', 'error'); promise.reject(); return false; }
            let memberInfo = viewmodel.getBillingContext('memberInfo')();
            if (!memberInfo || memberInfo.mid == null) {
              cb.utils.alert('请先录入会员！', 'error');
              return false;
            }
            var walletProxy = cb.rest.DynamicProxy.create({   // 查询当前会员钱包信息
              queryWallet: {
                url: '/memberwallet/query',
                method: 'POST'
              }
            })
            let memberId = memberInfo.mid;
            let storeId = cb.rest.AppContext.user.storeId;
            let productRows = viewmodel.getBillingContext('products')();
            let details = [];
            let getMoneyMap = viewmodel.getBillingContext('getMoneyMap')();
            let moneyMapGathering = getMoneyMap ? (getMoneyMap['Gathering'] ? getMoneyMap['Gathering'].value : 0) : 0;
            if(billingStatus === 'NoFormerBackBill' && moneyMapGathering <= 0) { // 非原单退货金额为负, 不能使用会员钱包支付
              cb.utils.alert('非原单退货应收金额为负, 不能使用会员钱包支付', 'error');
              promise.reject();
              return false;
            }
            if (moneyMapGathering <= 0) {    // 结算金额小于0时, 交给后端处理; = 0时, 不处理
              promise.resolve();
              return;
            }
            productRows.forEach(
              productRow => {
                // 原单退货可以销售商品, 结算金额大于0时, 仅计算销售商品可用钱包进行分摊; 结算金额小于0时, 交给后端处理
                // 结算金额 > 0, 记录数量大于0的行, 以及参与折扣计算的行(非狭义换货行)
                if (productRow.fQuantity > 0 && productRow.bCanDiscount && (!productRow.ikitType || productRow.ikitType == 1)) {
                  details.push({
                    "index": productRow.rowNumber,
                    "goods_id": productRow.product,
                    "goods_sku_id": productRow.productsku,
                    "goods_class_path": productRow.product_productClass_path,
                    "sum": productRow.fMoney
                  })
                }
              });
            var data = {
              "mid": memberId,
              "store": storeId,
              "store_tag_type": 1,  // 1:按商品分类
              "details": details
            }
            var params = { data: JSON.stringify(data) }

            walletProxy.queryWallet(params, (err, walletInfo) => {
              if (err) { cb.utils.alert(err.message); promise.reject(); return false; }
              if (!walletInfo || !walletInfo.wallet || walletInfo.wallet == 0) { cb.utils.alert('无可用会员钱包', 'error'); promise.reject(); return false; }
              let wallets = walletInfo.wallet;    // 全部可用钱包
              if (wallets.length == 1) {
                let totalAvailable = moneyMapGathering < wallets[0].available ? moneyMapGathering : wallets[0].available;
                objPaymode._showMoneyName = '可用余额';
                objPaymode._showMoney = cb.utils.getRoundValue(totalAvailable, cb.rest.AppContext.option.amountofdecimal);
                objPaymode._showEdit = false;
                objPaymode._readOnly = false;
                let gatheringvouchPaydetail = [];
                gatheringvouchPaydetail.push({
                  isSingleWallet: true,       // 标记是否单钱包
                  cCardCode: wallets[0].account_id,
                  fBalance: wallets[0].balance,
                  pament_available_balance: totalAvailable,
                  fAmount: null,
                  dPayTime: null,
                  iPaymentid: objPaymode.paymethodId,
                  iPaytype: objPaymode.paymentType,
                  _status: 'Insert'
                })
                objPaymode.gatheringvouchPaydetail = gatheringvouchPaydetail;

                // 设置支付金额默认大小
                let productSum = 0;
                details.forEach(
                  detail => {
                    if (wallets[0].suit_index.indexOf(detail.index) != -1)
                      productSum = Number(cb.utils.getRoundValue(productSum + detail.sum, cb.rest.AppContext.option.amountofdecimal))
                  }
                )
                let maxPayValue = Number(totalAvailable) < Number(productSum) ? Number(totalAvailable) : Number(productSum);
                objPaymode.value = cb.utils.getRoundValue(
                  Number(objPaymode.value) < Number(maxPayValue) ? Number(objPaymode.value) : Number(maxPayValue),
                  cb.rest.AppContext.option.amountofdecimal);
              } else if (wallets.length > 1) {
                if (billingStatus == "NoFormerBackBill" && moneyMapGathering < 0) {    // 非原单退不能使用会员多钱包支付
                  cb.utils.alert('非原单退不能使用会员多钱包支付', 'error');
                  promise.reject();
                  return false;
                }
                objPaymode._showMoneyName = undefined;
                objPaymode._showMoney = undefined;
                objPaymode._showEdit = true;
                objPaymode._readOnly = true;
                objPaymode.gatheringvouchPaydetail = null;

                // 设置支付金额默认大小
                let suit_indexs = [];
                let suit_set = [];
                wallets.forEach(
                  wallet => suit_indexs = suit_indexs.concat(wallet.suit_index)
                )
                suit_indexs.forEach(
                  index => {
                    if (suit_set.indexOf(index) == -1) {
                      suit_set.push(index);
                    }
                  }
                )
                let productSum = 0;
                details.forEach(
                  detail => {
                    if (suit_set.indexOf(detail.index) != -1)
                      productSum = Number(cb.utils.getRoundValue(productSum + detail.sum, cb.rest.AppContext.option.amountofdecimal))
                  }
                )
                let walletSum = 0;
                wallets.forEach(
                  wallet => {
                    walletSum = Number(cb.utils.getRoundValue(walletSum + Number(wallet.available), cb.rest.AppContext.option.amountofdecimal))
                  }
                )
                let maxPayValue = productSum < walletSum ? productSum : walletSum;
                objPaymode.value = cb.utils.getRoundValue(
                  Number(objPaymode.value) < maxPayValue ? Number(objPaymode.value) : maxPayValue,
                  cb.rest.AppContext.option.amountofdecimal);
              }
              objPaymode.walletInfo = walletInfo;
              obj[objIndex] = objPaymode;
              viewmodel.billingFunc.setPaymodes(obj);
              promise.reject();     // 自己设置paymode, 不需要走公共逻辑

              if (wallets.length > 1) {    // 多钱包需要弹窗
                if (true) {
                  var params = {
                    mode: 'add',
                    paymode: objPaymode,
                    walletInfo: walletInfo,
                    productRows: viewmodel.getBillingContext('products')()
                  };
                  var data = {
                    billtype: 'freeview',
                    billno: 'aa_memberwalletpay',
                    params
                  };
                  openWalletPayView(objPaymode, obj, data, viewmodel);
                }
              }
            })
          })
          return promise;
        }

        if (paymode && paymode.paymentType == 18) {            //储值卡支付
          if (viewmodel.getParams().bStorageCardRecharge || viewmodel.getParams().bMemberWalletRecharge) {
            cb.utils.alert('储值业务类型下不能使用储值卡支付', 'error');
            return false;
          }
          let billingStatus = viewmodel.getBillingContext('billingStatus')();
          if (billingStatus == 'PresellBill') {
            let bDeliveryModify = viewmodel.getBillingContext('bDeliveryModify', 'reserve')();
            if (bDeliveryModify == true) {
              cb.utils.alert('预订且“交货时可修改商品”为是, 不允许储值卡结算', 'error');
              return false;
            }
          }
          if (billingStatus == 'Shipment') {   // 预定交货业务类型信息需要从单据头取
            let originBillHeader = viewmodel.getBillingContext('originBillHeader')();
            if (originBillHeader && originBillHeader.bDeliveryModify == false) {
              cb.utils.alert('预订交货且“交货时可修改商品”为否, 不允许储值卡结算', 'error');
              return false;
            }
          }
          if (!cb.rest.AppContext.option.isUseStorageCard) {
            cb.utils.alert('该门店未启用储值卡业务', 'error');
            return false;
          }

          let { setPaymodes, formatMoney } = viewmodel.billingFunc;    // setPaymodes 设置支付方式方法
          // 判断是否启用密码校验
          var proxy = cb.rest.DynamicProxy.create({
            ensure: {
              url: '/storedValueCard/queryCommonSet',
              method: 'POST'
            }
          });
          let data = JSON.stringify([{ model_id: "MM", key: "storage_card_pwd" }]);
          var params = { data: data }
          proxy.ensure(params, (err, result) => {
            if (err) { cb.utils.alert(err.message, 'error'); return false; }
            if (!result || result.length == 0) { cb.utils.alert('获取是否密码校验参数失败', 'error'); return false; }
            let enablePwd = result.find(item => item.key == 'storage_card_pwd').value.toString() != '0';
            paymodes = viewmodel.getBillingContext('paymodes')();
            paymode = paymodes[key];
            var params = {
              mode: 'add',
              enablePwd: enablePwd,
              paymode: paymode,
            };
            var data = {
              billtype: 'freeview',
              billno: 'aa_storagecardpay',
              params
            };
            openCardPayView(paymode, paymodes, data, viewmodel);
          })
        }

        return true;
      })

      /* 点击快捷结算时根据网络状态判断是否结算 */
      viewmodel.on('beforeShortCutSetlle', function (args) {
        let { lineConnection, item } = args;
        let getMoneyMap = viewmodel.getBillingContext('getMoneyMap')();
        //离线状态下不允许使用储值卡快捷结算
        if (cb.rest.interMode === 'touch' && !lineConnection && item.paymentType === 18) {
          cb.utils.alert('当前网络不可用，不能使用此功能', 'error');
          return false;
        }
        if (getMoneyMap && getMoneyMap['Gathering'] && getMoneyMap['Gathering'].value < 0) { //收款金额为负时
          cb.utils.alert('该状态下不能使用快捷结算！', 'error');
          return false;
        }
        //离线单据状态下预定相关的业务不允许结算
        if (!lineConnection) {
          let presellStatus = viewmodel.getBillingContext('billingStatus')();
          let billingStatusList = ['PresellBill', 'Shipment', 'PresellBack'];
          if (billingStatusList.includes(presellStatus)) {
            cb.utils.alert('当前处于离线状态,不允许结算保存', "error");
            return false;
          }
        }
        return true;
      })

      /* 点击快速结算更新卡券结算方式金额 sunhyu */
      viewmodel.on('afterFinalShortCutSettle', function (args) {
        let { paymethodId, result } = args;
        let coupons = viewmodel.getBillingContext('coupons', 'product')();
        if (coupons) {
          let amountofdecimal = cb.rest.AppContext.option.amountofdecimal;
          let fCouponPaymentMoney = 0.0;
          // let fHasPayedCouponMoney = 0.0;
          // let fDiffCouponMoney = 0.0;
          let { formatMoney } = viewmodel.billingFunc;
          let payment = viewmodel.getBillingContext('payment', 'paymode')();
          let flag = false;
          for (let i = 0; i < coupons.length; i++) {
            if (coupons[i].dl_paytype == 1) {
              //收款方式卡券且影响销售金额
              if(coupons[i].iSaleDiscountType == 1){
                coupons[i].fMoney = cb.utils.getRoundValue(1 * coupons[i].fMoney - 1 * coupons[i].affectDiscountMoney, amountofdecimal);
              }
              flag = true
              fCouponPaymentMoney = fCouponPaymentMoney + 1 * coupons[i].fMoney;
              let paymentMethodId = coupons[i].paymentMethodId;
              let paymode = payment[paymentMethodId];
              if (paymode) {
                // let key = paymode.paymethodId;
                paymode.show = true;
                if (cb.utils.isEmpty(paymode.value)) {
                  paymode.value = cb.utils.getRoundValue(coupons[i].fMoney, amountofdecimal);
                } else {
                  paymode.value = cb.utils.getRoundValue(1 * paymode.value + 1 * coupons[i].fMoney, amountofdecimal);
                }
                paymode._readOnly = true;
                paymode._noDelete = true;

                //收款单支付孙表
                let gatheringvouchPaydetail = [];
                if (paymode.gatheringvouchPaydetail && paymode.gatheringvouchPaydetail.length > 0) {
                  gatheringvouchPaydetail = paymode.gatheringvouchPaydetail;
                }
                let dPayTime = new Date().format('yyyy-MM-dd hh:mm:ss');
                gatheringvouchPaydetail.push({
                  cCardCode: coupons[i].cGiftTokensn,
                  fAmount: cb.utils.getRoundValue(coupons[i].fMoney, amountofdecimal),
                  dPayTime: dPayTime,
                  iPaymentid: paymode.paymethodId,
                  iPaytype: paymode.paymentType,
                  _status: 'Insert'
                });
                paymode.gatheringvouchPaydetail = gatheringvouchPaydetail;
              } else {
                cb.utils.alert('优惠券[' + coupons[i].cGiftTokenname + ']未找到卡券对应结算方式，请设置卡券门店收款方式！', 'error');
                return false;
              }
            }
          }
          if (flag) { // 卡券作为支付方式，已经将金额更新好
            payment[paymethodId].show = true
            // let calCouponMoney = cb.utils.getRoundValue(fCouponPaymentMoney - fHasPayedCouponMoney, amountofdecimal);
            if(result - fCouponPaymentMoney < 0){
              cb.utils.alert('应收金额不能小于卡券结算金额，请检查！', 'error');
              return false;
            }
            payment[paymethodId].value = cb.utils.getRoundValue(result - fCouponPaymentMoney, amountofdecimal);
            let shortCutOpen = viewmodel.getBillingContext('shortCutOpen', 'paymode')
            viewmodel.billingFunc.setReduxState({
              paymodes: payment,
              shortCutOpen: shortCutOpen + 1
            }, 'paymode')
            return false
          }
        }
      })

      /* 结算界面带出默认卡券结算方式 sunhyu */
      viewmodel.on('afterFinalDefaultSettle', function (args) {
        let { hidePaymodes, obj } = args;
        let returnResult = true;
        let coupons = viewmodel.getBillingContext('coupons', 'product')();
        if (coupons) {
          let amountofdecimal = cb.rest.AppContext.option.amountofdecimal;
          let fCouponPaymentMoney = 0.0;
          // let fHasPayedCouponMoney = 0.0;
          // let fDiffCouponMoney = 0.0;
          let { formatMoney } = viewmodel.billingFunc;
          let payment = viewmodel.getBillingContext('payment', 'paymode')();
          let flag = false;
          for (let i = 0; i < coupons.length; i++) {
            if (coupons[i].dl_paytype == 1) {
              //收款方式卡券且影响销售金额
              if(coupons[i].iSaleDiscountType == 1){
                coupons[i].fMoney = cb.utils.getRoundValue(1 * coupons[i].fMoney - 1 * coupons[i].affectDiscountMoney, amountofdecimal);
              }
              flag = true
              fCouponPaymentMoney = fCouponPaymentMoney + 1 * coupons[i].fMoney;
              let paymentMethodId = coupons[i].paymentMethodId;
              let paymode = payment[paymentMethodId];
              if (paymode) {
                // let key = paymode.paymethodId;
                paymode.show = true;
                if (cb.utils.isEmpty(paymode.value)) {
                  paymode.value = cb.utils.getRoundValue(coupons[i].fMoney, amountofdecimal);
                } else {
                  paymode.value = cb.utils.getRoundValue(1 * paymode.value + 1 * coupons[i].fMoney, amountofdecimal);
                }
                paymode._readOnly = true;
                paymode._noDelete = true;

                //收款单支付孙表
                let gatheringvouchPaydetail = [];
                if (paymode.gatheringvouchPaydetail && paymode.gatheringvouchPaydetail.length > 0) {
                  gatheringvouchPaydetail = paymode.gatheringvouchPaydetail;
                }
                let dPayTime = new Date().format('yyyy-MM-dd hh:mm:ss');
                gatheringvouchPaydetail.push({
                  cCardCode: coupons[i].cGiftTokensn,
                  fAmount: cb.utils.getRoundValue(coupons[i].fMoney, amountofdecimal),
                  dPayTime: dPayTime,
                  iPaymentid: paymode.paymethodId,
                  iPaytype: paymode.paymentType,
                  _status: 'Insert'
                });
                paymode.gatheringvouchPaydetail = gatheringvouchPaydetail;
              } else {
                cb.utils.alert('优惠券[' + coupons[i].cGiftTokenname + ']未找到卡券对应结算方式，请设置卡券门店收款方式！', 'error');
                return false;
              }
            }
          }
          // obj.result = formatMoney(obj.result - fCouponPaymentMoney).toFixed(2);
          if (flag) { // 卡券作为支付方式，已经将金额更新好
            let defaultPaymodeId = ''
            for (let attr in payment) {
              if (payment[attr].isDefault)
                defaultPaymodeId = attr
            }
            if (!defaultPaymodeId) {
              cb.utils.alert({
                title: '请先设置默认的支付方式',
                type: 'error'
              })
              return false
            }
            payment[defaultPaymodeId].show = true
            // let calCouponMoney = cb.utils.getRoundValue(fCouponPaymentMoney - fHasPayedCouponMoney, amountofdecimal);
            if(obj.result - fCouponPaymentMoney < 0){
              cb.utils.alert('应收金额不能小于卡券结算金额，请检查！', 'error');
              return false;
            }
            payment[defaultPaymodeId].value = cb.utils.getRoundValue(obj.result - fCouponPaymentMoney, amountofdecimal);
            viewmodel.billingFunc.setReduxState({
              visible: true,
              currentFocus: defaultPaymodeId,
              paymodes: payment,
            }, 'paymode')
            returnResult = false;
          }
        }

        //原单退货控制卡券结算方式不可编辑
        let cBillingStatus = viewmodel.getBillingContext('billingStatus')();
        if (cBillingStatus == 'FormerBackBill') {
          let billPaymodes = viewmodel.getBillingContext('billPaymodes', 'paymode')();
          let flag = false;
          let defaultPaymodeId = '';
          let walletFlag = null;    // 原单退货部分退, 判断只使用会员钱包的钱够不够
          for (let attr in billPaymodes) {
            let paymode = billPaymodes[attr];
            if (paymode.paymentType == 21 && paymode.value) {
              flag = true;
              paymode._readOnly = true;
              paymode._noDelete = true;
            }else if(paymode.paymentType == 5 && paymode.value) { // 会员钱包部分退货计算金额
              walletFlag = true;
              let backBillInfo = viewmodel.billingFunc.getOriginBill('backBillInfo');
              let backVouchDetails = backBillInfo.rm_retailvouch.retailVouchDetails;
              flag = true;
              paymode._readOnly = true; // 不可编辑
              paymode._noDelete = true; // 不可删除
              let retailVouchDetails = viewmodel.getBillingContext('products')();
              let walletPaySum = 0;
              retailVouchDetails.forEach(item => {
                let backItem = backVouchDetails.find(backItem => backItem.productsku == item.productsku);
                let payDetails = backItem.retailVouchCardDetails;
                let walletPay = 0;
                if (payDetails && payDetails.length > 0) {
                  payDetails.forEach(detail => {
                    if (detail.iPayType == 5) {
                      let fSettMoney = 0;
                      let fOriCoMoney = 0;
                      let fDiscountMoney = 0;
                      let fCoMoney = 0;
                      fSettMoney = viewmodel.billingFunc.formatMoney(detail.fSettMoney);
                      fOriCoMoney = viewmodel.billingFunc.formatMoney(detail.fOriCoMoney);
                      fDiscountMoney = viewmodel.billingFunc.formatMoney(detail.fDiscountMoney);
                      fCoMoney = viewmodel.billingFunc.formatMoney(detail.fCoMoney);
                      walletPay = viewmodel.billingFunc.formatMoney(walletPay + fSettMoney - fCoMoney);
                    }
                  })
                }
                let thispay = 0;
                if(Math.abs(walletPay) < Math.abs(item.fMoney)){
                  thispay = -1 * walletPay;
                  walletFlag &= false;  // 一个商品行不满足就不能只用会员钱包
                } else {
                  thispay = item.fMoney;
                  walletFlag &= true;
                }
                walletPaySum = viewmodel.billingFunc.formatMoney(walletPaySum + thispay);
              })
              paymode.value = cb.utils.getRoundValue(walletPaySum, cb.rest.AppContext.option.amountofdecimal);
            } else if (paymode.paymentType != 21 && paymode.paymentType != 5 && paymode.value) {
              defaultPaymodeId = paymode.paymethodId;
            }
          }

          // 190724 王久龄 原单退货部分退 如果会员钱包的钱已经够了, 就不显示其他的支付方式了
          if(walletFlag !== null && walletFlag){
            for (let attr in billPaymodes) {
              let paymode = billPaymodes[attr];
              if (paymode.paymentType == 5 && paymode.value) {
              } else {
                paymode.show = false;
                paymode.value = cb.utils.getRoundValue(0, cb.rest.AppContext.option.amountofdecimal);
              }
            }
          }
          //原单退货控制结算结算界面带入的值不能为负(有澳门币情况下找零情况默认会带入正数)（20190805袁老师让去掉）
          // let isChangePaymodesValue = false;
          // let showDefaultPaymode = 0;
          // for(let item in billPaymodes){
          //   let paymode = billPaymodes[item];
          //   if(paymode.value && (1*paymode.value > 0)){
          //     paymode.value = viewmodel.billingFunc.formatMoney((-1)*paymode.value).toFixed(cb.rest.AppContext.option.amountofdecimal);
          //     isChangePaymodesValue = true;
          //     showDefaultPaymode = item;
          //   }
          // }
          // if(isChangePaymodesValue){//如果改过paymodes中的value值，更新paymodes
          //   viewmodel.billingFunc.setReduxState({
          //     visible: true,
          //     currentFocus:showDefaultPaymode,
          //     paymodes: billPaymodes,
          //   }, 'paymode')
          //   returnResult = false;
          // }

          if (flag) {
            viewmodel.billingFunc.setReduxState({
              visible: true,
              currentFocus: defaultPaymodeId,
              paymodes: billPaymodes,
            }, 'paymode')
            returnResult = false;
          }
        }

        //线上商城退款是否走自己修改后的paymodes，调用此方法
        var returnMoneyPaymodes = function(billPaymodes,paymodeArr,isOnlineProduct,returnResult){
          for (let i in billPaymodes) { //遍历当前所有的支付方式（map遍历）
            for (let j = 0; j < paymodeArr.length; j++) {
              let paymentMethodId = 1 * paymodeArr[j].paymethodId;
              if (i == paymentMethodId) {
                billPaymodes[paymentMethodId] = paymodeArr[j];
              }
            }
          }
          if (isOnlineProduct) {
            viewmodel.billingFunc.setReduxState({
              visible: true,
              paymodes: billPaymodes,
              // currentFocus: showArr[0] + '',
            }, 'paymode')
            returnResult = false;
          }
        }

        //结算窗口，根据商城接口返回的数据，处理退款金额
        //returnMoneyStatus 调用商城接口时的退款情况  1；只有线上退款  2：线上线下两种退款都有
        var processReturnMoney = function (returnMoneyStatus, params, result) {
          if (result.productPayDetail) { //商城返回的具体商品行各种支付方式分摊额后，需要将钱包类型的支付方式回写到零售单子表(负数)
            for (let i = 0; i < result.productPayDetail.length; i++) {
              for (let j = 0; j < params.productRows.length; j++) {
                if (result.productPayDetail[i].detailid == params.productRows[j].imalldetailid) {
                  if (result.productPayDetail[i].storagecard) { //商城返回的商品行中具有钱包类型分摊额的
                    params.productRows[j].fCardApportion = viewmodel.billingFunc.formatMoney((-1) * result.productPayDetail[i].storagecard);
                    params.fCardApportionSum = params.fCardApportionSum + params.productRows[j].fCardApportion;
                  }
                  if (result.productPayDetail[i].storageDiscount) { //商城返回的商品行中具有钱包折扣分摊额的
                    params.productRows[j].fCardDisApportion = viewmodel.billingFunc.formatMoney((-1) * result.productPayDetail[i].storageDiscount);
                    params.fCardDisApportionSum = params.fCardDisApportionSum + params.productRows[j].fCardDisApportion;
                  }
                }
              }
            }
          }
          if (result.paymethods_money) { //线上支付方式结算窗口赋值根据商城服务返回的分摊金额进行赋值
            for (let i = 0; i < params.paymodeArr.length; i++) {
              for (let j = 0; j < result.paymethods_money.length; j++) {
                if (params.paymodeArr[i].paymethodId == result.paymethods_money[j].id) {
                  params.paymodeArr[i].value = viewmodel.billingFunc.formatMoney((-1) * result.paymethods_money[j].moneySum).toFixed(cb.rest.AppContext.option.amountofdecimal);
                  params.paymodeArr[i].isMallReturnValue = true; //冗余字段，用来判断结算方式是否按商城返回的分摊值赋值，若没有则需要置0
                  if (result.paymethods_money[j].cOnlinePaymethod == "storagecard") {
                    let backMallStoragecard_0 = { //封装数据，用来更新收款单子表中的钱包类型的分摊
                      fCardApportionSum: params.fCardApportionSum,
                      fCardDisApportionSum: params.fCardDisApportionSum,
                      cOnlinePaymethod: result.paymethods_money[j].cOnlinePaymethod,
                      paymethodId: result.paymethods_money[j].id,
                      paymethodName: result.paymethods_money[j].name
                    }
                    viewmodel.getParams().backMallStoragecard = backMallStoragecard_0;
                  }
                }
              }
              if (params.paymodeArr[i].isMallReturnValue != true) {
                params.paymodeArr[i].value = viewmodel.billingFunc.formatMoney((-1) * "0.00").toFixed(cb.rest.AppContext.option.amountofdecimal);
              }
            }
          }
          if(returnMoneyStatus == 1){
            for (let i = 0; i < params.paymodeArr_billing; i++) { //如果没有线下退款，则结算窗口，线下收款方式中的值需要默认置0
              if (!cb.utils.isEmpty(params.paymodeArr_billing[i].value)) {
                params.paymodeArr_billing[i].value = viewmodel.billingFunc.formatMoney((-1) * "0.00").toFixed(cb.rest.AppContext.option.amountofdecimal);
              }
            }
          }else if(returnMoneyStatus == 2){
            if(params.paymodeArr_billing.length == 1){ //如果线下只有一种结算方式，则结算窗口，线下退款金额需要维护为正确退款金额
              let value = (-1) * params.paymodeArr_billing[0].value;
              // eslint-disable-next-line no-undef
              if(fBillingBackMoney <= value){
                // eslint-disable-next-line no-undef
                params.paymodeArr_billing[0].value = viewmodel.billingFunc.formatMoney((-1)*fBillingBackMoney).toFixed(cb.rest.AppContext.option.amountofdecimal);
              }
            }
          }
          for (let i = 0; i < params.productRows.length; i++) {
            if (params.productRows[i].fMoneyChange == true) {
              params.productRows[i].fMoney = viewmodel.billingFunc.formatMoney((-1) * params.productRows[i].fMoney); //退品行的商品行需要退款，金额需要变为负数,然后再转回去，不影响原来的数据
              params.productRows[i].fMoneyChange = false;
            }
            if (params.productRows[i].isReturnProduct) { // 如果是捞出来的退品行，则不能更新到标题行，只参与计算即可
              params.retailVouchReturnDetailsNew.push(params.productRows[i]);
              viewmodel.getParams().retailVouchReturnDetailsNew = params.retailVouchReturnDetailsNew;
              params.productRows.splice(i, 1);
              i = i - 1;
            }
          }
        }

        //处理线上商品退款金额的收款方式
        let billingStatus = viewmodel.getBillingContext('billingStatus')();
        let getMoneyMap = viewmodel.getBillingContext('getMoneyMap')();
        let presellChange = viewmodel.getParams().presellChange;
        let originBillHeader = viewmodel.getBillingContext('originBillHeader')();
        if ((cb.rest.AppContext.user.industry == 20) && (getMoneyMap && getMoneyMap['Gathering'] && getMoneyMap['Gathering'].value < 0)) { //收款金额为负时
          if (billingStatus == 'FormerBackBill' || (billingStatus == 'Shipment' && (presellChange != true)) || (billingStatus == 'PresellBack')) { //原单退、交货、退订
            let onlineBackProducts = [];   //线上商品行(需退款的)
            let billingBackProducts = [];  //线下商品行(需退款的)
            let productRows = JSON.parse(JSON.stringify(viewmodel.getBillingContext('products')()));
            //原单退货情况，捞出原单退品行，添加到本单需要退品行中
            if (viewmodel.getParams().retailVouchReturnDetails) {
              let retailVouchReturnDetails = JSON.parse(JSON.stringify(viewmodel.getParams().retailVouchReturnDetails));
              for (let i = 0; i < retailVouchReturnDetails.length; i++) {
                if (retailVouchReturnDetails[i].iGroupNum == 1 && (retailVouchReturnDetails[i].fMoney != retailVouchReturnDetails[i].fCoMoney)) { //如果是线上退品的行，原单退时需要添加到当前商场退款商品中
                  retailVouchReturnDetails[i].isReturnProduct = true; //表示是原单退货时捞出的商品
                  productRows.push(retailVouchReturnDetails[i]);
                }
              }
            }
            let { formatMoney } = viewmodel.billingFunc;
            let billPaymodes = viewmodel.getBillingContext('billPaymodes', 'paymode')();
            let paymodeArr = [];//线上收款方式
            let paymodeArr_billing = [];//线下收款方式
            let fOnlineBackMoney = 0.0; //线上需要退款的金额合计
            let fBillingBackMoney = 0.0; //线下需要退款的金额合计
            let isOnlineProduct = false; //是否有线上商品行标记
            let preBillingGatheringMoney = 0; //线下已收款金额合计
            let preOnlineGatheringMoney = 0; //线上已收款金额合计
            let fCardApportionSum = 0; //线上钱包类型分摊额合计
            let fCardDisApportionSum = 0; //钱包折扣分摊额合计
            let cbillNo = originBillHeader.cbillNo;
            let retailVouchReturnDetailsNew = []; //用来存放从原单新捞出来的退品行
            for (let i = 0; i < productRows.length; i++) { //线上、线下退款商品行分别统计
              if (productRows[i].iReturnStatus == 2 && (productRows[i].fMoney > 0)) {
                productRows[i].fMoney = formatMoney((-1) * productRows[i].fMoney); //退品行的商品行需要退款，金额需要变为负数
                productRows[i].fMoneyChange = true;    //退品行如果做过金额转负的操作，则在逻辑处理完后在转回去，不影响原来数据
              }
              if (productRows[i].fMoney < 0) {
                if (productRows[i].iGroupNum == 1 && (productRows[i].ikitType != 2)) { //线上商品行,子件商品不参与统计
                  onlineBackProducts.push(productRows[i]);
                  isOnlineProduct = true;
                } else if ( (productRows[i].ikitType != 2) && (productRows[i].iGroupNum == 0 || (productRows[i].iGroupNum >= 100))) { //线下商品行，子件商品不参与统计
                  billingBackProducts.push(productRows[i]);
                }
              }
            }
            for (let i in billPaymodes) { //遍历当前所有的支付方式（map遍历）
              let paymode = billPaymodes[i];
              if (paymode.paymentType == 20) { // 线上收款方式
                paymodeArr.push(paymode);
                //线上收款方式操作控制
                billPaymodes[i].show = true;
                billPaymodes[i]._readOnly = true;
                billPaymodes[i]._noDelete = true;
                billPaymodes[i]._onlyShow = true;
              }else if(!cb.utils.isEmpty(paymode.value)){ //线下收款方式有值的进行统计
                paymodeArr_billing.push(paymode);
                preBillingGatheringMoney = preBillingGatheringMoney + 1*paymode.value;
              }
            }
            for (let i = 0; i < onlineBackProducts.length; i++) {
              fOnlineBackMoney = fOnlineBackMoney + 1 * onlineBackProducts[i].fMoney; //线上商品行退款金额
            }
            for (let i = 0; i < billingBackProducts.length; i++) {
              fBillingBackMoney = fBillingBackMoney + 1 * billingBackProducts[i].fMoney;//线下商品行退款金额
            }
            //分配线上线下退款金额
            let fGatheringMoney = (-1) * getMoneyMap['Gathering'].value; //应退金额（用正数进行计算）
            let fGatheringMoney_online = fGatheringMoney;
            let fGatheringMoney_billing = fGatheringMoney;
            if (fOnlineBackMoney < 0 && (fBillingBackMoney >= 0)) { //只有线上退款，处理退款金额分摊到退款的线上商品行
              for (let i = 0; i < onlineBackProducts.length; i++) {
                let fMoney = (-1) * onlineBackProducts[i].fMoney;
                if (fGatheringMoney <= fMoney) { //应退金额比商品金额小，直接将应退金额分摊到当前商品行上，应退金额置0
                  onlineBackProducts[i].fCoMoney = formatMoney(fGatheringMoney);
                  fGatheringMoney = 0;
                } else {
                  onlineBackProducts[i].fCoMoney = formatMoney(fMoney);  //维护退货金额字段（正数）
                  fGatheringMoney = formatMoney(fGatheringMoney - fMoney);
                }
              }
              //调商城接口处理线上退款分摊金额
              let proxy = cb.rest.DynamicProxy.create({
                query: {
                  url: '/bill/ref/caculatReturnMoney',
                  method: 'POST'
                }
              });
              let parms = {
                cOrderNo: cbillNo,
                details: onlineBackProducts
              };
              let promise = new cb.promise();
              proxy.query(parms, (err, result) => {
                if (err) {
                  cb.utils.alert(err.message, 'error');
                  promise.reject();
                }
                if (result != undefined) { //根据商城服务返回的结果，处理结算窗口线上退款赋值
                  let params ={productRows,fCardApportionSum,fCardDisApportionSum,paymodeArr,paymodeArr_billing,retailVouchReturnDetailsNew};
                  processReturnMoney(1, params, result);
                  viewmodel.billingFunc.updateProducts(productRows); //更新线上退款的商品行
                  //更新billPaymodes
                  returnMoneyPaymodes(billPaymodes,paymodeArr,isOnlineProduct,returnResult);
                  promise.reject();
                }
              });
              return promise;
            } else if (fOnlineBackMoney < 0 && (fBillingBackMoney < 0)) { //线上线下均有退款，优先退线下退款，剩余的分摊到线上退款
              //  fOnlineBackMoney = (-1) * fOnlineBackMoney;
              fBillingBackMoney = (-1) * fBillingBackMoney;
              preBillingGatheringMoney = (-1) * preBillingGatheringMoney;
              if(fBillingBackMoney > preBillingGatheringMoney) fBillingBackMoney = preBillingGatheringMoney;
              fGatheringMoney = (-1) * getMoneyMap['Gathering'].value;
              if (fGatheringMoney <= fBillingBackMoney) { //如果实际退款小于线下应退款，则全退到线下收款方式，线上收款方式不退
                for (let i = 0; i < paymodeArr.length; i++) { //线上收款方式，结算窗口赋值为0
                  paymodeArr[i].value = formatMoney((-1) * "0.00").toFixed(cb.rest.AppContext.option.amountofdecimal);
                }
                if(paymodeArr_billing.length == 1){ //如果线下只有一种结算方式，则结算窗口，线下退款金额需要维护为正确退款金额
                  let value = (-1) * paymodeArr_billing[0].value;
                  if(fGatheringMoney <= value){
                    paymodeArr_billing[0].value = formatMoney((-1)*fGatheringMoney).toFixed(cb.rest.AppContext.option.amountofdecimal);
                  }
                }
              } else if (fGatheringMoney > fBillingBackMoney) { //先满足线下的退款，剩余部分，分摊到线上退款
                fGatheringMoney_online = fGatheringMoney - fBillingBackMoney; //退给线下后剩余的部分退到线上
                fGatheringMoney = fGatheringMoney_online;
                for (let i = 0; i < onlineBackProducts.length; i++) {
                  let fMoney = (-1) * onlineBackProducts[i].fMoney;
                  if (fGatheringMoney <= fMoney) { //应退金额比商品金额小，直接将应退金额分摊到当前商品行上，应退金额置0
                    onlineBackProducts[i].fCoMoney = formatMoney(fGatheringMoney);
                    fGatheringMoney = 0;
                  } else {
                    onlineBackProducts[i].fCoMoney = formatMoney(fMoney);
                    fGatheringMoney = fGatheringMoney - fMoney;
                  }
                }
                //调商城接口处理线上退款分摊金额
                let proxy = cb.rest.DynamicProxy.create({
                  query: {
                    url: '/bill/ref/caculatReturnMoney',
                    method: 'POST'
                  }
                });
                let parms = {
                  cOrderNo: cbillNo,
                  details: onlineBackProducts
                };
                let promise = new cb.promise();
                proxy.query(parms, (err, result) => {
                  if (err) {
                    cb.utils.alert(err.message, 'error');
                    promise.reject();
                  }
                  if (result != undefined) { //根据商城服务返回的结果，处理结算窗口线上退款赋值
                    let params ={productRows,fCardApportionSum,fCardDisApportionSum,paymodeArr,paymodeArr_billing,retailVouchReturnDetailsNew};
                    processReturnMoney(2, params, result);
                    viewmodel.billingFunc.updateProducts(productRows); //更新线上退款的商品行
                    //更新billPaymodes
                    returnMoneyPaymodes(billPaymodes,paymodeArr,isOnlineProduct,returnResult);
                    promise.reject();
                  }
                });
                return promise;
              }
            }
            for(let i = 0; i < productRows.length; i++){
              if (productRows[i].fMoneyChange == true) {
                productRows[i].fMoney = formatMoney((-1) * productRows[i].fMoney); //退品行的商品行需要退款，金额需要变为负数,然后再转回去，不影响原来的数据
                productRows[i].fMoneyChange = false;
              }
              if(productRows[i].isReturnProduct){ // 如果是捞出来的退品行，则不能更新到标题行，只参与计算即可
                retailVouchReturnDetailsNew.push(productRows[i]);
                viewmodel.getParams().retailVouchReturnDetailsNew = retailVouchReturnDetailsNew;
                productRows.splice(i, 1);
                i = i - 1;
              }
            }
            if (fOnlineBackMoney < 0) {
              viewmodel.billingFunc.updateProducts(productRows); //更新线上退款的商品行
            }
            //更新billPaymodes
            returnMoneyPaymodes(billPaymodes,paymodeArr,isOnlineProduct,returnResult);
          }
        }

        //预订变更收款为负时默认带入0
        if (presellChange && (getMoneyMap && getMoneyMap['Gathering'] && getMoneyMap['Gathering'].value < 0)) { //预订变更结算前，处理带入结算界面的默认值,应收小于0时
          let billPaymodes = viewmodel.getBillingContext('billPaymodes', 'paymode')();
          let paymentMethodId = 0;
          let paymodeArr = [];
          for (let i in billPaymodes) { //遍历当前所有的支付方式（map遍历）
            let paymode = billPaymodes[i];
            if (!cb.utils.isEmpty(billPaymodes[i].value)) {
              billPaymodes[i].value = '0.00';
            }
            if (paymode.paymentType == 1) { //现金收款方式
              paymodeArr.push(paymode);
            } else {
              // billPaymodes[i].show = false;//其他收款方式不显示
            }

          }
          let paymode = null;
          let showArr = [];
          if (paymodeArr.length > 0) {
            paymentMethodId = 1 * paymodeArr[0].paymethodId;
            paymode = billPaymodes[paymentMethodId];
          }
          showArr = [paymentMethodId];
          viewmodel.billingFunc.setReduxState({
            visible: true,
            paymodes: billPaymodes,
            //  currentFocus: showArr[0] + '',
          }, 'paymode')
          returnResult = false;
        }

        //哆啦宝支付
        if(cb.rest.interMode === 'touch'){
          let needSendPrice = false;
          let paymentData = viewmodel.getBillingContext('payment', 'paymode')();
          for (let item in paymentData) {
            if (paymentData[item].isDefault && paymentData[item].paymentType == 25){
              needSendPrice = true;
            }
          }
          if(needSendPrice){
            sendPrice(obj.result);
          }
        }

        return returnResult;
      });

      /* 关闭结算界面清空卡券结算方式 sunhyu */
      viewmodel.on('beforePayModalClose', function (args) {
        // let hidePaymodes = viewmodel.getBillingContext('hidePaymodes','paymode')();
        // hidePaymodes = {};
        viewmodel.billingFunc.setReduxState({ hidePaymodes: {} }, 'paymode')
      });

      /*点击结算校验卡券号弹窗*/
      viewmodel.on('afterCheckDetail', function (args) {
        let retailVouchDetails = viewmodel.getBillingContext('products')();
        let errorInfo = [];
        if (viewmodel.getParams().bCardCoupon) {
          for (var i = 0; i < retailVouchDetails.length; i++) {
            let retailVouchDetail = retailVouchDetails[i];
            if (retailVouchDetail.productrealProductAttributeType == 2 && cb.utils.isEmpty(retailVouchDetail.cCouponsn) && cb.utils.isEmpty(retailVouchDetail.beginCouponsn) && cb.utils.isEmpty(retailVouchDetail.endCouponsn)) {
              errorInfo.push(retailVouchDetail);
              cb.utils.alert('卡券商品['+retailVouchDetail.product_cName+']请输入卡券号！', 'error');
              viewmodel.billingFunc.showEdit(true, errorInfo);
              args.canOpen = false
              return false;
            }
          }
        } else if (viewmodel.getParams().bCardCouponBack || viewmodel.getParams().bCardCouponOriginBack) {
          for (var i = 0; i < retailVouchDetails.length; i++) {
            let retailVouchDetail = retailVouchDetails[i];
            if (!cb.utils.isEmpty(retailVouchDetail.cCouponId) && cb.utils.isEmpty(retailVouchDetail.cCouponsn) && cb.utils.isEmpty(retailVouchDetail.beginCouponsn) && cb.utils.isEmpty(retailVouchDetail.endCouponsn)) {
              errorInfo.push(retailVouchDetail);
              cb.utils.alert('卡券商品['+retailVouchDetail.product_cName+']请输入卡券号！', 'error');
              viewmodel.billingFunc.showEdit(true, errorInfo);
              args.canOpen = false
              return false;
            }
          }
        }

        // if(errorInfo.length > 0){
        //   cb.utils.alert('卡券商品请输入卡券号！', 'error');
        //   viewmodel.billingFunc.showEdit(true, errorInfo);
        //   return false;
        // }

        return true;
      });

      /* 结算界面删除结算方式 */
      viewmodel.on('beforeDeletePaymode', function (args) {
        let { paymode } = args;
        if (paymode && paymode.paymentType == 5) {  //会员钱包
          args.obj.gatheringvouchPaydetail = null;
        }
        if (paymode && paymode.paymentType == 18) {   // 实体储值卡
          args.obj.gatheringvouchPaydetail = null;
        }
      })
      // 房间详情带出商品与会员
      viewmodel.on("afterLoadData", function () {
        var roomdetail = cb.cache.get("roomdetail");
        cb.cache.set("roomdetail", null);
        if (roomdetail != undefined && roomdetail != null) {
          if (roomdetail != "reserve") {
            var retail = roomdetail;
            var details = retail.retailVouchDetails
            for (var i = 0; i < details.length; i++) {
              var ts = new Date().valueOf();
              details[i].productsku
                ? details[i].key = `${details[i].product}|${details[i].productsku}_${ts}`   // sku
                : details[i].key = `${details[i].product}_${ts}`;                       // 商品
              details[i].iRelatingRetailDetailId = details[i].id;
              if (!details[i].productsku) {
                // eslint-disable-next-line no-undef
                billingStatus == 'PresellBack' ? details[i].specsBtn = false : details[i].specsBtn = true;
              }
              if (details[i].productsku && details[i].free1 && details[i].free2) {
                details[i].propertiesValue = "时段:"+details[i].free1+";房型:"+details[i].free2+";";
                details[i].specs = details[i].propertiesValue;
                details[i].specsBtn = false;
              }
              if (details[i].iReturnStatus != undefined && details[i].iReturnStatus == 2) {
                details[i].iproducticon = '2';
              }
              if (details[i].ikitType != undefined && details[i].ikitType == 1) {
                details[i].iproducticon = '1';
              }
            }
            retail.retailVouchDetails = details
            retail.iRelatingRetailid = retail.id;
            if (retail.iPresellState != 3) {
              viewmodel.getParams().presellChange = true;
            }
            let resultData = {
              "rm_retailvouch": retail,
              "rm_gatheringvouch": {}
            };
            viewmodel.billingFunc.handlePresellBillData(resultData, resultData, 'Shipment');
            let MinPercentGiveMoneyPre = resultData.rm_retailvouch.iBusinesstypeid_MinPercentGiveMoneyPre;
            viewmodel.billingFunc.setReduxState({
              MinPercentGiveMoneyPre: MinPercentGiveMoneyPre + ''
            }, 'uretailHeader')
          }
        }
      })
      /*预订交货弹窗 */
      viewmodel.on('Shipment', function (wrapFunc, transfer) {
        var products = viewmodel.getBillingContext('products')();
        if (products && products.length > 0) {
          cb.utils.alert('已存在商品行，不能进行交货！', 'error');
          return
        }
        let params = {
          billingStatus: 'Shipment',
          title: '交货'
        };
        let data = {
          billtype: 'freeview',
          billno: 'rm_presellchange',
          params
        };
        cb.loader.runCommandLine('bill', data, viewmodel, function (vm) {
          //确定动作
          vm.on('sure', function (data) {
            let headModel = vm.get('rm_presellchange');
            let presellBills = headModel.getSelectedRows();
            let sureFlag = false; //确定不允许标志
            if (presellBills.length < 1) {
              cb.utils.alert('请先选择单据！', 'error');
              return false;
            } else if (presellBills.length > 1) {
              cb.utils.alert('仅选择一条单据情况下才能执行确定操作！', 'error');
              return false;
            }
            //，ktv行业，单据处理状态为已预订和已领位的预订零售单，交货时给出提示：尚未开房，不能交货 190726
            if(cb.rest.AppContext.user.industry == 20){
              if((presellBills[0].iProcessingState == 1) || (presellBills[0].iProcessingState == 3)){
                cb.utils.alert("尚未开房，不能交货",'error');
                return false;
              }
            }
            let retailVouchDetails = presellBills[0].retailVouchDetails;
            let i = 0;
            presellBills[0].retailVouchDetails.forEach(function (item) {
              //商品行添加key值，否则带入的商品行会全选中
              i = i + 1;
              let ts = new Date().valueOf();
              if (item.productsku) { //sku
                item.key = `${item.product}|${item.productsku}_${ts}_${i}`
              } else { // 商品
                item.key = `${item.product}_${ts}_${i}`
              }
              //如果商品行退品状态为待审批，则不允许交货
              if (item.iReturnStatus == 1) {
                cb.utils.alert('商品"' + item.product_cName + '"待退货审批！');
                sureFlag = true;
              }
              if (item.ikitType == 1) {
                item.iproducticon = '1';
              }
              if (item.ikitType == 2) {
                let text = []
                item.promotionwrite.forEach(promotion => {
                  text.push(promotion.cPromotionName)
                })
                item.promotionTips = text.join(',');
                item.bCanDiscount = false;
              }

            });
            if (sureFlag) {
              cb.utils.alert('有商品待退货审批！', 'error');
              return false;
            }
            //处理客户信用额度
            let orgId = cb.rest.AppContext.user.orgId;
            if(!cb.utils.isEmpty(presellBills[0].iCustomerid)){ //零售单表头具有客户id
              //如果零售单存在客户，调用后端服务获取客户信用额度
              let iCustomerid = presellBills[0].iCustomerid;
              let proxy = new cb.rest.DynamicProxy.create({
                query: {
                  url: '/uorder/bill/getCustInfo',
                  method: 'POST'
                }
              })
              let params = {
                id: iCustomerid,
                iYxyOrgId:orgId
              }
              let promise = new cb.promise();
              proxy.query(params, (err, result) => {
                if (err) {
                  cb.utils.alert(err.message, 'error');
                  promise.reject();
                  return false;
                }
                if (result) {
                  //将返回的客户信用额度相关的数据维护到本单表头
                  let iOwesState = result.bURetailJoin ? 1 : 0;
                  presellBills[0].bCusCreCtl = result.bCusCreCtl;
                  presellBills[0].creditBalance = result.creditBalance;
                  presellBills[0].iOwesState = iOwesState;
                  let resultData = {
                    "rm_retailvouch": presellBills[0],
                    "rm_gatheringvouch": presellBills[0].rm_gatheringvouch
                  };
                  viewmodel.billingFunc.handlePresellBillData(resultData, resultData, 'Shipment');
                  viewmodel.communication({
                    type: 'modal',
                    payload: { data: false }
                  })
                  return false;
                }
              })
              return promise;
            }else{
              let resultData = {
                "rm_retailvouch": presellBills[0],
                "rm_gatheringvouch": presellBills[0].rm_gatheringvouch
              };
              viewmodel.billingFunc.handlePresellBillData(resultData, resultData, 'Shipment');
              viewmodel.communication({
                type: 'modal',
                payload: { data: false }
              })
              return false;
            }

          });

          //取消动作
          vm.on('abandon', function () {
            viewmodel.communication({
              type: 'modal',
              payload: {
                data: false
              }
            })
            return false;
          });
          return true;
        });

      });
      /*预订退订弹窗*/
      viewmodel.on('PresellBack', function (wrapFunc, transfer) {
        var products = viewmodel.getBillingContext('products')();
        if (products && products.length > 0) {
          cb.utils.alert('已存在商品行，不能进行退订！', 'error');
          return
        }
        let params = {
          billingStatus: 'PresellBack',
          title: '退订'
        };
        let data = {
          billtype: 'freeview',
          billno: 'rm_presellchange',
          params
        };
        cb.loader.runCommandLine('bill', data, viewmodel, function (vm) {
          //确定动作
          vm.on('sure', function (data) {
            let headModel = vm.get('rm_presellchange');
            let presellBills = headModel.getSelectedRows();
            if (presellBills.length < 1) {
              cb.utils.alert('请先选择单据！', 'error');
              return false;
            }
            let retailVouchDetails = presellBills[0].retailVouchDetails;
            let i = 0;
            presellBills[0].retailVouchDetails.forEach(function (item) {
              //商品行添加key值，否则带入的商品行会全选中
              i = i + 1;
              let ts = new Date().valueOf();
              if (item.productsku) { //sku
                item.key = `${item.product}|${item.productsku}_${ts}_${i}`
              } else { // 商品
                item.key = `${item.product}_${ts}_${i}`
              }
              if (item.ikitType == 1) {
                item.iproducticon = '1';
              }
              if (item.ikitType == 2) {
                let text = []
                item.promotionwrite.forEach(promotion => {
                  text.push(promotion.cPromotionName)
                })
                item.promotionTips = text.join(',');
                item.bCanDiscount = false;
              }
            });
            let resultData = {
              "rm_retailvouch": presellBills[0],
              "rm_gatheringvouch": presellBills[0].rm_gatheringvouch
            };
            viewmodel.billingFunc.handlePresellBillData(resultData, resultData, 'PresellBack');
            viewmodel.communication({
              type: 'modal',
              payload: { data: false }
            })
            return false;
          });

          //取消动作
          vm.on('abandon', function () {
            viewmodel.communication({
              type: 'modal',
              payload: {
                data: false
              }
            })
            return false;
          });
          return true;
        });

      });

      /* 预订变更弹窗*/
      viewmodel.on('exchange', function (wrapFunc, transfer) {
        var products = viewmodel.getBillingContext('products')();
        if (products && products.length > 0) {
          cb.utils.alert('已存在商品行，不能进行变更！', 'error');
          return
        }
        let params = {
          billingStatus: 'PresellChange',
          title: '变更'
        };
        let data = {
          billtype: 'freeview',
          billno: 'rm_presellchange',
          params
        };
        cb.loader.runCommandLine('bill', data, viewmodel, function (vm) {
          //确定动作
          vm.on('sure', function (data) {
            let headModel = vm.get('rm_presellchange');
            let presellBills = headModel.getSelectedRows();
            let sureFlag = false; //确定不允许标志
            if (presellBills.length < 1) {
              cb.utils.alert('请先选择单据！', 'error');
              return false;
            }
            let retailVouchDetails = presellBills[0].retailVouchDetails;
            let i = 0;
            presellBills[0].retailVouchDetails.forEach(function (item) {
              //商品行添加key值，否则带入的商品行会全选中
              i = i + 1;
              let ts = new Date().valueOf();
              if (item.productsku) { //sku
                item.key = `${item.product}|${item.productsku}_${ts}_${i}`
              } else { // 商品
                item.key = `${item.product}_${ts}_${i}`
              }
              //如果商品行退品状态为待审批，则不允许变更
              if (item.iReturnStatus == 1) {
                cb.utils.alert('商品"' + item.product_cName + '"待退货审批！');
                sureFlag = true;
              }
            });
            //处理带入表体的数据，不显示退品人非空或退品状态为“待卖家退款的行”
            // for (let i = 0; i < presellBills[0].retailVouchDetails.length; i++) {
            //   let iReturnPerson = presellBills[0].retailVouchDetails[i].iReturnPerson;
            //   let iReturnStatus = presellBills[0].retailVouchDetails[i].iReturnStatus;
            //   if ((iReturnPerson != null) || (iReturnStatus == 2)) {
            //     presellBills[0].retailVouchDetails.splice(i, 1);
            //     i = i - 1;
            //   }
            // }
            if (sureFlag) {
              cb.utils.alert('有商品待退货审批！', 'error');
              return false;
            }
            let resultData = {
              "rm_retailvouch": presellBills[0],
              "rm_gatheringvouch": presellBills[0].rm_gatheringvouch
            };
            viewmodel.getParams().presellChange = true; //点预定变更按钮确定后设置一个变更单的标记
            viewmodel.billingFunc.handlePresellBillData(resultData, resultData, 'Shipment');
            //带入开单界面数据时，将预订收款比例更新到本单表头
            let MinPercentGiveMoneyPre = resultData.rm_retailvouch.iBusinesstypeid_MinPercentGiveMoneyPre;
            viewmodel.billingFunc.setReduxState({
              MinPercentGiveMoneyPre: MinPercentGiveMoneyPre + ''
            }, 'uretailHeader')
            viewmodel.communication({
              type: 'modal',
              payload: { data: false }
            })
            return false;
          });

          //取消动作
          vm.on('abandon', function () {
            viewmodel.communication({
              type: 'modal',
              payload: {
                data: false
              }
            })
            return false;
          });
          return true;
        });

      });
      //点促销活动按钮前判断事件 zhanglinb
      viewmodel.on('beforeExecBottomActionLogic', _bottomAction.revokeDiscount);

      //原单退货
      viewmodel.on('beforeBackBill', function (args) {
        let { returnData, selectedData } = args;
        const data = JSON.parse(JSON.stringify(selectedData));
        let detail = data["rm_retailvouch"]
        let retailVouchDetails = detail.retailVouchDetails;
        if(selectedData.rm_retailvouch.retailVouchReturnDetails){ //原单退货如果有已经退品的商品行，做原单退时涉及到线上退款则需要使用线上商品行
          viewmodel.getParams().retailVouchReturnDetails = JSON.parse(JSON.stringify(selectedData.rm_retailvouch.retailVouchReturnDetails));
        }

        //优惠券收款方式零售单原单退货逻辑控制
        const originData = JSON.parse(JSON.stringify(returnData));
        let originDetail = originData["rm_retailvouch"];
        let originRetailVouchDetails = originDetail.retailVouchDetails;
        let gatheringdetail = originData["rm_gatheringvouch"];
        let gatheringVouchDetail = gatheringdetail.gatheringVouchDetail;

        let arrParentKey = [];
        for (let k = 0; k < returnData["rm_retailvouch"].retailVouchDetails.length; k++) {
          for (let j = 0; j < retailVouchDetails.length; j++) {
            if (retailVouchDetails[j].ikitType == 1 || (retailVouchDetails[j].ikitType == 2)) {
              if ((returnData["rm_retailvouch"].retailVouchDetails[k].iCoRetailDetailId == retailVouchDetails[j].id) && (returnData["rm_retailvouch"].retailVouchDetails[k].product == retailVouchDetails[j].product)) {
                returnData["rm_retailvouch"].retailVouchDetails[k].parentkey = retailVouchDetails[j].parentkey;
                returnData["rm_retailvouch"].retailVouchDetails[k].kitproduct = retailVouchDetails[j].kitproduct;
                returnData["rm_retailvouch"].retailVouchDetails[k].ikitType = retailVouchDetails[j].ikitType;
                returnData["rm_retailvouch"].retailVouchDetails[k].key = retailVouchDetails[j].key;
                returnData["rm_retailvouch"].retailVouchDetails[k].originalkey = retailVouchDetails[j].originalkey;
                if (retailVouchDetails[j].ikitType == 1) {
                  returnData["rm_retailvouch"].retailVouchDetails[k].iproducticon = '1';
                }
                if (retailVouchDetails[j].ikitType == 2) {
                  if (arrParentKey.indexOf(retailVouchDetails[j].parentkey) == -1) {
                    if (retailVouchDetails[j].parentkey) {
                      arrParentKey.push(retailVouchDetails[j].parentkey);
                    }
                  }
                }
                if (retailVouchDetails[j].ikitType == 1) {
                  if (arrParentKey.indexOf(retailVouchDetails[j].originalkey) == -1) {
                    if (retailVouchDetails[j].originalkey) {
                      arrParentKey.push(retailVouchDetails[j].originalkey);
                    }
                  }
                }

              }
            }
          }
        }

        for (let k = 0; k < arrParentKey.length; k++) {
          let count = 0;
          for (let i = 0; i < retailVouchDetails.length; i++) {
            if (retailVouchDetails[i].parentkey) {
              if (retailVouchDetails[i]["parentkey"] == arrParentKey[k]) {
                count = count + 1;
              }
            }
            if (retailVouchDetails[i]["originalkey"]) {
              if (retailVouchDetails[i]["originalkey"] == arrParentKey[k]) {
                count = count + 1;
              }
            }
          }

          let quantity = 0;
          for (let j = 0; j < returnData["rm_retailvouch"].retailVouchDetails.length; j++) {
            if (returnData["rm_retailvouch"].retailVouchDetails[j].parentkey) {
              if (returnData["rm_retailvouch"].retailVouchDetails[j]["parentkey"] == arrParentKey[k]) {
                quantity = quantity + 1;
              }
            }

            if (returnData["rm_retailvouch"].retailVouchDetails[j]["originalkey"]) {
              if (returnData["rm_retailvouch"].retailVouchDetails[j]["originalkey"] == arrParentKey[k]) {
                quantity = quantity + 1;
              }
            }
          }

          if (count != quantity) {
            cb.utils.alert('套餐商品需要全选', 'error')
            return false;
          }

        }

        for (let i = 0; i < retailVouchDetails.length; i++) {
          if (retailVouchDetails[i].cCouponId) {
            viewmodel.getParams().bCardCouponOriginBack = true;
            break;
          }
        }

        //优惠券收款方式零售单原单退货逻辑控制
        for (let i = 0; i < gatheringVouchDetail.length; i++) {
          if (gatheringVouchDetail[i].iPaytype == 21) {
            viewmodel.getParams().usedCouponPaymentOriginBack = true;
            break;
          }
        }
        if(viewmodel.getParams().usedCouponPaymentOriginBack && retailVouchDetails.length != originRetailVouchDetails.length){
          cb.utils.alert('本单使用了优惠券收款方式，请整单退货', 'error');
          delete viewmodel.getParams()['usedCouponPaymentOriginBack'];
          return false;
        }

        //原单退货，开单界面商品行显示“退”字，维护商品行字段iproducticon = "2"(haoyj)
        for (let i = 0; i < returnData["rm_retailvouch"].retailVouchDetails.length; i++) {
          returnData["rm_retailvouch"].retailVouchDetails[i].iproducticon = "2";
        }
      });

      viewmodel.on('beforeMergeSameProduct', function (args) {
        let { newEle, oldEle, middle } = args;
        //母件 子件商品不合并
        if (newEle.ikitType == 1 || newEle.ikitType == 2) {
          middle.result = false;
          return false;
        }

        //卡券商品不合并
        if (!cb.utils.isEmpty(newEle.couponId)) {
          middle.result = false;
          return false;
        }

        //储值卡商品不合并
        if (!cb.utils.isEmpty(newEle.cStorageCardNum)
        || (!cb.utils.isEmpty(newEle.beginCouponsn) && !cb.utils.isEmpty(newEle.endCouponsn))) {
          middle.result = false;
          return false;
        }
      });

      viewmodel.on('extendIsShowPresellPercent', _settle.extendIsShowPresellPercent)
      viewmodel.on('beforeBillCodeLogic', _settle.beforeBillCodeLogic)

      /* 零售开单底部按钮-----退品--------*/
      viewmodel.on('backProduct', function (wrapFunc, transfer) {
        var products = viewmodel.getBillingContext('products')();
        //获取退货原因是否必输
        let returnseasonentry = cb.rest.AppContext.option.returnseasonentry;
        let billingStatus = viewmodel.getBillingContext('billingStatus')();
        let billingFlag = viewmodel.getParams().presellChange;
        let getMoneyMap = viewmodel.getBillingContext('getMoneyMap')();
        // 预定交货业务类型信息需要从单据头取
        let originBillHeader = viewmodel.getBillingContext('originBillHeader')();
        if (billingStatus == "Shipment" || billingFlag == true) {
          //只有预订交货和预订变更状态下才能进行退品，否则不允许执行退品
          if (originBillHeader && originBillHeader.bDeliveryModify == false) {
            cb.utils.alert('预订交货且“交货时可修改商品”为否, 不允许执行退品', 'error');
            return false;
          }
        } else {
          cb.utils.alert('当前单据状态下不允许执行退品!', 'error');
          return false;
        }
        let focusedRow = viewmodel.getBillingContext('focusedRow')();
        let fQuantity = 0;
        let fOutQuantity = 0;
        if (cb.utils.isEmpty(focusedRow)) {
          cb.utils.alert('没有选中的商品行，不允许执行退品!', 'error');
          return false;
        } else {
          if (!cb.utils.isEmpty(focusedRow.fQuantity)) {
            fQuantity = focusedRow.fQuantity;
          }
          if (!cb.utils.isEmpty(focusedRow.fOutQuantity)) {
            fOutQuantity = focusedRow.fOutQuantity;
          }
          if (fQuantity == fOutQuantity) { //如果已出品数量等于数量
            cb.utils.alert('已出品的商品不能退，请交货后进行原单退货！', 'error');
            return false;
          }
          if ((focusedRow.iPromotionProduct == 1) || (focusedRow.iReturnStatus == 2)) { //赠品不允许进行退品
            cb.utils.alert('该商品行不允许执行退品！', 'error');
            return false;
          }
          if (focusedRow.ikitType == 2) {
            cb.utils.alert('子件商品不允许执行退品！', 'error');
            return false;
          }
          //如果商品执行过促销活动，给出相应提示
          if (!cb.utils.isEmpty(focusedRow.promotionTips) || (getMoneyMap && getMoneyMap['Promotion'] && getMoneyMap['Promotion'].value != 0)) {
            cb.utils.alert('该商品执行过促销活动，退品后可能不满足原促销条件！', 'error');
          }
          if (focusedRow.bChangeAddProduct) { //本次变更新增的商品不允许执行退品
            cb.utils.alert('本次新增行请直接删除！', 'error');
            return false;
          }
        }
        if (products && products.length == 0) {
          cb.utils.alert('未录入商品，不能执行退品！', 'error');
          return
        }
        var params = { returnseasonentry, focusedRow };
        var data = {
          billtype: 'freeview',
          billno: 'rm_backproduct_1',
          params
        };

        cb.loader.runCommandLine('bill', data, viewmodel, function (vm) {
          let backProductQuantity;
          //每次弹窗前给字段赋值
          if (!cb.utils.isEmpty(focusedRow)) {
            //如果当前行退品数量有值，则赋值给弹窗中的退品数量字段
            if (!cb.utils.isEmpty(focusedRow.backProductQuantity)) {
              vm.get('fQuantity').setValue(focusedRow.backProductQuantity);
            } else {
              //退品数量赋默认值
              vm.get('fQuantity').setValue(fQuantity - fOutQuantity);
            }
            //若当前行退品原因有值，则给弹窗中退品原因赋值
            if (!cb.utils.isEmpty(focusedRow.iBackid) && !cb.utils.isEmpty(focusedRow.iBackid_reason)) {
              vm.get('iBackid').setValue(focusedRow.iBackid);
              vm.get('iBackid_reason').setValue(focusedRow.iBackid_reason);
            }
          }
          let manySureFlag = false;  //用来控制多次点击确定带入多次数据问题
          //确定动作
          vm.on('sure', function (data) {
            if (manySureFlag) return false;
            let originBillHeader = viewmodel.getBillingContext('originBillHeader')();
            let num = vm.get('fQuantity').getValue();
            let iBackid = vm.get('iBackid').getValue();
            let iBackid_reason = vm.get('iBackid_reason').getValue();
            let fQuantitySum = originBillHeader.fQuantitySum;
            let productQuantity = 0;
            let maxReturnRowNumber = 1; //用来统计本次退品的商品行号
            let productSkus = [];  //用来存放退品的商品sku
            if (getMoneyMap && getMoneyMap['TotalQuantity'] && getMoneyMap['TotalQuantity'].value != 0) {
              productQuantity = getMoneyMap['TotalQuantity'].value;
            }
            let taoSubQuantity = 0;  //用来统计套件子商品的数量
            if (focusedRow.ikitType == 1) { //如果是套件商品做退品需要统计子件商品数据
              for (let i = 0; i < products.length; i++) {
                if (products[i].ikitType == 2 && (products[i].parentkey == focusedRow.originalkey)) {
                  taoSubQuantity = taoSubQuantity + products[i].fQuantity;
                }
              }
            }
            let realQuantity = productQuantity - taoSubQuantity;   //用来统计处套件商品外其他商品的数量
            //如果弹窗退品数量有值，则付给当前行的退品数量
            if (!cb.utils.isEmpty(num)) { //退品数量应满足>=1,<=数量-已出品数量
              if (num <= 0) {
                cb.utils.alert('退品数量不能为负！', 'error');
                return false;
              }
              if (num > fQuantity - fOutQuantity) {
                cb.utils.alert('退品数量不能大于未出品数量！', 'error');
                return false;
              }
              if (!cb.utils.isEmpty(productQuantity)) {
                if (num >= productQuantity || (realQuantity <= 0)) {
                  cb.utils.alert('整单全退时，请使用退订功能！', 'error');
                  return false;
                }
              }
              viewmodel.getBillingContext('focusedRow')().backProductQuantity = num;
            } else {
              cb.utils.alert('退品数量不能为空！', 'error');
              return false;
            }
            if (cb.utils.isEmpty(iBackid) || cb.utils.isEmpty(iBackid_reason)) {
              if (returnseasonentry) { //退货原因为必输时，退品原因也必须有数据
                cb.utils.alert('退品原因不能为空！', 'error');
                return false;
              }
              viewmodel.getBillingContext('focusedRow')().iBackid = null;
              viewmodel.getBillingContext('focusedRow')().iBackid_reason = null;
            } else { //退品原因赋值
              viewmodel.getBillingContext('focusedRow')().iBackid = iBackid;
              viewmodel.getBillingContext('focusedRow')().iBackid_reason = iBackid_reason;
            }
            //确定前调用后端服务，将退品相关信息进行后端处理
            let iReturnPerson = (cb.rest.AppContext.user || {}).id;  //记录退品人id
            let iReturnPerson_name = cb.rest.AppContext.user.name;  //记录退品人name
            let isTaoProduct = false;  //用来判断是否是套件商品执行退品的标志
            viewmodel.getBillingContext('focusedRow')().iReturnPerson = iReturnPerson;
            viewmodel.getBillingContext('focusedRow')().iReturnPerson_name = iReturnPerson_name;
            let params = {};
            if (originBillHeader) {
              params = originBillHeader;
            }
            let retailVouchDetails = viewmodel.getBillingContext('products')();
            for (let i = 0; i < retailVouchDetails.length; i++) {
              if (focusedRow.rowNumber == retailVouchDetails[i].rowNumber) { //修改当前行商品数据，传给后端
                retailVouchDetails[i].iReturnPerson = iReturnPerson;
                retailVouchDetails[i].iReturnPerson_name = iReturnPerson_name;
                retailVouchDetails[i].iBackid_reason = iBackid_reason;
                retailVouchDetails[i].iBackid = iBackid;
                retailVouchDetails[i].backProductQuantity = num;
                if(retailVouchDetails[i].rowNumber > maxReturnRowNumber) maxReturnRowNumber = retailVouchDetails[i].rowNumber;
                productSkus.push(retailVouchDetails[i].productsku);
                if(retailVouchDetails[i]['product_productProps!define1'] && retailVouchDetails[i]['product_productProps!define1'].includes("房费")){
                  //如果是房费商品，则在前端直接给打退品标记
                  retailVouchDetails[i].iReturnStatus = 2;
                }
                retailVouchDetails[i].newReturn = true; //用来表示本次退的商品行
              }else{
                retailVouchDetails[i].newReturn = false;
              }
              if (retailVouchDetails[i].ikitType == 2 && (retailVouchDetails[i].parentkey == focusedRow.originalkey)) { //如果存在子件商品，则子件商品同样做退品处理,套件商品自己维护退品数据
                retailVouchDetails[i].iReturnPerson = iReturnPerson;
                retailVouchDetails[i].iReturnPerson_name = iReturnPerson_name;
                retailVouchDetails[i].iBackid_reason = iBackid_reason;
                retailVouchDetails[i].iBackid = iBackid;
                retailVouchDetails[i].backProductQuantity = 0;
                retailVouchDetails[i].iReturnStatus = 2;
                retailVouchDetails[i].iproducticon = '2';
                retailVouchDetails[i].newReturn = true;
                if(retailVouchDetails[i].rowNumber > maxReturnRowNumber) maxReturnRowNumber = retailVouchDetails[i].rowNumber;
                productSkus.push(retailVouchDetails[i].productsku);
              } else if (retailVouchDetails[i].ikitType == 1 && (focusedRow.rowNumber == retailVouchDetails[i].rowNumber)) {
                retailVouchDetails[i].backProductQuantity = 0;
                retailVouchDetails[i].iReturnStatus = 2;
                retailVouchDetails[i].iproducticon = '2';
                isTaoProduct = true;
                if(retailVouchDetails[i].rowNumber > maxReturnRowNumber) maxReturnRowNumber = retailVouchDetails[i].rowNumber;
                productSkus.push(retailVouchDetails[i].productsku);
                retailVouchDetails[i].newReturn = true;
              }
            }
            let processBeginRow = maxReturnRowNumber; //当前行后面的行重新处理房费时间
            for(let i=0; i<retailVouchDetails.length; i++){ //
              if(retailVouchDetails[i].rowNumber > processBeginRow){
                retailVouchDetails[i].fromBackSure = true;  //给当前商品行打个标记，表示是退品行确定按钮时处理的房费时间，并且这些时间不需要统计最大时间
              }else{
                retailVouchDetails[i].fromBackSure = false;
              }
            }
            for(let i=0; i<retailVouchDetails.length; i++){ //调用房费商品维护时间的方法
              if(retailVouchDetails[i].rowNumber > processBeginRow && productSkus.includes(retailVouchDetails[i].productsku)
            && retailVouchDetails[i]['product_productProps!define1'] && retailVouchDetails[i]['product_productProps!define1'].includes("房费")){
                common.changeTimePeriod(retailVouchDetails[i],viewmodel); //退品行后面的商品重新维护时间数据,且满足同退品行是相同的sku
                retailVouchDetails[i].fromBackSure = false;  //处理完后，则变成可参考的有效行
              }
            }
            params.retailVouchDetails = retailVouchDetails;
            let returnproduct = cb.rest.DynamicProxy.create({
              settle: {
                url: '/bill/returnproduct',
                method: 'POST'
              }
            });
            if (isTaoProduct) { //套件商品不调后端退品处理服务，前端处理
              //将处理后的数据带入开单界面表体行
              let resultData = { "rm_retailvouch": params };
              let mock = [];
              mock.push(resultData);
              //清空表体行
              viewmodel.billingFunc.clearBillDetail();
              wrapFunc(mock, 'Shipment', true);
              manySureFlag = true;  //如果已经执行了一次带入数据的动作，则标志置为true
              viewmodel.communication({
                type: 'modal',
                payload: { data: false }
              })
              return false;
            } else {
              returnproduct.settle(params, function (err, result) {
                if (err) {
                  cb.utils.alert(err.message, 'error');
                  cb.utils.alert('退品数据处理失败！', 'error');
                }
                if (result != undefined) {
                  //cb.utils.alert('测试退品处理返回的数据！','error');
                  if (!cb.utils.isEmpty(result.retailVouchDetails)) {
                    for (let i = 0; i < result.retailVouchDetails.length; i++) {
                      //如果是退品行，则给改行的iNegative打标记‘已退’的枚举值
                      //如果是退品行, 该行不参与促销活动/优惠券
                      if (result.retailVouchDetails[i].iReturnStatus == 2) {
                        result.retailVouchDetails[i].iproducticon = '2';
                        result.retailVouchDetails[i].bCanDiscount = false;
                      }
                    }
                  }
                  //将处理后的数据带入开单界面表体行
                  let resultData = { "rm_retailvouch": result };
                  let mock = [];
                  mock.push(resultData);
                  //清空表体行
                  viewmodel.billingFunc.clearBillDetail();
                  wrapFunc(mock, 'Shipment', true);
                  manySureFlag = true;  //如果已经执行了一次带入数据的动作，则标志置为true
                  viewmodel.communication({
                    type: 'modal',
                    payload: { data: false }
                  })
                  return false;
                }
              });
            }
          });
          //取消动作
          vm.on('abandon', function () {
            viewmodel.communication({
              type: 'modal',
              payload: {
                data: false
              }
            })
            return false;
          });
          return true;
        });

      });

      /* 现场折扣校验 */
      viewmodel.on('checkOperatorDiscoutAuth',args => {
        return _Discount.checkOperatorDiscoutAuth(args);
      });

      //改行卡券号 卡券范围字段可编辑控制
      viewmodel.get('retailVouchCouponSN').getEditRowModel().get('cCouponsn').on('afterValueChange', args => {
        if(checkNeedChange()){
          let beginCouponEdit = viewmodel.get('retailVouchCouponSN').getEditRowModel().get("beginCouponsn");
          let endCouponEdit = viewmodel.get('retailVouchCouponSN').getEditRowModel().get("endCouponsn");
          if(!cb.utils.isEmpty(args.value)){
            beginCouponEdit.setValue(null);
            endCouponEdit.setValue(null);
            beginCouponEdit.setDisabled(true);
            endCouponEdit.setDisabled(true);
          }else{
            beginCouponEdit.setValue(null);
            endCouponEdit.setValue(null);
            beginCouponEdit.setDisabled(false);
            endCouponEdit.setDisabled(false);
          }
        }
      });

      viewmodel.get('retailVouchCouponSN').getEditRowModel().get('beginCouponsn').on('afterValueChange', args => {
        if(checkNeedChange()){
          let couponEditRowModel = viewmodel.get('retailVouchCouponSN').getEditRowModel().get("cCouponsn")
          if(!cb.utils.isEmpty(args.value)){
            couponEditRowModel.setValue(null);
            couponEditRowModel.setDisabled(true);
          }else{
            couponEditRowModel.setValue(null);
            couponEditRowModel.setDisabled(false);
          }
        }
      });

      viewmodel.get('retailVouchCouponSN').getEditRowModel().get('endCouponsn').on('afterValueChange', args => {
        if(checkNeedChange()){
          let couponEditRowModel = viewmodel.get('retailVouchCouponSN').getEditRowModel().get("cCouponsn")
          if(!cb.utils.isEmpty(args.value)){
            couponEditRowModel.setValue(null);
            couponEditRowModel.setDisabled(true);
          }else{
            couponEditRowModel.setValue(null);
            couponEditRowModel.setDisabled(false);
          }
        }
      });

    }
  }
  try {
    module.exports = RM_rm_retailvouch_VM_billing_Extend;
  } catch (error) {

  }
  return RM_rm_retailvouch_VM_billing_Extend;
});
