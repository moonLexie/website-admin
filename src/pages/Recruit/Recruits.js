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
  Icon 
} from 'antd';
import StandardTable from '@/components/StandardTable';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import UploadPhoto from '@/components/UploadPhoto';
import styles from './Recruits.less'
import BraftEditor from 'braft-editor'
import { ContentUtils } from 'braft-utils'
import 'braft-editor/dist/index.css'
import { Api, hostname } from '../../services/apis'
import ApiService from '../../apiService'


const FormItem = Form.Item;
const Option = Select.Option;
const confirm = Modal.confirm;
const getValue = obj =>
  Object.keys(obj)
    .map(key => obj[key])
    .join(',');


class createForm extends React.Component {

  okHandle = () => {
    const that = this;
    this.props.form.validateFields((err, fieldsValue) => {
      if (err) return;

      if (fieldsValue.post_describe) {
        fieldsValue.post_describe = fieldsValue.post_describe.toHTML();
      }
      if (fieldsValue.public_time) {
        fieldsValue.public_time = moment(fieldsValue.public_time).format('YYYY-MM-DD');
      }
      
      if (this.props.modalTitle === '新增') {
        this.props.handleSubmit(fieldsValue, 'add');
      } else {
        fieldsValue.id = this.props.info ? this.props.info.id : null;
        this.props.handleSubmit(fieldsValue, 'edit');
      }
    });
  };

  cancelHandle = () => {
    this.props.handleModalVisible();
  }


  componentWillReceiveProps(nextProps) {
    if (nextProps.modalVisible && this.props.modalVisible !== nextProps.modalVisible) {
      if (!this.props.info) {
        this.props.form.resetFields();
        this.props.form.setFieldsValue ({
          public_time: moment()
        })
      }
    }
  }

  //富文本编辑器删除图片
  removeImg = (block) => {
    console.log(111,block)
  }

  uploadHandler = (param) => {

    if (!param.file) {
      return false
    }

    this.props.form.setFieldsValue({
      post_describe: ContentUtils.insertMedias(this.props.form.getFieldValue('post_describe'), [{
        type: 'IMAGE',
        url: URL.createObjectURL(param.file)
      }])
    })
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
        onClick: this.removeImg
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
        title={modalTitle ? `${modalTitle}招聘` : '招聘'}
        width={900}
        visible={modalVisible}
        onOk={this.okHandle}
        onCancel={() => handleModalVisible()}
        confirmLoading={modalLoading}
      >
        <FormItem {...col} label="岗位名称">
          {form.getFieldDecorator('post', {
            rules: [{ required: true, message: '请输入岗位名称！' }],
          })(<Input placeholder="请输入岗位名称" />)}
        </FormItem>
        <FormItem {...col} label="发布时间">
          {form.getFieldDecorator('public_time', {
            rules: [{ required: true, message: '请选择发布时间！' }],
          })(
            <DatePicker placeholder="请选择时间" style={{ width: '100%' }}/>)}
        </FormItem>
        <FormItem {...col} label="岗位描述">
          {form.getFieldDecorator('post_describe', {
            rules: [{
              required: true,
              validator: (_, value, callback) => {
                if (value.isEmpty()) {
                  callback('请输入岗位描述！')
                } else {
                  callback()
                }
              }
            }],
          })(<BraftEditor
            className="myEditor"
            placeholder="请输入岗位描述"
            excludeControls={['superscript', 'subscript', 'strike-through', 'code', 'emoji', 'media']}
            imageControls={imageControls}
            // extendControls={extendControls}
          />)}
        </FormItem>
      </Modal>
    );
  }
}
const CreateForm = Form.create({
  mapPropsToFields(props) {
    if (props.info) {

      return {
        post: Form.createFormField({ value: props.info.post, }),
        public_time: Form.createFormField({ value: moment(props.info.public_time) }),
        post_describe: Form.createFormField({ value: BraftEditor.createEditorState(props.info.post_describe), }),
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
class Recruits extends PureComponent {
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
      title: '岗位名称',
      dataIndex: 'post',
    },
    {
      title: '发布时间',
      dataIndex: 'public_time',
    },
    {
      title: '操作',
      render: (text, record) => (
        <Fragment>
          <a onClick={() => this.handleModalVisible(true, { modalTitle: "编辑", info: record })}>编辑</a>
          <Divider type="vertical" />
          <a href="javascript:;" onClick={() => this.delRecruit(record, 'one')}>删除</a>
        </Fragment>
      ),
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

      fieldsValue.public_time = fieldsValue.public_time ? moment(fieldsValue.public_time).format('YYYY-MM-DD') : null;
      this.setState({ loading: true })
      ApiService.CallApi(
        'post',
        Api.rmFindAllRecruitInfo,
        {
          ...fieldsValue,
          indexPage: that.state.current,
          pageSize: that.state.pageSize,
        },
        (data) => {

          that.setState({ loading: false })
          const { recruitInfo, totalNum } = data && data[0];
          if (!recruitInfo || totalNum === 0) {
            const msg = data[0] && typeof data[0] === 'string' ? data[0] : '暂无数据';
            notification.destroy();
            notification['warning']({ message: msg })
          }

          if (recruitInfo && Array.isArray(recruitInfo)) {
            let tableData = {
              list: recruitInfo.length !== 0 ? recruitInfo : [],
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

  //删除招聘
  delRecruit = (record, type) => {
    const that = this;
    const placeholder = record && record.post ? record.post : '所选';
    confirm({
      title: `确定删除${placeholder}招聘吗?`,
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
          Api.rmDeleteRecruitInfoById,
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

  handleSubmit = (fieldsValue, type) => {
    const that = this;
    let url = '';

    if (type === 'add') {
      url = Api.rmAddRecruitInfo
    } else {
      url = Api.rmModifyRecruitInfoById;
    }
    that.setState({ modalLoading: true, info: fieldsValue });
    ApiService.CallApi(
      'post',
      url,
      {
        ...fieldsValue
      },
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
            <FormItem label="岗位名称">
              {getFieldDecorator('post')(<Input placeholder="请输入岗位名称" />)}
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="发布时间">
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

    const parentMethods = {
      handleSubmit: this.handleSubmit,
      handleModalVisible: this.handleModalVisible,
    };

    const parentDatas = {
      modalVisible: this.state.modalVisible,
      modalTitle: this.state.modalTitle,
      modalLoading: this.state.modalLoading,
      info: this.state.info,
    };
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
                <Button onClick={this.delRecruit} selectedKeys={[]}>批量删除</Button>
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
        <CreateForm {...parentMethods} {...parentDatas}/>
      </PageHeaderWrapper>
    );
  }
}

export default Recruits;
