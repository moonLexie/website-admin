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
  Select,
  Tree,
  Icon,
  TreeSelect,
  Tooltip, 
  notification ,
  Spin
} from 'antd';

import StandardTable from '@/components/StandardTable';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import UploadPhoto from '@/components/UploadPhoto';
import styles from './ProductLine.less';
import { Api, hostname } from '../../services/apis'
import ApiService from '../../apiService'

const { TreeNode } = Tree;
const FormItem = Form.Item;
const Option = Select.Option;
const confirm = Modal.confirm;
const getValue = obj =>
  Object.keys(obj)
    .map(key => obj[key])
    .join(',');
const paramFields = ['', 'first_type', 'second_type', 'third_type'];
const paramModifyFields = ['', 'modify_first_type', 'modify_second_type', 'modify_third_type'];

/* eslint react/no-multi-comp:0 */
@connect(({ rule, loading }) => ({
  rule,
  loading: loading.models.rule,
}))
@Form.create()
class Classify extends PureComponent {
  state = {
    treeData : [],
    selectNode:'',
    modelTitle:'',
  };

  componentDidMount() {
    this.getTreeData();
  }

  getTreeData = () => {
    const that = this;
    that.setState({ loading: true });
    ApiService.CallApi(
      'post',
      Api.cmFindAllType,
      {},
      (data) => {
        that.setState({ loading: false });

        if (data) {
          let treeData = [{
            level:0,
            title: '运美达产品分类',
            key: '-1',
            value: '-1',
            children: data
          }];
          that.setState({ treeData:treeData,});

          if (data.length === 0) {
            notification.destroy();
            notification['error']({ message: '暂无数据' })
            return;
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
  }

  handleFormReset = () => {
    const { form } = this.props;
    form.resetFields();
    this.setState({
      formValues: {},
    });
  };


  handleSelect = (selectedKeys, e) => {
    if (selectedKeys[0]){
      this.setState({ selectNode: selectedKeys[0] });
    }
  };

  handleModalVisible = (flag, record, setFormFields) => {
    const form = this.props.form;
    this.setState({
      ...record,
      modalVisible: !!flag,
    },function(){
        if (setFormFields) setFormFields(form);
    });
  };

  handleEdit = (item) => {
    const setFormFields = (form) => {
      form.setFieldsValue({
        parentClassify: item.parent ? item.parent : '运美达产品分类',
        name: item.title
      })
    }

    this.handleModalVisible(true, { modelTitle: '编辑', item: item, editLevel: Number(item.level), topEdit: item.parent ? false : true }, setFormFields);
  };

  handleAdd = (item) => {
    const setFormFields = (form) => {
      form.setFieldsValue({
        parentClassify: item.title,
        name: ''
      })
    }

    this.handleModalVisible(true, { modelTitle: '添加', item: item, editLevel: Number(item.level) }, setFormFields);
  };

  /* getObjByKey = (key,data) => {
    if(!data){
      data = this.state.treeData;
    } 
    data.forEach(item=>{
      if (item.key == key){
        return item;
      }else{
        this.getObjByKey(key,item.children);
      }
    })
  } */

  okHandle = () => {
    const that = this;
    this.props.form.validateFields((err, fieldsValue) => {
      if (err) return;

      const item = that.state.item;
      let url,param = {};
      if (that.state.modelTitle === '添加') {
        url = Api.cmAddType;
        param[paramFields[item.level + 1]] = fieldsValue.name;
        if (item.level != '0'){
          param[paramFields[item.level]] = item.title;

          if (item.parent){
            param[paramFields[item.level - 1]] = item.parent;
          }
        }
      }else{
        //编辑
        url = Api.cmModifyTypeByTypeInfo;
        if (item.title === fieldsValue.name){
          if (item.parent){
            if (fieldsValue.parentClassify === item.parent){
              notification.destroy();
              notification['warning']({ message: '请进行修改后点击确定！' })
              return;
            }
          }else{
            notification.destroy();
            notification['warning']({ message: '请进行修改后点击确定！' })
            return;
          }
        }
        param[paramFields[item.level]] = item.title;
        param[paramModifyFields[item.level]] = fieldsValue.name;
        if (item.parent) {
          param[paramFields[item.level - 1]] = item.parent;
          param[paramModifyFields[item.level - 1]] = fieldsValue.parentClassify !== item.parent ? JSON.parse(fieldsValue.parentClassify).title : item.parent;
        }
        if (item.grandfather) {
          param[paramFields[item.level - 2]] = item.grandfather;
          param[paramModifyFields[item.level - 2]] = fieldsValue.parentClassify !== item.parent ? JSON.parse(fieldsValue.parentClassify).parent : item.grandfather;
        }
      }

      that.setState({ modalLoading: true });
      ApiService.CallApi(
        'post',
        url,
        param,
        (data) => {
          that.setState({ modalLoading: false });

          if (data && data.message) {
            notification.destroy();

            if (data.message.indexOf('成功')>-1){
              that.getTreeData();
              notification['success']({ message: data.message })
              that.handleModalVisible(false);
            }else{
              notification['warning']({ message: data.message })
            }
          } else {
            notification.destroy();
            notification['error']({ message: data.toString() })
          }
        },
        (err) => {
          that.setState({ modalLoading: false })
          notification.destroy();
          notification['error']({ message: err })
        })
    });
  };

  handleDel = (item) => {
    const that = this;
    confirm({
      title: `确定删除${item.title}分类吗?`,
      content: '删除分类，会删除下级分类，以及清空分类下的产品与分类的关联，但不删除产品',
      okText: '确定',
      cancelText: '取消',
      onOk() {
        
        return new Promise((resolve, reject) => { 

          let param = {
            [paramFields[item.level]]: item.title,
          }
          if (item.parent) {
            param[paramFields[item.level - 1]] = item.parent;
          }
          if (item.grandfather) {
            param[paramFields[item.level - 2]] = item.grandfather;
          }

          that.setState({ modalLoading: true });
          ApiService.CallApi(
            'post',
            Api.cmDeleteTypeByTypeInfo,
            param,
            (data) => {
              that.setState({ modalLoading: false });

              if (data && data.message) {
                notification.destroy();

                if (data.message.indexOf('成功') > -1) {
                  that.getTreeData();
                  that.setState({ selectNode:''})
                  notification['success']({ message: data.message })
                  that.handleModalVisible(false);
                  resolve() 
                } else {
                  notification['warning']({ message: data.message });reject
                }
              } else {
                notification.destroy();
                notification['error']({ message: data });
                reject()
              }
            },
            (err) => {
              that.setState({ modalLoading: false })
              notification.destroy();
              notification['error']({ message: err });
              reject()
            })
        });
      },
    });
  }

  render() {
    const {
      rule: { data },
      loading,
      form
    } = this.props;
    const { selectedRows, updateModalVisible } = this.state;

    const col = {
      labelCol: { span: 5 },
      wrapperCol: { span: 17 }
    }

    const renderTreeTitle = (item) => {
      return (
        <span>
          <span className={styles.treeTitle}>{item.title}</span>
          <span className={styles.treeOpt} style={{ display: item.key === this.state.selectNode ? 'inline-block' : 'none' }}>
            {
              item.level != 3?
                  <Tooltip title="添加下级分类">
                    <Icon type="plus-square" theme="filled" onClick={() => this.handleAdd(item)} />
                  </Tooltip>
                  :null
            }
            {
              item.key != -1?
                <span>
                  <Tooltip title="删除此级分类"> 
                    <Icon type="minus-square" theme="filled" onClick={() => this.handleDel(item)} />
                  </Tooltip>
                  <Tooltip title="编辑此级分类"> 
                    <Icon type="edit" theme="filled" onClick={() => this.handleEdit(item)} />
                  </Tooltip>
                </span>
              :null
            }
          </span>
        </span>
      )
    }

    const renderTreeNodes = (data) => data.map((item) => {
      if (item.children) {
        return (
          <TreeNode title={ renderTreeTitle(item)} key={item.key} value={JSON.stringify(item)}>
            {renderTreeNodes(item.children)}
          </TreeNode>
        );
      }
      return <TreeNode title={renderTreeTitle(item)} key={item.key} value={JSON.stringify(item)} />;
    })


    const renderTreeNodes2 = (data, level) => data.map((item) => {
      if (Number(item.level) <= Number(level)) {
        return (
          <TreeNode title={item.title} key={item.key} value={JSON.stringify(item)} disabled={Number(item.level) == Number(level)?false:true}>
            {
              item.children ?
              renderTreeNodes2(item.children, level)
              :null
            }
          </TreeNode>
        );
      }
    })

    return (
      <PageHeaderWrapper>
        <Spin spinning={this.state.loading}>
          <Card bordered={false}>
            <Tree
              defaultExpandAll
              defaultExpandParent={true}
              onSelect={this.handleSelect}
            >
              {renderTreeNodes(this.state.treeData)}
            </Tree>
          </Card>
        </Spin>
        <Modal
          destroyOnClose
          title={this.state.modelTitle}
          visible={this.state.modalVisible}
          onOk={this.okHandle}
          onCancel={() => this.handleModalVisible()}
          confirmLoading={this.state.modalLoading}
        >
          <FormItem {...col} label="上级分类">
            {form.getFieldDecorator('parentClassify', {
              rules: [{ required: true, message: '请选择上级分类！' }],
            })(<TreeSelect
              style={{ width: '100%' }}
              dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
              placeholder="请选择上级分类"
              treeDefaultExpandAll
              onChange={this.classifyChange}
              disabled={this.state.modelTitle === '添加' || this.state.topEdit ? true : false}
            >
              {renderTreeNodes2(this.state.treeData, this.state.editLevel-1)}
            </TreeSelect>)}
          </FormItem>
          <FormItem layout="layout" {...col} label="分类名称">
            {form.getFieldDecorator('name', {
              rules: [{ required: true, message: '请输入分类名称！' }]
            })(<Input placeholder="请输入分类名称" />)}
          </FormItem>
        </Modal>
      </PageHeaderWrapper>
    );
  }
}

export default Classify;
