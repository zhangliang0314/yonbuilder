import * as basic from './basic'
import * as formatter from './formatter'
import * as home from './home' // home的代码中在引用 redux/modules/home，然而这个文件在web中找不到，之前应该也没引用，所以此处先注释掉
import * as meta from './meta'
import * as modal from './modal'
import * as popover from './popover'
import  portal from './portal'
import * as toolbar from './toolbar'

export default {
  basic,
  formatter,
  home,
  meta,
  modal,
  popover,
  portal,
  toolbar
}
