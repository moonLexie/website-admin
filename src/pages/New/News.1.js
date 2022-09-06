import React, { PureComponent, Fragment } from 'react';
import { connect } from 'dva';
import moment from 'moment';
import router from 'umi/router';
import {
  Row,
  Col,
  Card,
  Form,
  Input,
  Button,
  Modal,
  message,
  Badge,
  Divider,
  Upload,
  Select,
  DatePicker,
  notification,
  Radio ,
  Icon,
} from 'antd';
import StandardTable from '@/components/StandardTable';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import UploadPhoto from '@/components/UploadPhoto';
import styles from './News.less'
import BraftEditor from 'braft-editor'
import { ContentUtils } from 'braft-utils'
import 'braft-editor/dist/index.css'
import { Api, hostname } from '../../services/apis'
import ApiService from '../../apiService'


const FormItem = Form.Item;
const Option = Select.Option;
const confirm = Modal.confirm;
const TextArea = Input.TextArea;
const RadioGroup = Radio.Group;
const getValue = obj =>
  Object.keys(obj)
    .map(key => obj[key])
    .join(',');


class createForm extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      file:null,
      fileList: [],
    }
  }

  handleChange = ({ file, fileList }) => {
    this.setState({ fileList })
  }

  okHandle = () => {
    const that = this;
    this.props.form.validateFields((err, fieldsValue) => {
      if (err) return;
      if (this.state.fileList.length === 0) {
        notification.destroy();
        notification['warning']({ message: '请上传新闻封面！' });
        return;
      }


      if (fieldsValue.news_content) {
        fieldsValue.news_content = fieldsValue.news_content.toHTML();
      }
      console.log(fieldsValue.news_content)
      return;
      if (this.props.modalTitle === '新增') {
        this.props.handleSubmit(fieldsValue, this.state.file, 'add');
      } else {
        fieldsValue.id = this.props.info ? this.props.info.id : null;
        this.props.handleSubmit(fieldsValue, this.state.file, 'edit');
      }
    });
  };

  cancelHandle = () => {
    this.setState({ fileList: [] })
    this.props.handleModalVisible();
  }

  setInfo = (info) => {
    let fileList = [];
    if (info) {
      fileList = [{
        uid: '-1',
        status: 'done',
        url: info.product_pic ? hostname + info.product_pic : '',
      }]
    }
    this.setState({ fileList });
  }

  beforeUpload = (file) => {
    this.setState({ file: file });
    return false;
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.modalVisible && this.props.modalVisible !== nextProps.modalVisible) {
      this.setInfo(nextProps.info); 
      if (!this.props.form.getFieldValue('ishow')) {
        this.props.form.setFieldsValue({
          ishow: '否',
        })
      }
    }
  }
  submitContent = async () => {
    // 在编辑器获得焦点时按下ctrl+s会执行此方法
    // 编辑器内容提交到服务端之前，可直接调用editorState.toHTML()来获取HTML格式的内容
    const htmlContent = this.state.editorState.toHTML()
    const result = await saveEditorContent(htmlContent)
  }

  //富文本上传
  myUploadFn = (param) => {
    const successFn = (file) => {
      // 假设服务端直接返回文件上传后的地址
      // 上传成功后调用param.success并传入上传后的文件地址
      file.forEach(item => {
        let fileName = item.url.split('/');
        fileName = fileName[fileName.length - 1];
        param.success({
          url: hostname + item.url,
          meta: {
            id: item.id,
            title: fileName,
            alt: '显示有误',
            url: item.url
          }
        })
      })
    }

    const progressFn = (event) => {
      // 上传进度发生变化时调用param.progress
      param.progress(event.loaded / event.total * 100)
    }

    const errorFn = (response) => {
      // 上传发生错误时调用param.error
      param.error({
        msg: response
      })
    }

    const fd = new FormData()
    fd.append('pictureFile', param.file)

    // that.setState({ loading: true });
    ApiService.CallApi(
      'post',
      Api.UpLoadPic,
      fd,
      (data) => {

        // that.setState({ loading: false });
        notification.destroy();
        if (data && data.message.indexOf('成功') > -1 && data.file) {
          // that.setState({ modalVisible: false });
          successFn(data.file)
        } else {
          notification['error']({ message: data.message });
          errorFn(data.message)
        }
      },
      (err) => {
        // that.setState({ loading: false });
        notification.destroy();
        notification['error']({ message: err })
        errorFn(err)
      });

  }

  //富文本媒体库删除图片
  myMediaChange = (param) => {
    console.log(111, param)
    if (param[param.length - 1].uploadProgress !== 1) return;
    const mediaFileList = this.state.mediaFileList;
    let paramUrls = [];
    param.forEach(item => {
      const url = item.meta.url;
      paramUrls.push(url);
    })

    if (param.length < mediaFileList.length) {
      let removeUrl = [];
      paramUrls.forEach(item => {
        if (mediaFileList.indexOf(item) === -1) {
          removeUrl.push(item)
        }
      })

      //删除图片
      ApiService.CallApi(
        'post',
        Api.UpLoadPic,
        { url: removeUrl.join(',') },
        (data) => {

          // that.setState({ loading: false });
          notification.destroy();
          if (data && data.message.indexOf('成功') > -1) {
          } else {
            notification['error']({ message: data.message });
          }
        },
        (err) => {
          // that.setState({ loading: false });
          notification.destroy();
          notification['error']({ message: err })
        });
    }

    this.setState({ mediaFileList: paramUrls });
  }

  //删除图片接口
  deleteImg = (removeUrl) => {
    const that = this;
    //删除图片
    ApiService.CallApi(
      'post',
      Api.deletePicByImgPaths,
      { imgPaths: removeUrl },
      (data) => {
        notification.destroy();
        if (data && data.message.indexOf('成功') > -1) {
          that.props.form.validateFields((err, fieldsValue) => {
            let content = fieldsValue.news_content.toHTML();
            let dele = `<img src="${hostname+removeUrl}"/>`
            let content2 = content.replace(dele, "");
            if (fieldsValue.news_content) {
              that.props.form.setFieldsValue({
                news_content: BraftEditor.createEditorState(content2)
              })
            }
          })
          this.props.form.setFieldsValue({
            news_content: ContentUtils.insertMedias(this.props.form.getFieldValue('news_content'), [{
              type: 'IMAGE',
              url: hostname + data.file[0].url
            }])
          })
        } else {
          notification['error']({ message: data.message });
        }
      },
      (err) => {
        notification.destroy();
        notification['error']({ message: err })
      });
  }

  //富文本编辑器删除图片
  removeImg = (mediaData) => {
    const onclick = (mediaData) => {
      if (mediaData) {
        let removeUrls = mediaData.url && mediaData.url.split('/');
        let removeUrl = '/' + removeUrls[removeUrls.length - 2] + '/' + removeUrls[removeUrls.length - 1];
        this.deleteImg(removeUrl);
      }
    }
    return (
      <Icon type="delete" style={{ color: '#fff', opacity: '0.5', margin: '-10px 10px 0px 5px' }} onClick={() => onclick(mediaData)} />
    )
  }
  
  uploadHandler = (param) => {

    if (!param.file) {
      return false
    }

    const fd = new FormData()
    fd.append('pictureFile', param.file)
    ApiService.CallApi(
      'post',
      Api.UpLoadPic,
      fd,
      (data) => {
        if (data && data.message.indexOf('成功') > -1 && data.file) {
          this.props.form.setFieldsValue({
            news_content: ContentUtils.insertMedias(this.props.form.getFieldValue('news_content'), [{
              type: 'IMAGE',
              url: hostname + data.file[0].url
            }])
          })
        } else {
          notification.destroy();
          notification['error']({ message: data.message });
        }
      },
      (err) => {
        notification.destroy();
        notification['error']({ message: err })
      });

    /* this.props.form.setFieldsValue({
      news_content: ContentUtils.insertMedias(this.props.form.getFieldValue('news_content'), [{
        type: 'IMAGE',
        url: URL.createObjectURL(param.file)
      }])
    }) */
  }

  render() {
    const { modalVisible, form, handleSubmit, handleModalVisible, modalTitle,  modalLoading } = this.props;
    const col = {
      labelCol: { span: 5 },
      wrapperCol: { span: 17 }
    }

    const imageControls = [
      'float-left',
      'float-right',
      'align-left', // 设置图片居左
      'align-center', // 设置图片居中
      'align-right', // 设置图片居右
      'link',
      'size',
      'remove',
      {
        text: 'remove', // 指定控件文字，可传入jsx
        // render: this.removeImg,
        onClick: (block) => {
          this.props.form.setFieldsValue({
            news_content: ContentUtils.removeMedia(this.props.form.getFieldValue('news_content'), block)
          })
          BraftEditor.unlockEditor();
          // BraftEditor.createEditorState.setDraftProps({ readOnly: false })
          //setDraftProps({ readOnly: false })
        }
      },
    ]

    const extendControls = [
      {
        key: 'antd-uploader',
        type: 'component',
        component: (
          <Upload
            accept="image/*"
            showUploadList={false}
            customRequest={this.uploadHandler}
          >
            {/* 这里的按钮最好加上type="button"，以避免在表单容器中触发表单提交，用Antd的Button组件则无需如此 */}
            <button type="button" className="control-item button upload-button" data-title="插入图片">
              <Icon type="picture" theme="filled" />
            </button>
          </Upload>
        )
      }
    ]

    return (
      <Modal
        destroyOnClose
        title={modalTitle ? `${modalTitle}新闻` : '新闻'}
        width={900}
        visible={modalVisible}
        onOk={this.okHandle}
        onCancel={() => handleModalVisible()}
        confirmLoading={modalLoading}
      >
        <FormItem {...col} label="新闻标题">
          {form.getFieldDecorator('title', {
            rules: [{ required: true, message: '请输入新闻标题！' }],
          })(<Input placeholder="请输入新闻标题" />)}
        </FormItem>
        <FormItem {...col} label="新闻副标题">
          {form.getFieldDecorator('small_title', {
            rules: [{ required: true, message: '请输入新闻副标题！' }],
          })(<Input placeholder="请输入新闻副标题" />)}
        </FormItem>
        <FormItem {...col} label="新闻日期">
          {form.getFieldDecorator('public_time')(
            <DatePicker style={{ width: '100%' }} />)}
        </FormItem>
        <FormItem {...col} label="新闻简介">
          {form.getFieldDecorator('news_introduction')(
            <TextArea row = {4}  placeholder="请输入简介" />)}
        </FormItem>
        <FormItem {...col} label="新闻封面">
          {form.getFieldDecorator('news_cover')(<UploadPhoto num={1}
            accept=".png,.jpg,.jpeg,.gif,.bmp"
            fileList={this.state.fileList}
            beforeUpload={this.beforeUpload}
            handleChange={this.handleChange}
          />)}
        </FormItem>
        <FormItem {...col} label="新闻内容">
          {form.getFieldDecorator('news_content', {
            rules: [{
              required: true,
              validator: (_, value, callback) => {
                if (value.isEmpty()) {
                  callback('请输入新闻内容')
                } else {
                  callback()
                }
              }
            }],
          })(<BraftEditor
            className="myEditor"
            placeholder="请输入新闻内容"
            excludeControls={['superscript', 'subscript', 'strike-through', 'code', 'emoji'/* ,'media' */]}
            /* media={{
              uploadFn: this.myUploadFn,
              onChange: this.myMediaChange,
              accepts: { video: false, audio: false} ,
              externals: { video: false, audio: false },
            }} */
            imageControls={imageControls}
            // extendControls={extendControls}
          />)}
          
        </FormItem>
        <FormItem {...col} label="放到首页">
          {form.getFieldDecorator('ishow')(
            <RadioGroup >
              <Radio value="是">是</Radio>
              <Radio value="否">否</Radio>
            </RadioGroup>)}
        </FormItem>
      </Modal>
    );
  }
}
const CreateForm = Form.create({
  mapPropsToFields(props) {
    if (props.info) {

      return {
        title: Form.createFormField({ value: props.info.title, }),
        small_title: Form.createFormField({ value: props.info.small_title, }),
        public_time: Form.createFormField({ value: props.info.public_time, }),
        news_introduction: Form.createFormField({ value: props.info.news_introduction, }),
        news_content: Form.createFormField({ value: BraftEditor.createEditorState(props.info.news_content), }),
        ishow: Form.createFormField({ value: props.info.ishow, }),
      };
    }
  }
})(createForm)



