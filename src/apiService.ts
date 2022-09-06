import Axios from "axios";
import history from './history';
import { notification } from "antd";

// let index = 0;

export default class ApiService {
  static CallApi(method: string, path: string, params: object, completedCallback: Function, failedCallback?: Function): void {

    let url = path;
    if (method === "GET" && params) {
      //put them into a string (eg. "param1=val1&param2=val2")
      url += "?" + Object.keys(params).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key])).join('&');
    }

    Axios.interceptors.response.use(
      (response) => {
        if (response.data && response.data.code === 999) {
          notification.destroy();
          notification['error']({ message: '登陆过期，请重新登陆！' });
          window.location.href = '/user/login';
        }
        return response;
      },
      (error) => {}
    );

    const apiCall = (url: any, options: any) => {

      if (method === "GET") {
        //GET ------------------------------
        Axios.get(url, options)
          .then(response => {
            completedCallback(response.data);
          })
          .catch(error => {
            console.log(error)
            if (failedCallback){
              failedCallback(error ? error.toString() : '网络错误！');
            }else{
              notification.destroy();
              notification['error']({ message: error ? error.toString():'网络错误！' })
            }
          });
      } else {
        //POST ----------------------------
        Axios.post(url, params, options)
          .then(response => {
            completedCallback(response.data);
          })
          .catch(error => {
            console.log(error)
            if (failedCallback) {
              failedCallback(error ? error.toString():'网络错误！');
            } else {
              notification.destroy();
              notification['error']({ message: error ? error.toString() : '网络错误！' })
            }
        });
      }
    }
    apiCall(url, {
      headers: {
        'token': sessionStorage.getItem('token')
      }
    });
  }

}