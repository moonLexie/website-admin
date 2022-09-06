import React, { PureComponent } from 'react';
import { connect } from 'dva';
import {
  Form,
  Input,
  Button,
  Card,
  Icon,
  Upload,
  Modal,
  notification,
  Spin
} from 'antd';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import { Api, hostname} from '../../services/apis'
import ApiService from '../../apiService'
import UploadPhoto from '@/components/UploadPhoto';

const FormItem = Form.Item;
const { TextArea } = Input;

@connect(({ loading }) => ({
  submitting: loading.effects['form/submitRegularForm'],
}))
@Form.create()
class Baseinfo extends PureComponent {
  state = {
    previewVisible: false,
    previewImage: '',
    fileList: [],
    fileList2: [],
    loading : false,
    id:'',
    delImgids:[],
    wxfile:{},
    lbfile:[],
  }

  componentDidMount(){
    this.initData();
  }

  initData = () => {
    const that = this;
    that.setState({ loading: true });

    ApiService.CallApi(
      'post',
      Api.emfindAll,
      {},
      (data)=>{
        that.setState({ loading: false });
        that.setData(data);
      },
      (err) => {
        that.setState({ loading: false })
        notification.destroy();
        notification['error']({ message: err })
      })
  }

  setData = (data) => {
    const that = this;
    const { baseInfo, carouselPic } = data && data[0];

    if (!baseInfo && !carouselPic) {
      const msg = data[0] && typeof data[0] === 'string' ? data[0] : '暂无数据';
      notification.destroy();
      notification['warning']({ message: msg })
      return;
    }

    if (baseInfo && Object.keys(baseInfo).length !== 0) {
      that.props.form.setFieldsValue({
        title: baseInfo.web_name ? baseInfo.web_name : '',
        phone: baseInfo.bys_brand_tel ? baseInfo.bys_brand_tel : '',
        tel: baseInfo.service_tel ? baseInfo.service_tel : '',
        officeTel: baseInfo.company_tel ? baseInfo.company_tel : '',
        busTel: baseInfo.business_tel ? baseInfo.business_tel : '',
        record: baseInfo.web_ownership ? baseInfo.web_ownership : '',
        companyProfile: baseInfo.company_introduce ? baseInfo.company_introduce : '',
        record_num: baseInfo.record_num ? baseInfo.record_num : '',
      })
      if (baseInfo.official_pic) {
        that.setState({
          fileList: [{
            uid: '-1',
            status: 'done',
            url: hostname + baseInfo.official_pic,
          }]
        })
      }

      if (baseInfo.id) {
        that.setState({ id: baseInfo.id });
      }
    }

    if (carouselPic && carouselPic.length > 0) {
      const fileList2 = [];
      carouselPic.forEach((item, i) => {
        let file = {
          uid: item.id,
          imageId: item.id,
          status: 'done',
          url: hostname + item.carousel_pic,
        }
        fileList2.push(file);
      })
      that.setState({ fileList2 });
    }
  }

  handleCancel = () => this.setState({ previewVisible: false })

  handlePreview = (file) => {
    console.log(file.url)
    this.setState({
      previewImage: file.url || file.thumbUrl,
      previewVisible: true,
    });
  }


  handleChange = ({ file, fileList }, name ) => {
    this.setState({ [name]:fileList })
  } 