/* eslint react/no-multi-comp:0 */
@connect(({ rule, loading }) => ({
  rule,
  loading: loading.models.rule,
}))
@Form.create()
class News extends PureComponent {
  state = {
    modalVisible: false,
    updateModalVisible: false,
    selectedRows: [],
    formValues: {},
    current: 1,
    pageSize: 10,
    modalTitle: '',
    selectInfo: {},
    modalLoading: false
  };

  columns = [
    {
      title: '新闻标题',
      dataIndex: 'title',
      width: 200,
    },
    {
      title: '新闻日期',
      dataIndex: 'public_time',
      render: val => <span>{val ? moment(val).format('YYYY-MM-DD') : '-'}</span>,
      width: 160,
    },
    {
      title: '新闻封面',
      dataIndex: 'news_cover',
      render: val => < img src={hostname + val}
        height="50" />,
      width: 100,
    },
    {
      title: '是否首页显示',
      dataIndex: 'ishow',
      width: 140,
    },
    {
      title: '新闻简介',
      dataIndex: 'news_introduction',
    },
    {
      title: '操作',
      render: (text, record) => (
        <Fragment>
          <a onClick={() => this.handleModalVisible(true, { modalTitle: "编辑", info: record })}>编辑</a>
          <Divider type="vertical" />
          <a href="javascript:;" onClick={() => this.delNews(record, 'one')}>删除</a>
        </Fragment>
      ),
      width: 140,
    },
  ];

