import React, { Component } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import * as mineActions from 'src/common/actions/mine'
import { logOut } from 'src/common/actions/user'
import { Toast, List, Button } from 'antd-mobile';
import { push } from 'react-router-redux'
import Immutable from 'immutable'
import styles from './style.css'
import { toggle_tabbar } from 'src/common/reducers/modules/tabBar'
import * as editRowActions from 'src/common/redux/modules/billing/editRow'
import nophoto from '@mdf/theme-mobile/theme/images/my-header.png'
const Item = List.Item;
// const Brief = Item.Brief;

class Mine extends Component {
  constructor (props) {
    super(props);
    this.state = { chsphoto: false };

    const fileurl = props.mine.fileurl;
    if (cb.utils.isEmpty(fileurl)) {
      var proxy = cb.rest.DynamicProxy.create({
        getFileServerUrl: {
          url: '/pub/fileupload/getFileServerUrl',
          method: 'GET',
          options: {
            token: true
          }
        }
      });
      proxy.getFileServerUrl({}, function (err, fileurl) {
        if (!err)
          props.mineAction.modifyInfo(fileurl);
      }, this);
    }
  }

  componentDidMount () {
    const { mineAction, mine, user } = this.props;
    if (!this.isLogin()) {
      this.userExit();
    } else {
      mineAction.modifyMineInfo(Immutable.fromJS(mine.user || {}).merge({ id: user.id, nickName: user.nickName, avatar: user.avatar }));
    }
  }

  shouldComponentUpdate (nextProps, nextState) {
    return this.isLogin();
  }

  changeStatus (bl) {
    this.setState({ chsphoto: bl })
  }

  chooseUserStores () {
    this.props.editRowActions.beforeUserStoreRefer();
    this.props.dispatch(push({ pathname: '/billingRefer', state: 'ChooseStores' }));
  }

  render () {
    const { user, dispatch } = this.props;
    if (!this.isLogin()) {
      console.log('无法读取缓存数据...');
      return '';
    }
    const store = user.userStores ? user.userStores.find((temstore) => {
      if (temstore.store === user.storeId) {
        return temstore;
      }
    }) : '';

    const height = document.documentElement.clientHeight;
    // let modifyPage="";
    // if(mine.isShowModifyPage){
    //   modifyPage = <ModifyInfo />
    // }

    const avatar = user.avatar;
    return (
      <div className='my-count'>
        <div className='my' style={{ position: 'relative', height: height + 'px' }}>
          <div className={styles.mine_contains}>
            <div className={styles.photo_contains}><img onClick={() => { this.changeStatus(true) }} src={cb.utils.isEmpty(avatar) ? nophoto : avatar} /></div>
            <div onClick={() => { dispatch(push('/mdfInfo')) }} className='mine-member-name'><span style={{ float: 'left' }}>{this.showName(user)}</span></div>
            <div className='my-edit-count' onClick={() => { dispatch(push('/mdfInfo')) }}>
              查看并编辑个人资料
            </div>
          </div>
          <List className='my-list'>
            <Item className='store-list' arrow='horizontal' extra={store ? store.store_name : ''} onClick={this.chooseUserStores.bind(this)}>当前门店</Item>
            <Item arrow='horizontal' extra='V1.0.0' onClick={() => { dispatch(push('/version')) }}>版本号 </Item>
            <Item arrow='horizontal' onClick={() => { dispatch(push('/changePwd')) }}>修改密码 </Item>
          </List>

          <Button onClick={() => { this.userExit() }}>退出登录</Button>
          {/* { modifyPage } */}
        </div>
        <div className={styles.choose_panel} style={{ display: this.state.chsphoto ? '' : 'none' }}>
          <div className={styles.choose_panel_empty} onClick={() => { this.changeStatus(false) }} />
          <div className={styles.choose_btn}>
            <Button style={{ borderRadius: 0 + 'px', borderBottom: '#f7f6f6 solid 0.02rem', fontSize: '0.3rem' }} onClick={() => { this.takeNewPic('album') }}>打开相册</Button>
            <Button style={{ borderRadius: 0 + 'px', fontSize: '0.3rem' }} onClick={() => { this.takeNewPic('carema') }}>拍照选图</Button>
            <div className='info_bg'>&nbsp;</div>
            <Button style={{ fontSize: '0.34rem' }} onClick={() => { this.changeStatus(false) }}>取消</Button>
          </div>
        </div>
      </div>)
  }