  handleSubmit = e => {
    const that = this;
    e.preventDefault();
    if (this.state.fileList.length === 0) {
      notification.destroy();
      notification['warning']({ message: `请上传运美达官方微信图片！` });
      return;
    }
    if (this.state.fileList2.length === 0) {
      notification.destroy();
      notification['warning']({ message: `请上传首页轮播图！` });
      return;
    }
    this.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        let param = {
          web_name: values.title,
          bys_brand_tel: values.phone,
          service_tel: values.tel,
          business_tel: values.busTel,
          web_ownership: values.record,
          record_num: values.record_num,
          company_introduce: values.companyProfile,
          company_tel: values.officeTel,
          id: that.state.id,
          delCarouselPicIds: this.state.delImgids.length===0?'null':this.state.delImgids.join(','),
          ishow:'是'
        }

        const formData = new FormData();
        Object.entries(param).forEach((item) => {
          if (item[1]) {
            formData.append(item[0], item[1] || '');
          }
        });
        if (Object.keys(that.state.wxfile).length!==0){
          formData.append('officialPic', that.state.wxfile);
        }
        if (this.state.lbfile.length!==0){
          this.state.lbfile.forEach((file) => {
            formData.append('carouselPics', file);
          })
        }

        that.setState({loading:true});
        ApiService.CallApi(
          'post',
          Api.emmodifyBaseInfo, 
          formData,
          (data) => {
            that.setState({ loading: false });
            if (data && data[0]){
              notification.destroy();
              notification['success']({ message: "修改成功！" })
              that.setState({ delImgids: []})
            }else{
              notification.destroy();
              notification['success']({ message: data })
            }
            that.setData(data);
            that.setState({ wxfile: {}, lbfile: [] });
          },
          (err) => {
            that.setState({loading:false})
            notification.destroy();
            notification['error']({ message: err })
          });
      }
    });
  };

  removePic = (info) => {
    if (info.imageId) {
      this.setState(state => ({ delImgids: [...state.delImgids, info.imageId]}));
    }else{
      const { lbfile} = this.state;
      lbfile.forEach((item,index)=>{
        if (item.uid === info.uid){
          lbfile.splice(index, 1);
          this.setState({ lbfile: lbfile });
          return;
        }
      })
      
    }
  }

  beforeUpload = (file, name) => {
    if(name==='wxfile'){
      this.setState({ [name]: file });  
    }else{
      this.setState(state=>({ [name]:[ ...state[name],file ] }));
    }
    return false;
  }

  render() {
    const { submitting } = this.props;
    const {
      form: { getFieldDecorator, getFieldValue },
    } = this.props;

    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 7 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 12 },
        md: { span: 10 },
      },
    };

    const submitFormLayout = {
      wrapperCol: {
        xs: { span: 24, offset: 0 },
        sm: { span: 10, offset: 7 },
      },
    };

    const { previewVisible, previewImage, fileList, fileList2 } = this.state;
    const uploadButton = (
      <div>
        <Icon type="plus" />
        <div className="ant-upload-text">上传</div>
      </div>
    );

    return (
      <PageHeaderWrapper>
        <Spin spinning={this.state.loading}>
          <Card bordered={false}>
            <Form onSubmit={this.handleSubmit} hideRequiredMark style={{ marginTop: 8 }}>
              <FormItem {...formItemLayout} label="网站名称">
                {getFieldDecorator('title', {
                  rules: [{
                      required: true,
                      message: '请填写网站名称',
                    }],
                })(<Input placeholder='请输入网站名称' />)}
              </FormItem>
              <FormItem {...formItemLayout} label='白云山品牌操盘人电话'>
                {getFieldDecorator('phone', {
                  rules: [
                    {
                      required: true,
                      message: '请输入白云山品牌操盘人电话',
                    },
                    {
                      pattern: /^1[34578]\d{9}$/,
                      message: '请输入正确的手机号码',
                    }
                  ],
                })(<Input placeholder='请输入白云山品牌操盘人电话' />)}
              </FormItem>
              <FormItem {...formItemLayout} label='客服电话'>
                {getFieldDecorator('tel', {
                  rules: [

                    {
                      required: true,
                      message: '请输入客服电话',
                    }, {
                      pattern: /^(\(\d{3,4}\)|\d{3,4}-|\s)?\d{7,14}$/,
                      message: '请输入正确的固定电话',
                    },
                  ],
                })(<Input placeholder='请输入客服电话' />)}
              </FormItem>
              <FormItem {...formItemLayout} label='公司办公电话'>
                {getFieldDecorator('officeTel', {
                  rules: [
                    {
                      required: true,
                      message: '请输入公司办公电话',
                    },
                  ],
                })(<Input placeholder='请输入公司办公电话' />)}
              </FormItem>
              <FormItem {...formItemLayout} label='招商电话'>
                {getFieldDecorator('busTel', {
                  rules: [
                    {
                      required: true,
                      message: '请输入招商电话',
                    }, {
                      pattern: /^(\(\d{3,4}\)|\d{3,4}-|\s)?\d{7,14}$/,
                      message: '请输入正确的固定电话',
                    },
                  ],
                })(<Input placeholder='请输入招商电话' />)}
              </FormItem>
              <FormItem {...formItemLayout} label='运美达官方微信'>
                {getFieldDecorator('weixin')(
                  <UploadPhoto
                    num={1}
                    accept=".png,.jpg,.jpeg,.gif,.bmp"
                    fileList={fileList}
                    beforeUpload={(e) => this.beforeUpload(e,'wxfile')}
                    handleChange={(e) => this.handleChange(e, 'fileList')}
                  />
                )}
              </FormItem>
              <FormItem {...formItemLayout} label='网站所有权'>
                {getFieldDecorator('record', {
                  rules: [
                    {
                      required: true,
                      message: '请输入网站所有权',
                    },
                  ],
                })(<Input placeholder='请输入网站所有权' />)}
              </FormItem>
              <FormItem {...formItemLayout} label='备案号'>
                {getFieldDecorator('record_num', {
                  rules: [
                    {
                      required: true,
                      message: '请输入备案号',
                    },
                  ],
                })(<Input placeholder='请输入备案号' />)}
              </FormItem>
              <FormItem {...formItemLayout} label='企业介绍'>
                {getFieldDecorator('companyProfile', {
                  rules: [
                    {
                      required: true,
                      message: '请输入企业介绍',
                    },
                  ],
                })(
                  <TextArea
                    style={{ minHeight: 32 }}
                    placeholder='请输入企业介绍'
                    rows={4}
                  />
                )}
              </FormItem>
              <FormItem {...formItemLayout} label='首页轮播图'>
                <UploadPhoto
                  num={10}
                  accept=".png,.jpg,.jpeg,.gif,.bmp"
                  fileList={fileList2}
                  beforeUpload={(e) => this.beforeUpload(e, 'lbfile')}
                  handleChange={(e) => this.handleChange(e, 'fileList2')}
                  onRemove={this.removePic}
                />
              </FormItem>
              <FormItem {...submitFormLayout} style={{ marginTop: 32 }}>
                <Button type="primary" htmlType="submit" loading={submitting} >
                  提交
                </Button>
                <Button style={{ marginLeft: 8 }}>
                  取消
                </Button>
              </FormItem>
            </Form>
            <Modal visible={previewVisible} footer={null} onCancel={this.handleCancel}>
              <img alt="example" style={{ width: '100%' }} src={previewImage} />
            </Modal>
          </Card>
        </Spin>
      </PageHeaderWrapper>
    );
  }
}

export default Baseinfo;
