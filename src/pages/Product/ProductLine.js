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
  Select,
  Modal,
  Badge,
  Divider,
  Upload,
  notification
} from 'antd';
import StandardTable from '@/components/StandardTable';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import UploadPhoto from '@/components/UploadPhoto';
import styles from './ProductLine.less';
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

  constructor(props) {
    super(props);
    this.state = {
      file:null,
      fileList: [],
    }
  }
  okHandle = () => {
    const that = this;
    this.props.form.validateFields((err, fieldsValue) => {
      if (err) return;
      if (this.state.fileList.length === 0) {
        notification.destroy();
        notification['warning']({ message: '请上传品牌图片！' });
        return;
      }

      if (this.props.modalTitle === '新增') {
        this.props.handleSubmit(fieldsValue, this.state.file, 'add');
      } else {
        fieldsValue.id = this.props.brandInfo ? this.props.brandInfo.id : null;
        this.props.handleSubmit(fieldsValue,this.state.file, 'edit');
      }
    });
  };

  cancelHandle = () => {
    this.setState({ fileList: [] })
    this.props.handleModalVisible();
  }

  handleChange = ({ file, fileList }) => {
    this.setState({ fileList })
  }

  setBrandInfo = (brandInfo) => {
    let fileList = [];
    if (brandInfo) {

      fileList = [{
        uid: '-1',
        status: 'done',
        url: brandInfo.brand_logo ? hostname + brandInfo.brand_logo : '',
      }]
    }

    this.setState({ fileList });
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.modalVisible && this.props.modalVisible !== nextProps.modalVisible) {
      this.setBrandInfo(nextProps.brandInfo);
    }
  }


  beforeUpload = (file) => {
    this.setState({ file: file });
    return false;
  }

  render() {
    const { modalVisible, form, handleSubmit, handleModalVisible, modalTitle, brandInfo, modalLoading } = this.props;

    const col = {
      labelCol: { span: 5 },
      wrapperCol: { span: 17 }
    }

    return (
      <Modal
        destroyOnClose title={`${modalTitle}品牌线`}
        visible={modalVisible}
        onOk={this.okHandle}
        onCancel={this.cancelHandle}
        confirmLoading={modalLoading} >
        <FormItem {...col}
          label="品牌线名称" > {
            form.getFieldDecorator('brandName', {
              rules: [{ required: true, message: '请输入品牌线名称！' }, { pattern: /[^0-9]/, message: '请输入正确的名称！' }],
            })(< Input placeholder="请输入品牌线名称" />)
          }
        </FormItem>
        <FormItem {...col} label="品牌线logo" >
          {
            form.getFieldDecorator('brand_logo')(
              <UploadPhoto num={1}
                accept=".png,.jpg,.jpeg,.gif,.bmp"
                fileList={this.state.fileList}
                beforeUpload={this.beforeUpload}
                handleChange={this.handleChange}
              />)}
        </FormItem>
      </Modal>
    );
  }
}
const CreateForm = Form.create({
  mapPropsToFields(props) {
    if (props.brandInfo) {
      return {
        brandName: Form.createFormField({
          value: props.brandInfo.brand || props.brandInfo.brandName,
        }),
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
class ProductLine extends PureComponent {
  state = {
    modalVisible: false,
    updateModalVisible: false,
    selectedRows: [],
    formValues: {},
    current: 1,
    pageSize: 10,
    data: { list: [] },
    modalLoading: false
  };

  columns = [{
    title: '品牌线',
    dataIndex: 'brand',
    // mark to display a total number
    // needTotal: true,
  },
  {
    title: '品牌线logo',
    dataIndex: 'brand_logo',
    render: val => < img src={hostname + val}
      height="50" />
  },
  {
    title: '操作',
    render: (text, record) => (
      <Fragment >
        <a onClick={() => this.handleModalVisible(true, { modalTitle: "编辑", brandInfo: record })} > 编辑 </a>
        <Divider type="vertical" />
        <a href="javascript:;"
          onClick={() => this.delProjLine(record, 'one')} > 删除 </a>
      </Fragment>
    ),
  },
  ];

  componentDidMount() {
    this.getData();
  }

  //查询品牌数据
  getData = () => {
    const that = this;
    this.props.form.validateFields((err, fieldsValue) => {
      if (err) return;

      this.setState({ loading: true })
      ApiService.CallApi(
        'post',
        Api.pmFindAllBrand, {
          ...fieldsValue,
          indexPage: that.state.current,
          pageSize: that.state.pageSize,
        },
        (data) => {

          that.setState({ loading: false })
          const { brand, totalNum } = data && data[0];
          if (!brand || totalNum === 0) {
            const msg = data[0] && typeof data[0] === 'string' ? data[0] : '暂无数据';
            notification.destroy();
            notification['warning']({ message: msg })
          }

          if (brand && Array.isArray(brand)) {
            let tableData = {
              list: brand.length !== 0 ? brand : [],
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

  //删除品牌线
  delProjLine = (record, type) => {
    const that = this;
    const placeholder = record && record.brand ? record.brand : '所选';
    confirm({
      title: `确定删除${placeholder}品牌线吗?`,
      content: '同时该品牌线旗下产品',
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
          Api.pmDeleteBrandById, { ids: ids.join(',') },
          (data) => {
            that.setState({ loading: false });

            notification.destroy();
            if (data && data.indexOf('success:true')) {
              notification['success']({ message: '删除成功' });
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
              notification['error']({ message: data })
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


  handleFormReset = () => {
    this.props.form.resetFields();
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
    if (!record || !record.brandInfo) {
      this.setState({ brandInfo: null, file: null });
    }
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
    formData.append('pictureFile', file);

    if (type === 'add') {
      url = Api.pmAddBrand
    } else {
      url = Api.pmModifyBrandById;
    }
    that.setState({ modalLoading: true, brandInfo: fieldsValue });
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
    return (<Form onSubmit={this.handleSearch}
      layout="inline" >
      <Row gutter={
        { md: 8, lg: 24, xl: 48 }} >
        < Col md={8}
          sm={24} >
          <FormItem label="品牌线名称" > {getFieldDecorator('brand')(< Input placeholder="请输入品牌线名称" />)} </FormItem> </Col> <Col md={8}
            sm={24} >
          <span className={styles.submitButtons} >
            <Button type="primary"
              htmlType="submit" >
              查询 </Button> <Button style={
                { marginLeft: 8 }}
                onClick={this.handleFormReset} >
              重置 </Button> </span> </Col> </Row> </Form>
    );
  }

  render() {
    const { selectedRows, updateModalVisible } = this.state;

    const parentMethods = {
      handleSubmit: this.handleSubmit,
      handleModalVisible: this.handleModalVisible,
      // beforeUpload: this.beforeUpload,
    };

    const parentDatas = {
      modalVisible: this.state.modalVisible,
      modalTitle: this.state.modalTitle,
      brandInfo: this.state.brandInfo,
      modalLoading: this.state.modalLoading,
    };

    return (<PageHeaderWrapper >
      <Card bordered={false} >
        <div className={styles.tableList}>
          <div className={styles.tableListForm} > {this.renderForm()} </div> <              div className={styles.tableListOperator} >
            <Button icon="plus"
              type="primary"
              onClick={
                () => this.handleModalVisible(true, { modalTitle: "新增" })} >
              新增 </Button> {
              selectedRows.length > 0 && (<Button onClick={this.delProjLine}
                selectedKeys={
                  []} > 批量删除 </Button>
              )
            } </div> <StandardTable selectedRows={selectedRows}
              loading={this.state.loading}
              data={this.state.data}
              columns={this.columns}
              onSelectRow={this.handleSelectRows}
              onChange={this.handleStandardTableChange}
          /> </div> 
          </Card> 
          <CreateForm {...parentMethods} {...parentDatas}
      /> </PageHeaderWrapper>
    );
  }
}

export default ProductLine;