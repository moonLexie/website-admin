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
  TreeSelect,
  Radio,
  notification,
  Icon
} from 'antd';
import StandardTable from '@/components/StandardTable';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import UploadPhoto from '@/components/UploadPhoto';
import styles from './ProductLine.less';
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
const { TreeNode } = TreeSelect;

const getValue = obj =>
  Object.keys(obj)
    .map(key => obj[key])
    .join(',');
const paramFields = ['', 'first_type', 'second_type', 'third_type'];

class createForm extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      fileList: [],
      fileList2: [],
      coverFile: null,
      detailFile: [],
      delImgids: [],
      // mediaFileList:[],
    }
  }

  handleChange = ({ file, fileList }, name) => {
    this.setState({ [name]: fileList })
  } 

  beforeUpload = (file,name) => {
    if (name === 'coverFile') {
      this.setState({ [name]: file });
    } else {
      this.setState(state => ({ [name]: [...state[name], file] }));
    }
    return false;
  }

  removePic = (info) => {
    if (info.imageId) {
      this.setState(state => ({ delImgids: [...state.delImgids, info.imageId] }));
    } else {
      const { detailFile } = this.state;
      detailFile.forEach((item, index) => {
        if (item.uid === info.uid) {
          detailFile.splice(index, 1);
          this.setState({ detailFile: detailFile });
          return;
        }
      })

    }
  }

  okHandle = () => {
    const that = this;
    this.props.form.validateFields((err, fieldsValue) => {
      if (err) return;
      if (this.state.fileList.length === 0) {
        notification.destroy();
        notification['warning']({ message: '????????????????????????' });
        return;
      }

      if (this.state.fileList2.length === 0) {
        notification.destroy();
        notification['warning']({ message: `????????????????????????` });
        return;
      }

      if (fieldsValue.classfiy) {
        const classfiy = JSON.parse(fieldsValue.classfiy);
        const level = parseInt(classfiy.level);
        fieldsValue[paramFields[level]] = classfiy.title;
        if (classfiy.parent) {
          fieldsValue[paramFields[level - 1]] = classfiy.parent;
        }
        if (classfiy.grandfather) {
          fieldsValue[paramFields[level - 2]] = classfiy.grandfather;
        }
        delete fieldsValue.classfiy;
      }

      /* if (fieldsValue.product_detail){
        fieldsValue.product_detail = fieldsValue.product_detail.toHTML();
      } */

      if (this.props.modalTitle === '??????') {
        this.props.handleSubmit('add', fieldsValue, this.state.coverFile, this.state.detailFile);
      } else {
        fieldsValue.id = this.props.info ? this.props.info.id : null;
        this.props.handleSubmit('edit', fieldsValue, this.state.coverFile, this.state.detailFile, this.state.delImgids);
      }
    });
  };

  setInfo = (info) => {
    let fileList = [];
    let fileList2 = [];
    if (info) {
      fileList = [{
        uid: '-1',
        status: 'done',
        url: info.product_pic ? hostname + info.product_pic : '',
      }]

      let product_detail = info.product_detail;
      product_detail.forEach(item=>{
        fileList2.push({
          uid: item.id,
          imageId:item.id,
          status: 'done',
          url: item.product_detail ? hostname + item.product_detail : '',
        })
      })
    }
    this.setState({ fileList, fileList2 });
  }


  componentWillReceiveProps(nextProps) {
    if (nextProps.modalVisible && this.props.modalVisible !== nextProps.modalVisible) {
      this.setInfo(nextProps.info);
      if (!this.props.form.getFieldValue('ishow')) {
        this.props.form.setFieldsValue({
          ishow: '???',
        })
      }
      if (this.props.clearfileState !== nextProps.clearfileState && nextProps.clearfileState){
        this.setState({ delImgids: [], detailFile: [], coverFile:null })
      }
    }
  }


  submitContent = async () => {
    // ?????????????????????????????????ctrl+s??????????????????
    // ?????????????????????????????????????????????????????????editorState.toHTML()?????????HTML???????????????
    const htmlContent = this.state.editorState.toHTML()
    const result = await saveEditorContent(htmlContent)
  }

  //???????????????
  myUploadFn = (param) => {
    const successFn = (file) => {
      // ???????????????????????????????????????????????????
      // ?????????????????????param.success?????????????????????????????????
      file.forEach(item=>{
        let fileName = item.url.split('/');
        fileName = fileName[fileName.length-1];
        param.success({
          url: hostname + item.url,
          meta: {
            id: item.id,
            title: fileName,
            alt: '????????????',
            url: item.url
          }
        })
      })
    }

    const progressFn = (event) => {
      // ?????????????????????????????????param.progress
      param.progress(event.loaded / event.total * 100)
    }

    const errorFn = (response) => {
      // ???????????????????????????param.error
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
        if (data && data.message.indexOf('??????') > -1 && data.file) {
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

  //??????????????????????????????
  myMediaChange = (param) => {
    console.log(111,param)
    if (param[param.length-1].uploadProgress!==1) return;
    const mediaFileList = this.state.mediaFileList;
    let paramUrls = [];
    param.forEach(item => {
      const url = item.meta.url;
      paramUrls.push(url);
    })

    if(param.length < mediaFileList.length){
      let removeUrl = [];
      paramUrls.forEach(item=>{
        if (mediaFileList.indexOf(item)===-1){
          removeUrl.push(item)
        }
      })

      //????????????
      ApiService.CallApi(
        'post',
        Api.UpLoadPic,
        { url: removeUrl.join(',')},
        (data) => {

          // that.setState({ loading: false });
          notification.destroy();
          if (data && data.message.indexOf('??????') > -1) {
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

  //??????????????????
  deleteImg = (removeUrl) => {
    //????????????
    ApiService.CallApi(
      'post',
      Api.deletePicByImgPaths,
      { imgPaths: removeUrl },
      (data) => {
        notification.destroy();
        if (data && data.message.indexOf('??????') > -1) {
        } else {
          notification['error']({ message: data.message });
        }
      },
      (err) => {
        notification.destroy();
        notification['error']({ message: err })
      });
  }

  //??????????????????????????????
  removeImg = (mediaData) =>{
    const onclick = (mediaData) => {
      if (mediaData){
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
        if (data && data.message.indexOf('??????') > -1 && data.file) {
          this.props.form.setFieldsValue({
            product_detail: ContentUtils.insertMedias(this.props.form.getFieldValue('product_detail'), [{
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
        product_detail: ContentUtils.insertMedias(this.props.form.getFieldValue('product_detail'), [{
          type: 'IMAGE',
          url: URL.createObjectURL(param.file)
        }])
      }) */
  }

  render() {
    const { modalVisible, form, handleSubmit, handleModalVisible, modalTitle, productsData, treeData, renderTreeNodes, productLines, /* beforeUpload,  */modalLoading } = this.props;
    const col = {
      labelCol: { span: 5 },
      wrapperCol: { span: 17 }
    }

    const imageControls = [
      'float-left',
      'float-right',
      'align-left', // ??????????????????
      'align-center', // ??????????????????
      'align-right', // ??????????????????
      'link',
      'size',
      'remove',
      {
        text: 'remove', // ??????????????????????????????jsx
        render: this.removeImg,
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
            {/* ???????????????????????????type="button"??????????????????????????????????????????????????????Antd???Button????????????????????? */}
            <button type="button" className="control-item button upload-button" data-title="????????????">
              <Icon type="picture" theme="filled" />
            </button>
          </Upload>
        )
      }
    ]

    return (
      <Modal
        destroyOnClose
        title={modalTitle ? `${modalTitle}??????` : '??????'}
        width={900}
        visible={modalVisible}
        onOk={this.okHandle}
        onCancel={() => handleModalVisible()}
        confirmLoading={modalLoading}
      >
        <FormItem {...col} label="????????????">
          {form.getFieldDecorator('product_name', {
            rules: [{ required: true, message: '????????????????????????' }],
          })(<Input placeholder="?????????????????????" />)}
        </FormItem>
        <FormItem {...col} label="????????????">
          {form.getFieldDecorator('classfiy', {
            rules: [{ required: true, message: '????????????????????????' }],
          })(
            <TreeSelect
              style={{ width: '100%' }}
              dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
              placeholder="?????????????????????"
              treeDefaultExpandAll
            >
              {renderTreeNodes(treeData)}
            </TreeSelect>
          )}
        </FormItem>
        <FormItem {...col} label="???????????????">
          {form.getFieldDecorator('brand', {
            rules: [{ required: true, message: '?????????????????????' }],
          })(
            <Select placeholder="??????????????????"
              style={{ width: '100%' }}>
              {productLines && productLines.map(item =>
                <Option key={item.id} value={item.brand}>{item.brand}</Option>
              )}
            </Select>)}
        </FormItem>
        <FormItem {...col} label="????????????">
          <UploadPhoto num={1}
            accept=".png,.jpg,.jpeg,.gif,.bmp"
            fileList={this.state.fileList}
            beforeUpload={(e) => this.beforeUpload(e, 'coverFile')}
            handleChange={(e) => this.handleChange(e, 'fileList')}
          />
        </FormItem>
        <FormItem {...col} label="????????????">
          {form.getFieldDecorator('product_price')(<Input placeholder="?????????????????????" />)}
        </FormItem>
        <FormItem {...col} label="????????????">
          {form.getFieldDecorator('product_type')(<Input placeholder="?????????????????????" />)}
        </FormItem>
        <FormItem {...col} label="????????????">
          {form.getFieldDecorator('product_introduce', {
            rules: [{ required: true, message: '????????????????????????' }],
          })(<TextArea row={4} placeholder="?????????????????????" />)}
        </FormItem>
        <FormItem {...col} label="????????????">
          <UploadPhoto
            num={100}
            accept=".png,.jpg,.jpeg,.gif,.bmp"
            fileList={this.state.fileList2}
            beforeUpload={(e) => this.beforeUpload(e, 'detailFile')}
            handleChange={(e) => this.handleChange(e, 'fileList2')}
            onRemove={this.removePic}
          />
        </FormItem>
        <FormItem {...col} label="????????????">
          {form.getFieldDecorator('ishow')(
            <RadioGroup >
              <Radio value="???">???</Radio>
              <Radio value="???">???</Radio>
            </RadioGroup>)}
        </FormItem>
      </Modal>
    );
  }
}
const CreateForm = Form.create({
  mapPropsToFields(props) {
    if (props.info) {
      let classfiy = '';
      const { first_type, second_type, third_type } = props.info;
      if (first_type){
        props.treeData.forEach(item=>{
          if (item.title == first_type){
            if (second_type){
              item.children.forEach(item2=>{
                if (item2.title == second_type){
                  if (third_type){
                    item2.children.forEach(item3=>{
                      if (item3.title == third_type){
                        classfiy = JSON.stringify(item3);
                        return;
                      }
                    })
                  }else{
                    classfiy = JSON.stringify(item2);
                    return;
                  }
                }
              })
            }else{
              classfiy = JSON.stringify(item);
              return;
            }
          }
        })
      }

      return {
        product_name: Form.createFormField({ value: props.info.product_name,}),
        classfiy: Form.createFormField({ value: classfiy ? classfiy:null,}),
        brand: Form.createFormField({ value: props.info.brand,}),
        product_price: Form.createFormField({ value: props.info.product_price,}),
        product_type: Form.createFormField({ value: props.info.product_type,}),
        product_introduce: Form.createFormField({ value: props.info.product_introduce,}),
        product_detail: Form.createFormField({ value: BraftEditor.createEditorState(props.info.product_detail),}),
        ishow: Form.createFormField({ value: props.info.ishow,}),
      };
    }else{
      return {
        product_detail: Form.createFormField({ value: BraftEditor.createEditorState(null), }),
      };
    }
  }
})(createForm)


@connect(({ rule, loading }) => ({
  rule,
  loading: loading.models.rule,
}))
@Form.create()
class Products extends PureComponent {
  state = {
    productLines: [],
    modalVisible: false,
    updateModalVisible: false,
    selectedRows: [],
    formValues: {},
    current: 1,
    pageSize: 10,
    treeData: [],
    modalTitle: '',
    selectInfo: {},
    modalLoading: false,
    clearfileState:false,
  };

  columns = [
    {
      title: '????????????',
      dataIndex: 'product_name',
      width: 140,
    },
    {
      title: '???????????????',
      dataIndex: 'brand',
      width: 140,
    },
    {
      title: '????????????',
      dataIndex: 'product_pic',
      render: val => < img src={hostname + val}
        height="50" />,
      width: 100,
    },
    {
      title: '????????????',
      dataIndex: 'product_introduce',
    },
    {
      title: '??????????????????',
      dataIndex: 'ishow', 
      width: 140,
    },
    {
      title: '??????',
      render: (text, record) => (
        <Fragment>
          <a onClick={() => this.handleModalVisible(true, { modalTitle: "??????", info: record })}>??????</a>
          <Divider type="vertical" />
          <a href="javascript:;" onClick={() => this.delProject(record, 'one')}>??????</a>
        </Fragment>
      ),
      width: 140,
    },
  ];

  componentDidMount() {
    this.init();
    this.getData();
  }

  init = () => {
    //?????????????????????
    const that = this;
    ApiService.CallApi(
      'post',
      Api.pmFindAllBrand,
      {},
      (data) => {

        const { brand, totalNum } = data && data[0];
        if (!brand || totalNum === 0) {
          return;
        }

        if (brand && Array.isArray(brand)) {
          let tableData = brand.length !== 0 ? brand : [];
          that.setState({ productLines: tableData });
        } else {
          notification.destroy();
          notification['warning']({ message: '???????????????' })
        }
      },
      (err) => {
        notification.destroy();
        notification['error']({ message: err })
      })

    //?????????????????????
    ApiService.CallApi(
      'post',
      Api.cmFindAllType,
      {},
      (data) => {

        if (data) {
          let treeData = data;
          that.setState({ treeData });

          if (data.length === 0) {
            notification.destroy();
            notification['error']({ message: '????????????' })
            return;
          }
        } else {
          notification.destroy();
          notification['error']({ message: data })
        }
      },
      (err) => {
        notification.destroy();
        notification['error']({ message: err })
      })
  }

  //??????????????????
  getData = () => {
    const that = this;
    this.props.form.validateFields((err, fieldsValue) => {
      if (err) return;

      if (fieldsValue.classfiy) {
        const classfiy = JSON.parse(fieldsValue.classfiy);
        const level = parseInt(classfiy.level);
        fieldsValue[paramFields[level]] = classfiy.title;
        if (classfiy.parent) {
          fieldsValue[paramFields[level - 1]] = classfiy.parent;
        }
        if (classfiy.grandfather) {
          fieldsValue[paramFields[level - 2]] = classfiy.grandfather;
        }
        delete fieldsValue.classfiy;
      }

      this.setState({ loading: true })
      ApiService.CallApi(
        'post',
        Api.psmFindAllProduct,
        {
          ...fieldsValue,
          indexPage: that.state.current,
          pageSize: that.state.pageSize,
        },
        (data) => {

          that.setState({ loading: false })
          const { brandProduct, totalNum } = data && data[0];
          const detailPics = data && data[1];
          if (!brand || totalNum === 0) {
            const msg = data[0] && typeof data[0] === 'string' ? data[0] : '????????????';
            notification.destroy();
            notification['warning']({ message: msg })
          }

          if (brandProduct && Array.isArray(brandProduct)) {
            if (detailPics && Array.isArray(detailPics) && detailPics.length>0){
              brandProduct.forEach(b => {
                b.product_detail = [];
                detailPics.forEach(p => {
                  if (p.product_name === b.product_name){
                    b.product_detail.push(p)
                  }
                })
              })
            }
           
            let tableData = {
              list: brandProduct.length !== 0 ? brandProduct : [],
              pagination: {
                current: that.state.current,
                pageSize: that.state.pageSize,
                total: totalNum
              }
            }
            that.setState({ data: tableData });
          } else {
            notification.destroy();
            notification['warning']({ message: '???????????????' })
          }
        },
        (err) => {
          that.setState({ loading: false })
          notification.destroy();
          notification['error']({ message: err })
        })
    });
  }

  //????????????
  delProject = (record, type) => {
    const that = this;
    const placeholder = record && record.product_name ? record.product_name : '??????';
    confirm({
      title: `????????????${placeholder}??????????`,
      content: '??????????????????????????????????????????????????????????????????',
      okText: '??????',
      cancelText: '??????',
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
          Api.psmDeleteBrandProductById,
          { ids: ids.join(',') },
          (data) => {
            that.setState({ loading: false });

            notification.destroy();
            if (data && data.message.indexOf('??????')>-1) {
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

  handleSelectRows = rows => {
    this.setState({
      selectedRows: rows,
    });
  };


  //??????
  handleSearch = e => {
    e.preventDefault();
    this.setState({ current: 1 }, () => {
      this.getData();
    })
  };

  //??????
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

  handleModalVisible = (flag, record) => {
    this.setState({
      modalVisible: !!flag,
      ...record
    });
    if(flag){
      this.setState({ clearfileState: true });
    }else{
      this.setState({ clearfileState: false });
    }
    if (!record || !record.info) {
      this.setState({ info: null, file: null });
    }
  };

  handleSubmit = (type, fieldsValue, coverFile, detailFile, delImgids) => {
    const that = this;
    let url = '';
    const formData = new FormData();

    Object.entries(fieldsValue).forEach((item) => {
      if (item[1]) {
        formData.append(item[0], item[1] || '');
      }
    });
    if (coverFile){
      formData.append('productPic', coverFile);
    }
    if (detailFile.length !== 0) {
      detailFile.forEach((file) => {
        formData.append('productDetailPic', file);
      })
    }

    if (type === 'add') {
      url = Api.psmAddBrandProduct
    } else {
      if (delImgids.length!==0)
        formData.append('productDetailIds', delImgids.join(','));
      url = Api.psmModifyBrandProductById;
    }
    that.setState({ modalLoading: true, info: fieldsValue });
    ApiService.CallApi(
      'post',
      url,
      formData,
      (data) => {

        that.setState({ modalLoading: false });
        notification.destroy();
        if (data.message.indexOf("??????") > -1) {
          notification['success']({ message: data.message });
          // that.setState({ modalVisible: false });
          that.handleModalVisible(false)
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

  render() {
    const renderTreeNodes = (data) => data.map((item) => {
      return (
        <TreeNode title={item.title} key={item.key} value={JSON.stringify(item)}>
          {
            item.children ?
              renderTreeNodes(item.children)
              : null
          }
        </TreeNode>
      );
    })

    const { selectedRows, updateModalVisible } = this.state;
    const { form: { getFieldDecorator } } = this.props;
    const parentMethods = {
      handleSubmit: this.handleSubmit,
      handleModalVisible: this.handleModalVisible,
      renderTreeNodes: renderTreeNodes,
      // beforeUpload: this.beforeUpload,
    };

    const parentDatas = {
      modalVisible: this.state.modalVisible,
      modalTitle: this.state.modalTitle,
      modalLoading: this.state.modalLoading,
      treeData: this.state.treeData,
      productsData: this.state.productsData,
      productLines: this.state.productLines,
      info: this.state.info,
      clearfileState: this.state.clearfileState,
    };


    return (
      <PageHeaderWrapper>
        <Card bordered={false}>
          <div className={styles.tableList}>
            <div className={styles.tableListForm}>
              <Form onSubmit={this.handleSearch} layout="inline">
                <Row gutter={{ md: 8, lg: 24, xl: 48 }}>
                  <Col md={8} sm={24}>
                    <FormItem label="????????????">
                      {getFieldDecorator('product_name')(<Input placeholder="?????????????????????" />)}
                    </FormItem>
                  </Col>
                  <Col md={8} sm={24}>
                    <FormItem label="???????????????">
                      {getFieldDecorator('brand')(
                        <Select placeholder="??????????????????" >
                          {this.state.productLines && this.state.productLines.map(item =>
                            <Option key={item.id} value={item.brand}>{item.brand}</Option>
                          )}
                        </Select>)}
                    </FormItem>
                  </Col>
                  <Col md={8} sm={24}>
                    <FormItem label="????????????">
                      {getFieldDecorator('classfiy')(
                        <TreeSelect
                          style={{ width: '100%' }}
                          dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                          placeholder="?????????????????????"
                          treeDefaultExpandAll
                        >
                          {renderTreeNodes(this.state.treeData)}
                        </TreeSelect>
                      )}
                    </FormItem>
                  </Col>
                  <Col md={8} sm={24}>
                    <span className={styles.submitButtons}>
                      <Button type="primary" htmlType="submit">
                        ??????
                      </Button>
                      <Button style={{ marginLeft: 8 }} onClick={this.handleFormReset}>
                        ??????
                      </Button>
                    </span>
                  </Col>
                </Row>
              </Form>
            </div>
            <div className={styles.tableListOperator}>
              <Button icon="plus" type="primary" onClick={() => this.handleModalVisible(true, { modalTitle: "??????" })}>
                ??????
              </Button>
              {selectedRows.length > 0 && (
                <Button onClick={this.delProject} selectedKeys={[]}>????????????</Button>
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
        <CreateForm {...parentMethods} {...parentDatas} />
      </PageHeaderWrapper>
    );
  }
}

export default Products;
