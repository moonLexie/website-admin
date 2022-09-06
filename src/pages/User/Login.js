import React, { Component } from 'react';
import { connect } from 'dva';
import { formatMessage, FormattedMessage } from 'umi/locale';
import Link from 'umi/link';
import { Checkbox, Alert, Icon } from 'antd';
import Login from '@/components/Login';
import styles from './Login.less';
import { Form, Input, Button, Row, Col, notification } from 'antd';
import { noConflict } from 'q';

const FormItem = Form.Item;
const { Tab, UserName, Password, Mobile, Captchacode, Submit } = Login;

@connect(({ login, loading }) => ({
  login,
  submitting: loading.effects['login/login'],
}))
class LoginPage extends Component {
  state = {
    type: 'account',
    autoLogin: true,
    captchaCode:'',
    onChangeCaptchaCode:false,
  };

  onTabChange = type => {
    this.setState({ type });
  };

  onGetCaptcha = () =>
    new Promise((resolve, reject) => {
      this.loginForm.validateFields(['mobile'], {}, (err, values) => {
        if (err) {
          reject(err);
        } else {
          const { dispatch } = this.props;
          dispatch({
            type: 'login/getCaptcha',
            payload: values.mobile,
          })
            .then(resolve)
            .catch(reject);
        }
      });
    });

  onGetCaptchaCode = (captchaCode) => {
    this.setState({ captchaCode: captchaCode,onChangeCaptchaCode: false});
  }

  handleSubmit = (err, values) => {
      if (!err) {
      const { type, captchaCode } = this.state;
      if (values.captcha.toUpperCase() !== captchaCode) {
        notification.destroy();
        notification['error']({ message: '验证码有误！' });
        this.setState({ onChangeCaptchaCode:true});
        return;
      }else{
        this.setState({ onChangeCaptchaCode: false });
      }
      
      const { dispatch } = this.props;
      dispatch({
        type: 'login/login',
        payload: {
          username: values.userName,
          password: values.password
        },
      });
    }
  };

  changeAutoLogin = e => {
    this.setState({
      autoLogin: e.target.checked,
    });
  };

  renderMessage = content => (
    <Alert style={{ marginBottom: 24 }} message={content} type="error" showIcon />
  );

  render() {
    const { login, submitting } = this.props;
    const { type, autoLogin } = this.state;
    return (
      <div className={styles.main}>
        <Login
          defaultActiveKey={type}
          onTabChange={this.onTabChange}
          onSubmit={this.handleSubmit}
          ref={form => {
            this.loginForm = form;
          }}
        >
          <Tab key="account" tab={formatMessage({ id: 'app.login.tab-login-credentials' })}>
            {login.status === 'error' &&
              login.type === 'account' &&
              !submitting &&
              this.renderMessage(formatMessage({ id: 'app.login.message-invalid-credentials' }))}
            <UserName
              name="userName"
              placeholder={`${formatMessage({ id: 'app.login.userName' })}`}
              rules={[
                {
                  required: true,
                  message: formatMessage({ id: 'validation.userName.required' }),
                },
              ]}
            />
            <Password
              name="password"
              placeholder={`${formatMessage({ id: 'app.login.password' })}`}
              rules={[
                {
                  required: true,
                  message: formatMessage({ id: 'validation.password.required' }),
                },
              ]}
              onPressEnter={e => {
                e.preventDefault();
                this.loginForm.validateFields(this.handleSubmit);
              }}
            /> 
            <Captchacode
              name="captcha"
              placeholder={`${formatMessage({ id: 'app.login.captcha' })}`}
              onGetCaptchaCode={this.onGetCaptchaCode}
              onChangeCaptchaCode={this.state.onChangeCaptchaCode}
              rules={[
                {
                  required: true,
                  message: formatMessage({ id: 'validation.captcha.required' }),
                },
              ]}
            /> 
          </Tab>
          <div>
            <Checkbox checked={autoLogin} onChange={this.changeAutoLogin}>
              <FormattedMessage id="app.login.remember-me" />
            </Checkbox>
            <a style={{ float: 'right' }} href="">
              {/* <FormattedMessage id="app.login.forgot-password" /> */}
            </a>
          </div>
          <Submit loading={submitting}>
            <FormattedMessage id="app.login.login" />
          </Submit>
        </Login>
      </div>
    );
  }
}

export default LoginPage;