  componentDidMount() {
    this.getData();
  }

  //查询产品表格
  getData = () => {
    const that = this;
    this.props.form.validateFields((err, fieldsValue) => {
      if (err) return;

      fieldsValue.public_time = fieldsValue.public_time ? moment(fieldsValue.public_time).format('YYYY-MM-DD'):null;
      this.setState({ loading: true })
      ApiService.CallApi(
        'post',
        Api.nmFindAllNews,
        {
          ...fieldsValue,
          indexPage: that.state.current,
          pageSize: that.state.pageSize,
        },
        (data) => {

          that.setState({ loading: false })
          const { news, totalNum } = data && data[0];
          if (!news || totalNum === 0) {
            const msg = data[0] && typeof data[0] === 'string' ? data[0] : '暂无数据';
            notification.destroy();
            notification['warning']({ message: msg })
          }

          if (news && Array.isArray(news)) {
            let tableData = {
              list: news.length !== 0 ? news : [],
              pagination: {
                current: that.state.current,
                pageSize: that.state.pageSize,
                total: totalNum
              }
            }
            that.setState({ data: tableData });
          } else {
            notification.destroy();
            notification['warning']({ message: '数据错误！' })
          }
        },
        (err) => {
          that.setState({ loading: false })
          notification.destroy();
          notification['error']({ message: err })
        })
    });
  }

