import React, { PureComponent } from 'react';
import { Upload, Icon, Modal } from 'antd'

export default class UploadPhoto extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            previewVisible: false,
            previewImage: '',
        }
    }

    handleCancel = () => {
        let {previewVisible} = this.state;
        previewVisible = false;
        this.setState({ previewVisible })
    }

    handlePreview = (file) => {
        let {previewVisible} = this.state;
        previewVisible = true;
        this.setState({
            previewImage: file.url || file.thumbUrl,
            previewVisible
        });
    }

    render() {

        const uploadButton = (
            <div>
                <Icon type="plus" />
                <div className="ant-upload-text">上传</div>
            </div>
        );

        return (
            <div>
                <Upload
                    action={this.props.action}
                    listType="picture-card"
                    fileList={this.props.fileList}
                    onPreview={this.handlePreview}
                    onChange={this.props.handleChange}
                    onRemove={this.props.onRemove}
                    beforeUpload={this.props.beforeUpload}
                    accept={this.props.accept}
                    data={this.props.data}
                    name={this.props.name}
                >
                    {this.props.fileList.length >= (this.props.num) ? null : uploadButton}
                </Upload>
                <Modal visible={this.state.previewVisible} footer={null} onCancel={this.handleCancel}>
                    <img alt="example" style={{ width: '100%' }} src={this.state.previewImage} />
                </Modal>
            </div>
        );
    }

}