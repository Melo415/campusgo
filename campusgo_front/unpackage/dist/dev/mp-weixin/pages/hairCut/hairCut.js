"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "hairCut",
  setup(__props) {
    const hairSalonList = common_vendor.ref([]);
    const getHairSalonList = async () => {
      try {
        const res = await common_vendor.index.request({
          url: "http://localhost:8081/hair-salon/list",
          // 替换为实际的 API 地址
          method: "GET",
          header: {
            authorization: "c2d0e881-150f-4b4d-91c9-acb0a6bd9373"
            // 替换为实际的授权 token
          },
          data: {
            typeId: 2,
            // 假设理发店类型的 typeId 为 2，需根据实际情况修改
            current: 1
          }
        });
        if (res.statusCode === 200 && res.data.success) {
          hairSalonList.value = res.data.data;
        } else {
          common_vendor.index.__f__("error", "at pages/hairCut/hairCut.vue:93", "请求失败:", res.data.errorMsg);
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/hairCut/hairCut.vue:96", "请求出错:", error);
      }
    };
    common_vendor.onMounted(() => {
      getHairSalonList();
    });
    return (_ctx, _cache) => {
      return {
        a: common_vendor.f(hairSalonList.value, (item, index, i0) => {
          return common_vendor.e({
            a: item.image,
            b: common_vendor.t(item.name),
            c: common_vendor.f(Math.floor(item.rating), (star, i, i1) => {
              return {
                a: i
              };
            }),
            d: item.rating % 1 !== 0
          }, item.rating % 1 !== 0 ? {} : {}, {
            e: common_vendor.t(item.rating),
            f: common_vendor.t(item.comments),
            g: common_vendor.f(item.services, (service, i, i1) => {
              return {
                a: common_vendor.t(service),
                b: i
              };
            }),
            h: common_vendor.t(item.avgPrice),
            i: common_vendor.t(item.address),
            j: index
          });
        })
      };
    };
  }
};
wx.createPage(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/hairCut/hairCut.js.map