  //搜索
  handleSearch = e => {
    e.preventDefault();
    this.setState({ current: 1 }, () => {
      this.getData();
    })
  };

  //翻页
  handleStandardTableChange = (pagination) => {
    this.setState({
      current: pagination.current,
      pageSize: pagination.pageSize,
      selectedRows: []
    }, () => {
      this.getData();
    })
  };

  //删除新闻
  delNews = (record, type) => {
    const that = this;
    const placeholder = record && record.title ? record.title : '所选';
    confirm({
      title: `确定删除${placeholder}新闻吗?`,
      okText: '确定',
      cancelText: '取消',
      onOk() {
        that.setState({ loading: true });
        let ids = [];
        if (type === 'one') {
          ids.push(record.id);
        } else {
          that.state.selectedRows.forEach(record => {
            ids.push(record.id);
          })
        }

        ApiService.CallApi(
          'post',
          Api.nmDeleteNewsById,
          { ids: ids.join(',') },
          (data) => {
            that.setState({ loading: false });

            notification.destroy();
            if (data && data.message.indexOf('成功') > -1) {
              notification['success']({ message: data.message });
              that.setState({ selectedRows: [] })
              if (that.state.data.list.length === ids.length) {
                that.setState({ current: that.state.current - 1 },
                  () => {
                    that.getData();
                  })
              } else {
                that.getData();
              }
            } else {
              notification.destroy();
              notification['error']({ message: data.message })
            }
          },
          (err) => {
            that.setState({ loading: false })
            notification.destroy();
            notification['error']({ message: err })
          })
      },
    });
  }

