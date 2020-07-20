cb.define([], function () {
  var RM_rm_retailvouchdetaillist_VM_Extend = {

    doAction: function (name, viewmodel) {
      if (this[name]) {
        this[name](viewmodel);
      }
    },
    init: function (viewmodel) {
		viewmodel.getGridModel().setShowCheckbox(false);
    },

  }
  try {
    module.exports = RM_rm_retailvouchdetaillist_VM_Extend;
  } catch (error) {

  }
  return RM_rm_retailvouchdetaillist_VM_Extend;
});
