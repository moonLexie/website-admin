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
  Divider,
  notification,
} from 'antd';
import StandardTable from '@/components/StandardTable';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import styles from './Users.less';
import { Api, hostname } from '../../services/apis'
import ApiService from '../../apiService'

const FormItem = Form.Item;
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

      if (fieldsValue.password !== fieldsValue.comfirm_password){
        notification.destroy();
        notification['warning']({message:'密码与重复密码不一致！'})
        return;
      }

      delete fieldsValue.comfirm_password;
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
        // this.props.form.resetFields();
      }
    }
  }

  render() {
    const { modalVisible, form, handleSubmit, handleModalVisible, modalLoading, modalTitle  } = this.props;

    const col = {
      labelCol: { span: 5 },
      wrapperCol: { span: 17 }
    }

    return (
      <Modal
        destroyOnClose title={modalTitle ? `${modalTitle}用户` : '用户'}
        visible={modalVisible}
        onOk={this.okHandle}
        onCancel={this.cancelHandle}
        confirmLoading={modalLoading} >
        <FormItem {...col} label="用户名">
          {form.getFieldDecorator('username', {
            rules: [{ required: true, message: '请输入用户名！' }],
          })(<Input placeholder="请输入用户名" disabled={modalTitle=='编辑'?true:false}/>)}
        </FormItem>
        <FormItem {...col} label="密码">
          {form.getFieldDecorator('password', {
            rules: [{ required: true, message: '请输入密码！' },
              { min: 6, message: '长度不能少于6位'}],
          })(<Input placeholder="请输入密码" />)}
        </FormItem>
        <FormItem {...col} label="重复密码">
          {form.getFieldDecorator('comfirm_password', {
            rules: [{ required: true, message: '请输入重复密码！' },{min: 6, message: '长度不能少于6位'}],
          })(<Input placeholder="请输入重复密码" />)}
        </FormItem>
      </Modal>
    );
  }
}
const CreateForm = Form.create({
  mapPropsToFields(props) {
    console.log(props.info)
    if (props.info) {
      return {
        username: Form.createFormField({ value: props.info.username, }),
        password: Form.createFormField({ value: props.info.password, }),
        comfirm_password: Form.createFormField({ value: props.info.password, }),
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
class Users extends PureComponent {
  state = {
    modalVisible: false,
    updateModalVisible: false,
    selectedRows: [],
    formValues: {},
    current: 1,
    pageSize: 10,
    data: {list: []},
    modalLoading: false
  };

  columns = [
    {
      title: '用户名',
      dataIndex: 'username',
    },
    {
      title: '注册时间',
      dataIndex: 'register_time',
      sorter: true,
      render: val => <span>{val?moment(val).format('YYYY-MM-DD hh:mm:ss'):'-'}</span>
    },
    {
      title: '操作',
      render: (text, record) => (
        <Fragment>
          <a onClick={() => this.handleModalVisible(true, { modalTitle: "编辑", info: record })}>编辑</a>
          {
            record.username !== 'admin' ?
            <span>
              <Divider type="vertical" />
              <a href="javascript:;" onClick={() => this.delUser(record, 'one')}>删除</a>
            </span>
            : null
          }
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

      this.setState({ loading: true })
      ApiService.CallApi(
        'post',
        Api.umFindAllUserInfo,
        {
          ...fieldsValue,
          indexPage: that.state.current,
          pageSize: that.state.pageSize,
        },
        (data) => {

          that.setState({ loading: false })
          const { UserInfo, totalNum } = data && data[0];
          if (!UserInfo || totalNum === 0) {
            const msg = data[0] && typeof data[0] === 'string' ? data[0] : '暂无数据';
            notification.destroy();
            notification['warning']({ message: msg })
          }

          if (UserInfo && Array.isArray(UserInfo)) {
            let tableData = {
              list: UserInfo.length !== 0 ? UserInfo : [],
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

  //删除用户
  delUser = (record, type) => {
    const that = this;
    const placeholder = record && record.username ? record.username : '所选';
    confirm({
      title: `确定删除${placeholder}用户吗?`,
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
          Api.umDeleteUserInfoById,
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

  //添加、编辑
  handleSubmit = (fieldsValue, type) => {
    const that = this;
    let url = '';

    if (type === 'add') {
      url = Api.umAddUser
    } else {
      url = Api.umModifyUserInfoById;
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
        if (data && data.message.indexOf('成功') > -1) {
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


  handleSelectRows = rows => {
    this.setState({
      selectedRows: rows,
    });
  };

  handleModalVisible = (flag, record) => {
    this.setState({
      modalVisible: !!flag,
      ...record
    });
    if (!record || !record.info) {
      this.setState({ info: null });
    }
  };


  renderForm() {
      const {
          form: { getFieldDecorator },
      } = this.props;
      return (
        <Form onSubmit={this.handleSearch} layout="inline">
          <Row gutter={{ md: 8, lg: 24, xl: 48 }}>
            <Col md={8} sm={24}>
              <FormItem label="用户名">
                {getFieldDecorator('username')(<Input placeholder="请输入用户名" />)}
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
                <Button onClick={this.delUser} selectedKeys={[]}>批量删除</Button>
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

export default Users;