  userExit () {
    const { logOut, toggle_tabbar } = this.props;
    toggle_tabbar(0);
    logOut();
  }

  /* 唤起相机或相册 */
  takeNewPic = (type) => {
    this.changeStatus(false);
    if (!window.plus) return;
    let { mine = {}, mineAction } = this.props;
    const uploadData = { url: '', type: '', size: '', name: '' };
    const _self = this;
    const url = cb.rest.AppContext.serviceUrl + '/upload?token=' + cb.rest.AppContext.token;
    mine = Immutable.fromJS(mine);
    var task = plus.uploader.createUpload(url, { method: 'POST' }, (upload, status) => {
      Toast.hide();
      if (status == 200 && upload.state == 4) {
        const responseData = JSON.parse(upload.responseText).data;
        uploadData.url = mine.get('fileurl') + responseData;
        uploadData.size = upload.uploadedSize;
        uploadData.type = 'image/' + uploadData.name.split('.')[1];
        mineAction.modifyMineInfo(mine.get('user').set('avatar', uploadData.url));
        _self.save();
        // _self.setState({ attr:uploadData });
      } else {
        cb.utils.Toast('上传失败' + JSON.parse(upload.responseText), 'fail');
        //   Toast.fail('上传失败' + JSON.parse(upload.responseText),1);
      }
    });
    if (type == 'album') { /* 相册 */
      plus.gallery.pick(function (path) {
        window.plus.io.resolveLocalFileSystemURL(path, entry => {
          /* 将本地URL路径转换成平台绝对路径 */
          var url = entry.toLocalURL();
          uploadData.name = entry.name;
          task.addFile(url, { key: 'file' });
          task.addData('name', entry.name);
          Toast.loading('上传中...', 10);
          task.start();
        });
      }, function (e) {
        console.log('取消选择图片');
      }, { filter: 'image' });
    } else { /* 拍照 */
      var cmr = plus.camera.getCamera();
      cmr.captureImage(function (path) {
        window.plus.io.resolveLocalFileSystemURL(path, function (entry) {
          /* 将本地URL路径转换成平台绝对路径 */
          var url = entry.toLocalURL();
          uploadData.name = entry.name;
          task.addFile(url, { key: 'file' });
          task.addData('name', entry.name);
          Toast.loading('上传中...', 10);
          task.start();
        });
      }, function (error) {
        //  cb.utils.Toast("Capture image failed: " + error.message,'fail');
        //  Toast.fail("Capture image failed: " + error.message,1);
      });
    }
  }

  save () {
    // const mine = this.props.mine;
    this.props.mineAction.saveInfo(true);
  }

  isLogin () {
    const { user } = this.props;
    if (!user || cb.utils.isEmptyObject(user))
      return false;
    else
      return true;
  }

  showName (loginUser) {
    // const { user } = this.props;
    return loginUser.name;
    // return (!loginUser.nickName || cb.utils.isEmptyObject(loginUser.nickName))?loginUser.name:loginUser.nickName;
  }
}

function mapPropsToState (state) {
  return {
    user: state.user ? state.user.toJS() : {},
    mine: state.mine ? state.mine.toJS() : {},
    routing: state.router,
  }
}

function mapPropsToDispatch (dispatch) {
  return {
    mineAction: bindActionCreators(mineActions, dispatch),
    logOut: bindActionCreators(logOut, dispatch),
    toggle_tabbar: bindActionCreators(toggle_tabbar, dispatch),
    editRowActions: bindActionCreators(editRowActions, dispatch),
    dispatch
  }
}

export default connect(mapPropsToState, mapPropsToDispatch)(Mine);
