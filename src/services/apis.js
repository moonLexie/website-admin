let prefix = '';
let hostname = 'localhost'

if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  prefix = '/api';
  hostname = 'http://yunmeida.vipgz1.idcfengye.com'
}

const Api = {
  login: `${prefix}/managerUserInfo/login`,
  emfindAll: `${prefix}/managerBaseInfo/findAllBaseInfo`,
  emmodifyBaseInfo: `${prefix}/managerBaseInfo/modifyBaseInfo`,
  emupLoadOfficalPic: `${prefix}/managerBaseInfo/upLoadOfficalPic`,
  emaddCarouselPic: `${prefix}/managerCarouselPic/addCarouselPic`,
  pmFindAllBrand: `${prefix}/managerBrand/findAllBrand`,
  pmDeleteBrandById: `${prefix}/managerBrand/deleteBrandById`,
  pmFindAllProductLine: `${prefix}/managerProductLine/findAllProductLine`,
  pmAddBrand: `${prefix}/managerBrand/addBrand`,
  pmModifyBrandById: `${prefix}/managerBrand/modifyBrandById`,
  cmFindAllType: `${prefix}/managerType/findAllType`,
  cmAddType: `${prefix}/managerType/addType`,
  cmDeleteTypeByTypeInfo: `${prefix}/managerType/deleteTypeByTypeInfo`,
  cmModifyTypeByTypeInfo: `${prefix}/managerType/modifyTypeByTypeInfo`,
  psmFindAllProduct: `${prefix}/managerBrandProduct/findAllBrandProduct`,
  psmDeleteBrandProductById: `${prefix}/managerBrandProduct/deleteBrandProductById`,
  psmAddBrandProduct: `${prefix}/managerBrandProduct/addBrandProduct`,
  psmModifyBrandProductById: `${prefix}/managerBrandProduct/modifyBrandProductById`,
  umAddUser: `${prefix}/managerUser/addUser`,
  umFindAllUserInfo: `${prefix}/managerUser/findAllUserInfo`,
  umDeleteUserInfoById: `${prefix}/managerUser/deleteUserInfoById`,
  umModifyUserInfoById: `${prefix}/managerUser/modifyUserInfoById`,
  nmFindAllNews: `${prefix}/managerNews/findAllNews`,
  nmDeleteNewsById: `${prefix}/managerNews/deleteNewsById`,
  nmAddNews: `${prefix}/managerNews/addNews`,
  nmModifyNewsById: `${prefix}/managerNews/modifyNewsById`,
  rmFindAllRecruitInfo: `${prefix}/managerRecruitInfo/findAllRecruitInfo`,
  rmAddRecruitInfo: `${prefix}/managerRecruitInfo/addRecruitInfo`,
  rmModifyRecruitInfoById: `${prefix}/managerRecruitInfo/modifyRecruitInfoById`,
  rmDeleteRecruitInfoById: `${prefix}/managerRecruitInfo/deleteRecruitInfoById`,
  UpLoadPic: `${prefix}/managerUpLoadFile/UpLoadPic`,
  deletePicByImgPaths: `${prefix}/managerUpLoadFile/deletePicByImgPaths`,

};

export { Api, hostname };