---  angular表格插件使用文档  ---
版本：v 1.1
说明：
图标样式调整。

版本：v 1.0
说明：
一、angular注入依赖：
angular.module('myApp', [ui.datagrid']);

二、页面使用：
1. html引入：
<ui-datagrid grid-options="dataGridOptions"></ui-datagrid>
2.数据初始化：
$scope.dataGridOptions = {
    url: 'http://',
    method: 'POST',
    toolbar: [{
          title: '增加',
          icon: 'dg-icon-plus',
          styler: 'dg-btn-primary',
          click: function(o) {
              console.log(o)
          }
      }, {
          title: '删除',
          icon: 'dg-icon-remove',
          styler: 'dg-btn-success',
          click: function(o) {
              console.log(o)
          }
      }, {
          title: '修改',
          icon: 'dg-icon-edit',
          styler: 'dg-btn-info',
          click: function(o) {
              console.log(o)
          }
    }],
    header: [{
        field: 'title',
        title: '标题'
    }, {
        field: 'content',
        title: '内容'
    }, {
        field: 'createTime',
        title: '创建时间',
        sortBy: true
    }],
    pagination: {
        pageShow: true,
        pageNum: 1,
        pageSize: 10,
        pageSizeItems: [10, 20, 50]
    },
    searchShow: true,
    searchItems: [{
        title: '标题',
        field: 'title'
    }, {
        title: '内容',
        field: 'content'
    }],
    // 多选
    multiSelect: true,
    // 显示行号
    showLineNum: true,
    // 行点击
    clickRow: function(row) {
        console.log(row)
    }
};
3.分页数据返回格式：
{
    success: true, // true/false
    page: {
        pageNum: 1,
        pageSize: 10,
        totalCount: 100,
        result: [{}]
    }
}

注：点击头部排序功能尚未完成。