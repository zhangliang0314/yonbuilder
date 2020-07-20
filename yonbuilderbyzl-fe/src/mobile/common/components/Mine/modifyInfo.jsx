import React, { Component } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { push, goBack } from 'react-router-redux'
import styles from './style.css'
import { Toast, List, Button, InputItem, NavBar } from '@mdf/baseui-mobile';
import * as mineActions from 'src/common/actions/mine'
import yardformdata from 'yardformdata'
import nophoto from '@mdf/theme-mobile/theme/images/my-header.png'

const Item = List.Item;
// const Brief = Item.Brief;
// const alert = Modal.alert;

class ModifyInfo extends Component {
  constructor (props) {
    super(props);
    // 设置状态栏字体黑色
    cb.utils.setStatusBarStyle('dark');
    const { mine } = this.props;
    if(cb.utils.isEmpty(mine.get('departments'))) {
      this.props.mineAction.getInfo();
    }

    this.state = {chsphoto: false, isback: false, user: []};
    const fileurl = props.mine.get('fileurl');
    if(cb.utils.isEmpty(fileurl)) {
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

  changeStatus (bl) {
    this.setState({chsphoto: bl})
  }

  changeInfo (name, value) {
    // let { user } = this.state;
    // user[name]=value;
    // this.setState({user:user});
    const { mineAction, mine } = this.props;
    mineAction.modifyMineInfo(mine.get('user').set(name, value));
  }

    handDepartment=() => {
      const { mineAction, dispatch, mine } = this.props;

      if(mine.get('departments') !== null && mine.get('departments') !== '') {
        dispatch(push('/department'));
        return;
      }
      mineAction.departmentInfo(function (type, data) {
        if(type === 0) {
          if(!data.data) {
            console.log('店员无法选择部门!!');
            return;
          }
          dispatch(push('/department'));
        }else{
          console.log(data);
        }
      });
    }

    onLeftClick () {
      // 设置状态栏字体白色
      cb.utils.setStatusBarStyle('light');
      const { dispatch } = this.props;
      this.props.mineAction.departmentList(null);
      dispatch(goBack());
    }

    render () {
      const { mine } = this.props;
      const user = mine.get('user').toJS();
      const avatar = user.avatar;

      // let height=document.documentElement.clientHeight;
      return (
        <div>
          <NavBar className='infor-title-bar' icon={<i className='icon icon-fanhui' />} onLeftClick={this.onLeftClick.bind(this)}>个人信息</NavBar>
          <form>
            <div className='modifyinfo_contains-for'>
              <List className='my-list'>
                <Item arrow='horizontal' extra={<img src={cb.utils.isEmpty(avatar) ? nophoto : avatar} />} onClick={() => { this.changeStatus(true) }}>头像</Item>
                <InputItem onChange={this.changeInfo.bind(this, 'name')} clear placeholder={!user.name ? '请输入' : undefined} value={user.name}> 姓名</InputItem>
                <InputItem onChange={this.changeInfo.bind(this, 'nickName')} clear placeholder={!user.nickName ? '请输入' : undefined} value={user.nickName}>昵称</InputItem>
                <InputItem className='play-color' editable={false} onChange={this.changeInfo.bind(this, 'userType')} placeholder={!user.userType ? '请输入' : undefined} value={user.userType != 1 ? '' : '公司员工'}>角色</InputItem>
                <Item className='department-modify' arrow='horizontal' extra={<InputItem editable={false} onClick={this.handDepartment.bind(this)} onChange={this.changeInfo.bind(this, 'department')} clear placeholder={!user.department_name ? '请选择' : undefined} value={user.department_name} />}> 部门</Item>
                {/* <InputItem editable={false}  onClick={this.handDepartment.bind(this)} onChange={this.changeInfo.bind(this,'department')} clear placeholder={!user.department?'输入部门':undefined} value={user.department}>部门 </InputItem> */}
                <InputItem onChange={this.changeInfo.bind(this, 'position')} clear placeholder={!user.position ? '请输入' : undefined} value={user.position}>职业</InputItem>
                <InputItem onChange={this.changeInfo.bind(this, 'mobile')} clear placeholder={!user.mobile ? '请输入' : undefined} value={user.mobile}>手机号</InputItem>
                <InputItem onChange={this.changeInfo.bind(this, 'tel')} clear placeholder={!user.tel ? '请输入' : undefined} value={user.tel}>座机</InputItem>
                <InputItem onChange={this.changeInfo.bind(this, 'email')} clear placeholder={!user.email ? '请输入' : undefined} value={user.email}>邮箱</InputItem>
                <InputItem onChange={this.changeInfo.bind(this, 'wechat')} clear placeholder={!user.wechat ? '请输入' : undefined} value={user.wechat}>微信</InputItem>
                <InputItem onChange={this.changeInfo.bind(this, 'qq')} clear placeholder={!user.qq ? '请输入' : undefined} value={user.qq}>QQ</InputItem>
                {/* <Item  onClick={() => {dispatch(push('/changePwd'))}}>修改密码 </Item> */}

              </List>
            </div>
            <div className='button-fixed-bottom'><Button style={{color: '#000'}} onClick={() => { this.save() }} type='warning'>确定</Button></div>
          </form>
          <div className={styles.choose_panel} style={{display: this.state.chsphoto ? '' : 'none'}}>
            <div className={styles.choose_panel_empty} onClick={() => { this.changeStatus(false) }} />
            <div className={styles.choose_btn}>
              <Button style={{borderRadius: 0 + 'px', borderBottom: '#dcdcdc solid 1px', fontSize: '0.3rem'}} onClick={() => { this.takeNewPic('album') }}>打开相册</Button>
              <Button style={{borderRadius: 0 + 'px', fontSize: '0.3rem'}} onClick={() => { this.takeNewPic('carema') }}>拍照选图</Button>
              <div className='info_bg'>&nbsp;</div>
              <Button style={{fontSize: '0.34rem'}} onClick={() => { this.changeStatus(false) }}>取消</Button>
            </div>
          </div>
        </div>
      )
    }

    save () {
      //  const mine = this.props.mine.toJS();
      this.props.mineAction.saveInfo();
    }

    /* 唤起相机或相册 */
    takeNewPic = (type) => {
      this.changeStatus(false);
      if (cb.rest.isWeChat) {
        this.takeWeChatPic(type);
        return;
      }
      if (!window.plus) return;
      const { mine, mineAction } = this.props;
      const uploadData = { url: '', type: '', size: '', name: '' };
      // let _self=this;
      const url = cb.rest.AppContext.serviceUrl + '/upload?token=' + cb.rest.AppContext.token;
      var task = plus.uploader.createUpload(url, { method: 'POST' }, (upload, status) => {
        Toast.hide();
        if (status == 200 && upload.state == 4) {
          const responseData = JSON.parse(upload.responseText).data;
          uploadData.url = mine.get('fileurl') + responseData;
          uploadData.size = upload.uploadedSize;
          uploadData.type = 'image/' + uploadData.name.split('.')[1];
          mineAction.modifyMineInfo(mine.get('user').set('avatar', uploadData.url));
          // _self.setState({ attr:uploadData });
        } else {
          cb.utils.Toast('error', '上传失败' + JSON.parse(upload.responseText));
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
          cb.utils.Toast('error', 'Capture image failed: ' + error.message);
        });
      }
    }

    /* 微信接口  选择图片 */
    takeWeChatPic = (type) => {
      var self = this;
      if (type == 'album') { /* 相册 */
        wx.chooseImage({
          count: 1,
          sizeType: ['original', 'compressed'],
          sourceType: ['album'],
          success (res) {
            const localIds = res.localIds;
            localIds && localIds.forEach(localId => {
              self.getBase64Data(localId);
            });
          }
        })
      } else {
        wx.chooseImage({
          count: 1,
          sizeType: ['original', 'compressed'],
          sourceType: ['camera'],
          success (res) {
            const localIds = res.localIds
            self.getBase64Data(localIds[0]);
          }
        })
      }
    }

    getBase64Data = (localId) => {
      const self = this;
      wx.getLocalImgData({
        localId: localId,
        success: function (res) {
          var localData = res.localData; // localData是图片的base64数据，可以用img标签显示
          self.uploadImg(localData);
        }
      });
    }

    uploadImg = (fileData) => {
      Toast.loading('上传中...', 10);
      const { mine, mineAction } = this.props;
      const url = '/upload?token=' + cb.rest.AppContext.token;
      const params = yardformdata.toFormData(fileData, 'file.jpg');
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.send(params);
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;
        if (xhr.status === 200) {
          var ajaxResult = JSON.parse(xhr.responseText);
          Toast.hide();
          if (ajaxResult.code == 200) {
            const responseData = ajaxResult.data
            const picAddress = mine.get('fileurl') + responseData;
            mineAction.modifyMineInfo(mine.get('user').set('avatar', picAddress));
            cb.utils.Toast('上传成功', 'success');
          } else {
            cb.utils.Toast(ajaxResult.message, 'error');
          }
        }
      };
    }
}

function mapPropsToState (state) {
  return {
    mine: state.mine
  }
}

function mapPropsToDispatch (dispatch) {
  return {
    mineAction: bindActionCreators(mineActions, dispatch),
    dispatch
  }
}
export default connect(mapPropsToState, mapPropsToDispatch)(ModifyInfo)
