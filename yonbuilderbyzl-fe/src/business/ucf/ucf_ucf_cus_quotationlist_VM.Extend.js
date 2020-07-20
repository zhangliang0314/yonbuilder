cb.define(['common/common_VM.Extend.js'], function (common) {
  var ucf_ucf_cus_quotationlist_VM_Extend = {
    doAction: function (name, viewmodel) {
      if (this[name])
        this[name](viewmodel);
    },
    init: function (viewmodel) {
      common.print(viewmodel);
    }
  }
  try {
    module.exports = ucf_ucf_cus_quotationlist_VM_Extend;
  } catch (error) {

  }
  return ucf_ucf_cus_quotationlist_VM_Extend;
});
