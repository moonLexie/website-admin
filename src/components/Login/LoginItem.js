import React, { Component } from 'react';
import { Form, Input, Button, Row, Col } from 'antd';
import omit from 'omit.js';
import styles from './index.less';
import ItemMap from './map';
import LoginContext from './loginContext';

const FormItem = Form.Item;

class WrapFormItem extends Component {
  static defaultProps = {
    getCaptchaButtonText: 'captcha',
    getCaptchaSecondText: 'second',
  };

  constructor(props) {
    super(props);
    this.state = {
      count: 0,
      ...this.initState(),
      refresh: false
    };
  }

  componentDidMount() {
    this.canvas()
    const { updateActive, name } = this.props;
    if (updateActive) {
      updateActive(name);
    }
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  componentWillReceiveProps(nextProps){
    //更新验证码
    if (this.props.onChangeCaptchaCode !== nextProps.onChangeCaptchaCode && nextProps.onChangeCaptchaCode){
      this.setState({ ...this.initState(), refresh: false }, function (state) {
        this.canvas()
      })  
    }
  }

  onGetCaptcha = () => {
    const { onGetCaptcha } = this.props;
    const result = onGetCaptcha ? onGetCaptcha() : null;
    if (result === false) {
      return;
    }
    if (result instanceof Promise) {
      result.then(this.runGetCaptchaCountDown);
    } else {
      this.runGetCaptchaCountDown();
    }
  };

  getFormItemOptions = ({ onChange, defaultValue, customprops, rules }) => {
    const options = {
      rules: rules || customprops.rules,
    };
    if (onChange) {
      options.onChange = onChange;
    }
    if (defaultValue) {
      options.initialValue = defaultValue;
    }
    return options;
  };

  runGetCaptchaCountDown = () => {
    const { countDown } = this.props;
    let count = countDown || 59;
    this.setState({ count });
    this.interval = setInterval(() => {
      count -= 1;
      this.setState({ count });
      if (count === 0) {
        clearInterval(this.interval);
      }
    }, 1000);
  };

  //////////////验证码///////////////////
  getRandom(max, min, num) {
    const asciiNum = ~~(Math.random() * (max - min + 1) + min)
    if (!Boolean(num)) {
      return asciiNum
    }
    const arr = []
    for (let i = 0; i < num; i++) {
      arr.push(this.getRandom(max, min))
    }
    return arr
  }

  initState() {
    return {
      data: this.getRandom(109, 48, 4),
      rotate: this.getRandom(55, -55, 4),
      fz: this.getRandom(14, 22, 4),
      color: [this.getRandom(0, 100, 3), this.getRandom(0, 155, 4), this.getRandom(0, 155, 3), this.getRandom(100, 255, 3)]
    }
  }

  canvas() {
    const { getRandom } = this
    const canvas = document.getElementById('bgi')
    let ctx = canvas.getContext('2d')
    canvas.height = canvas.height
    ctx.strokeStyle = `rgb(${this.getRandom(100, 10, 3).toString()})`
    for (let i = 0; i < 7; i++) {
      ctx.lineTo(getRandom(300, 0), getRandom(300, 10))
      ctx.moveTo(getRandom(300, 0), getRandom(300, 0))  
      ctx.stroke();
    }
    this.getCaptchaCode();
  }
  
  getCaptchaCode = () => {
    const { onGetCaptchaCode } = this.props;
    if (onGetCaptchaCode){
      const codes = this.state.data.map(v => String.fromCharCode(v > 57 && v < 84 ? v + 7 : (v < 57 ? v : v + 13))).join('').toUpperCase();
      onGetCaptchaCode(codes);
    }
  }

  render() {
    const { count } = this.state;

    const {
      form: { getFieldDecorator },
    } = this.props;

    // 这么写是为了防止restProps中 带入 onChange, defaultValue, rules props
    const {
      onChange,
      customprops,
      defaultValue,
      rules,
      name,
      getCaptchaButtonText,
      getCaptchaSecondText,
      updateActive,
      type,
      ...restProps
    } = this.props;

    // get getFieldDecorator props
    const options = this.getFormItemOptions(this.props);

    const otherProps = restProps || {};
    if (type === 'Captcha') {
      const inputProps = omit(otherProps, ['onGetCaptcha', 'countDown']);
      return (
        <FormItem>
          <Row gutter={8}>
            <Col span={16}>
              {getFieldDecorator(name, options)(<Input {...customprops} {...inputProps} />)}
            </Col>
            <Col span={8}>
              <Button
                disabled={count}
                className={styles.getCaptcha}
                size="large"
                onClick={this.onGetCaptcha}
              >
                {count ? `${count} ${getCaptchaSecondText}` : getCaptchaButtonText}
              </Button>
            </Col>
          </Row>
        </FormItem>
      );
    }
    if (type === 'Captchacode') {
      const inputProps = omit(otherProps, ['onGetCaptchaCode']);
      return (
        <FormItem>
          <Row gutter={8}>
            <Col span={16}>
              {getFieldDecorator(name, options)(<Input {...customprops} {...inputProps} />)}
            </Col>
            <Col span={8}>
              <div className={styles.vcodewrap} >
                <canvas id="bgi" className={styles.bgi}></canvas>
                {this.state.data.map((v, i) =>
                  <div
                    key={i}
                    className={styles.itemStr}
                    style={{
                      transform: `rotate(${this.state.rotate[i]}deg)`,
                      fontSize: `${this.state.fz[i]}px`,
                      color: `rgb(${this.state.color[i].toString()})`,
                      fontWeight:"bold"
                    }}
                    onMouseEnter={() => this.setState({ refresh: true })}
                  >
                    {String.fromCharCode(v > 57 && v < 84 ? v + 7 : (v < 57 ? v : v + 13))}
                  </div>
                )}
                {
                  this.state.refresh
                    ? <div
                      className={styles.mask}
                      onClick={() => {
                        this.setState({ ...this.initState(), refresh: false },function(state){
                          this.canvas()
                        })
                      }}
                      onMouseLeave={() => { this.setState({ refresh: false }) }}
                    > 看不清？点击刷新
                    </div>
                    : null}
              </div>
            </Col>
          </Row>
        </FormItem>
      );
    }
    return (
      <FormItem>
        {getFieldDecorator(name, options)(<Input {...customprops} {...otherProps} />)}
      </FormItem>
    );
  }
}

const LoginItem = {};
Object.keys(ItemMap).forEach(key => {
  const item = ItemMap[key];
  LoginItem[key] = props => (
    <LoginContext.Consumer>
      {context => (
        <WrapFormItem
          customprops={item.props}
          rules={item.rules}
          {...props}
          type={key}
          updateActive={context.updateActive}
          form={context.form}
        />
      )}
    </LoginContext.Consumer>
  );
});

export default LoginItem;