  handleFormReset = () => {
    this.props.form.resetFields();
  };


  handleModalVisible = (flag, record) => {
    this.setState({
      modalVisible: !!flag,
      ...record
    });
    if (!record || !record.info) {
      this.setState({ info: null, file: null });
    }
  };

  handleSelectRows = rows => {
    this.setState({
      selectedRows: rows,
    });
  };


  handleSubmit = (fieldsValue,file, type) => {
    const that = this;
    let url = '';
    const formData = new FormData();

    Object.entries(fieldsValue).forEach((item) => {
      if (item[1]) {
        formData.append(item[0], item[1] || '');
      }
    });
    formData.append('news_cover', file);

    if (type === 'add') {
      url = Api.nmAddNews
    } else {
      url = Api.nmModifyNewsById;
    }
    that.setState({ modalLoading: true, info: fieldsValue });
    ApiService.CallApi(
      'post',
      url,
      formData,
      (data) => {

        that.setState({ modalLoading: false });
        notification.destroy();
        if (data.message.indexOf("成功") > -1) {
          notification['success']({ message: data.message });
          that.setState({ modalVisible: false });
          that.getData();
        } else {
          notification['error']({ message: data.message });
        }
      },
      (err) => {
        that.setState({ modalLoading: false });
        notification.destroy();
        notification['error']({ message: err })
      });
  };


  renderForm() {
    const {
      form: { getFieldDecorator },
    } = this.props;

    return (
      <Form onSubmit={this.handleSearch} layout="inline">
        <Row gutter={{ md: 8, lg: 24, xl: 48 }}>
          <Col md={8} sm={24}>
            <FormItem label="新闻标题">
              {getFieldDecorator('title')(<Input placeholder="请输入新闻标题" />)}
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="新闻日期">
              {getFieldDecorator('public_time')(<DatePicker style={{width:'100%'}}/>)}
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <span className={styles.submitButtons}>
              <Button type="primary" htmlType="submit">
                查询
              </Button>
              <Button style={{ marginLeft: 8 }} onClick={this.handleFormReset}>
                重置
              </Button>
            </span>
          </Col>
        </Row>
      </Form>
    );
  }
  
  render() {
    const { selectedRows, updateModalVisible } = this.state;

    const col = {
      labelCol: { span: 5 },
      wrapperCol: { span: 17 }
    };

    const parentMethod = {
      handleSubmit: this.handleSubmit,
      handleModalVisible: this.handleModalVisible,
      // beforeUpload: this.beforeUpload,
    }
    const parentData = {
      modalVisible: this.state.modalVisible,
      modalTitle: this.state.modalTitle,
      modalLoading: this.state.modalLoading,
      info: this.state.info,
    }
    return (
      <PageHeaderWrapper>
        <Card bordered={false}>
          <div className={styles.tableList}>
            <div className={styles.tableListForm}>{this.renderForm()}</div>
            <div className={styles.tableListOperator}>
              <Button icon="plus" type="primary" onClick={() => this.handleModalVisible(true, { modalTitle: "新增" })}>
                新增
              </Button>
              {selectedRows.length > 0 && (
                <Button onClick={this.delNews} selectedKeys={[]}>批量删除</Button>
              )}
            </div>
            <StandardTable
              selectedRows={selectedRows}
              loading={this.state.loading}
              data={this.state.data}
              columns={this.columns}
              onSelectRow={this.handleSelectRows}
              onChange={this.handleStandardTableChange}
            />
          </div>
        </Card>
        <CreateForm {...parentData} {...parentMethod}/>
      </PageHeaderWrapper>
    );
  }
}

export default News;
