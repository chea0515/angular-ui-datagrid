/**
 * @description  angular data grid component.
 * based on the ES6
 * @author       chenChao
 * @version      v1.1
 */
(function (window, angular) {
/* init datagrid module */
angular.module('ui.datagrid.util', ['ng']);
angular.module('ui.datagrid.toolbar', ['ng']);
angular.module('ui.datagrid.table', ['ng']);
angular.module('ui.datagrid.pagehelper', ['ng']);
angular.module('ui.datagrid', ['ui.datagrid.util', 'ui.datagrid.pagehelper', 'ui.datagrid.toolbar', 'ui.datagrid.table']);

/**
 * grid util
 */
$datagridUtil.$inject = ['$q', '$injector', '$http', '$location', '$templateCache', '$timeout'];
function $datagridUtil($q, $injector, $http, $location, $templateCache, $timeout) {
    // judge/compare
    this.isObject    = angular.isObject;
    this.isFunction  = angular.isFunction;
    this.isArray     = angular.isArray;
    this.copy        = angular.copy;
    this.toJson      = angular.toJson;
    this.isNumber    = angular.isNumber;
    this.isNum       = function(v) {
    	if (v === undefined) {
    		return false;
    	} else if (v === 0) {
    		return true;
    	}
        return !isNaN(v);
    };
    // current path
	this.currentPath = '/';

	// timeout
	this.timeout = function(callback, time) {
	    let _time = time || 10;
        $timeout(function() {
            if (callback && typeof(callback) === 'function') {
                callback();
            }
        }, _time);
    };

    this.http = function(options) {
        if (options && options.url) {
            $http({
                method: options.method || 'GET',
                url   : options.url,
                data  : options.data || {},
                params: options.params || ''
            }).then(
            // success
            function(response) {
                if (options.success && typeof(options.success) === 'function') {
                    options.success(response);
                }
            },
            // error
            function(response) {
                if (options.error && typeof(options.error) === 'function') {
                    options.error(response);
                }
            });
        }
    };

}
angular.module('ui.datagrid.util').service('gridUtil', $datagridUtil);

/**
 * @description build data grid
 */
dataGridDirective.$inject = ['$http', 'gridUtil'];
function dataGridDirective($http, gridUtil) {
	return {
		scope: {
            gridOptions: '='
        },
		priority: 0,
        transclude: true,
        replace: true,
		restrict: 'E',
        template: '<div class="ui-datagrid"><div ng-if="gridCfg.header.length>0"><div grid-toolbar/><div grid-table/><div grid-pagehelper/></div></div>',
		link: function($scope, $element, $attr, $ctrl) {
		    // init grid config
            if (!$scope.gridOptions) $scope.gridOptions = {};
            if (!$scope.gridOptions.pagination) {
                $scope.gridOptions.pagination = {
                    pageShow: true,
                    pageNum: 1,
                    pageSize: 10,
                    position: 'bottom',
                    pageSizeItems: [10, 20, 50]
                };
            }

            /* grid config */
            $scope.gridCfg = {
                // common
                url     : $scope.gridOptions.url || '',
                method  : $scope.gridOptions.method || 'POST',
                // toolbar
                toolbar : $scope.gridOptions.toolbar || [],
                // header
                header  : $scope.gridOptions.header || [],
                // query params
                queryParams: {},
                /**
                 * init
                 */
                init: function(callback) {
                    this.queryParams = {
                        pageNum : $scope.gridOptions.pagination.pageNum || 1,
                        pageSize: $scope.gridOptions.pagination.pageSize || 10
                    };
                    $scope.gridCfg.hToolbar.clear();
                    $scope.gridCfg.hTable.clear();
                    $scope.gridCfg.hPage.clear();
                    $scope.gridCfg.hPage.reload(callback);
                }
            };

            // toolbar
            $scope.gridCfg.hToolbar = {
                barShow: $scope.gridCfg.toolbar.length > 0,
                searchShow: ($scope.gridOptions.searchShow===undefined)?true:$scope.gridOptions.searchShow,
                searchItems: $scope.gridOptions.searchItems || [],
                searchModel: '',
                searchSelItem: {},
                clear: function() {
                    this.searchModel = '';
                    this.searchSelItem = {};
                }
            };
            // table
            $scope.gridCfg.hTable = {
                multiSelect: $scope.gridOptions.multiSelect || false,
                clickRow: $scope.gridOptions.clickRow || null,
                datas: {},
                showLineNum: $scope.gridOptions.showLineNum || false,
                styler: { backgroundColor: '#BBEEFF' },
                dataList: function() {
                    let _list = [];
                    for(let _key in this.datas) {
                        _list.push(this.datas[_key].data);
                    }
                    return _list;
                },
                init: function() {
                    this.datas = {};
                },
                remove: function(key) {
                    delete this.datas[key];
                },
                clear: function() {
                    this.init();
                    $scope.gridCfg.openProperties.selectList = [];
                }
            };
            // page
            $scope.gridCfg.hPage = {
                pageShow: ($scope.gridOptions.pagination.pageShow===undefined)?true:$scope.gridOptions.pagination.pageShow,
                pageSizeItems: $scope.gridOptions.pagination.pageSizeItems || [10, 20, 50],
                position: $scope.gridOptions.pagination.position || 'bottom',
                pageNum : $scope.gridOptions.pagination.pageNum || 1,
                pageSize: $scope.gridOptions.pagination.pageSize || 10,
                totalCount: 0,
                totalPage: 0,
                pageResult: [],
                initComplete: false,
                toPageNum: 1,
                pageNumList: [],
                init: function() {
                    this.pageNumList = [];
                },
                clear: function() {
                    this.init();
                    this.totalCount= 0;
                    this.totalPage= 0;
                    this.pageResult= [];
                    this.toPageNum= 1;
                },
                reload: function(callback, resizePageNum) {
                    this.resizePageInfo(resizePageNum);
                    gridUtil.http({
                        url   : $scope.gridCfg.url,
                        method: $scope.gridCfg.method,
                        data  : JSON.stringify($scope.gridCfg.queryParams),
                        success: function(response) {
                            let respData = response.data;
                            if (respData.success && respData.page) {
                                gridUtil.timeout(function() {
                                    if (respData.page.result) $scope.gridCfg.hPage.pageResult = respData.page.result;
                                    if ($scope.gridCfg.hPage.pageNum !== respData.page.pageNum) {
                                        $scope.gridCfg.hPage.pageNum = respData.page.pageNum;
                                    }
                                    if ($scope.gridCfg.hPage.pageSize !== respData.page.pageSize) {
                                        $scope.gridCfg.hPage.pageSize = respData.page.pageSize;
                                    }
                                    if ($scope.gridCfg.hPage.totalCount !== respData.page.totalCount) {
                                        $scope.gridCfg.hPage.totalCount = respData.page.totalCount;
                                    }
                                    if ($scope.gridCfg.hPage.totalPage !== respData.page.totalPage) {
                                        $scope.gridCfg.hPage.totalPage = respData.page.totalPage;
                                    } else if (!isNaN(respData.page.pageSize)) {
                                        let _totalPage = Math.ceil(respData.page.totalCount / respData.page.pageSize);
                                        if ($scope.gridCfg.hPage.totalPage !== _totalPage) {
                                            $scope.gridCfg.hPage.totalPage = _totalPage;
                                        }
                                    } else if ($scope.gridCfg.hPage.totalPage === 0) {
                                        $scope.gridCfg.hPage.totalPage =
                                            Math.ceil($scope.gridCfg.hPage.totalCount / $scope.gridCfg.hPage.pageSize);
                                    }

                                    if(gridUtil.isFunction(callback)) {
                                        callback(respData);
                                    }
                                }, 100);
                            }
                        },
                        error: function(response) {
                            if(gridUtil.isFunction(callback)) {
                                callback(response);
                            }
                        }
                    });
                },
                load: function(callback) {
                    this.reload(callback, true);
                },
                resizePageInfo: function(resizePageNum) {
                    $scope.gridCfg.hTable.clear();
                    $scope.gridCfg.queryParams.pageNum = resizePageNum ? 1 : $scope.gridCfg.hPage.pageNum;
                    $scope.gridCfg.queryParams.pageSize = $scope.gridCfg.hPage.pageSize;
                    if ($scope.gridCfg.hToolbar.searchSelItem.field) {
                        $scope.gridCfg.hToolbar.searchItems.forEach(item => {
                            if ($scope.gridCfg.queryParams[item.field]) {
                                delete $scope.gridCfg.queryParams[item.field];
                            }
                        });
                        if($scope.gridCfg.hToolbar.searchModel) {
                            $scope.gridCfg.queryParams[$scope.gridCfg.hToolbar.searchSelItem.field] =
                                $scope.gridCfg.hToolbar.searchModel;
                        }
                    }
                }
            };

           // open properties
            $scope.gridCfg.openProperties = {
                selectList: [],
                load  : $scope.gridCfg.hPage.load,
                reload  : $scope.gridCfg.hPage.reload,
                init    : $scope.gridCfg.init,
                clear   : null,
                remove  : null,
                destroy : null,
            };
		}
	};
}
angular.module('ui.datagrid').directive('uiDatagrid', dataGridDirective);

/**
 * gridToolbar directive
 */
$gridToolbarDirective.$inject = ['gridUtil'];
function $gridToolbarDirective(gridUtil) {
    return {
        restrict: 'EA',
        template: '<div ng-if="gridCfg.hToolbar.barShow" class="dg-toolbar"><div class="dg-col-8"><a ng-repeat="t in gridCfg.toolbar" href="javascript:;" ng-click="gridCfg.hToolbar.barClick(t.click)" class="dg-btn bar-item" ng-class="{true:t.styler, false:\'dg-btn-success\'}[t.styler!==null]">' +
            '<i ng-if="t.icon" class="dg-icon" ng-class="t.icon"></i>&nbsp;{{t.title}}</a></div><div class="dg-col-4 dg-txt-right"><div class="dg-row"><div ng-if="gridCfg.hToolbar.searchShow&&gridCfg.hToolbar.searchItems.length>0" class="dg-input-group">' +
            '<select ng-model="gridCfg.hToolbar.searchSelItem" ng-options="item.title for item in gridCfg.hToolbar.searchItems" class="dg-btn"></select>&nbsp;<input type="text" ng-model="gridCfg.hToolbar.searchModel" class="dg-btn dgig-search-input" placeholder="search..." maxlength="50"/>' +
            '<a href="javascript:;" class="dg-btn dg-btn-primary dgig-search-btn" ng-click="gridCfg.hPage.resizePageSizeItems()">GO</a>&nbsp;<a href="javascript:;" ng-click="gridCfg.hPage.reload()" class="dg-btn dg-btn-warning"><i class="dg-icon dg-icon-refresh"></i></a></div></div></div></div>',

        link: function($scope, $ele, $attr) {
            // extends hToolbar
            $scope.gridCfg.hToolbar.barClick = function(c) {
                $scope.gridCfg.openProperties.selectList = $scope.gridCfg.hTable.dataList();
                if(gridUtil.isFunction(c)) {
                    c($scope.gridCfg.openProperties);
                }
            };
        }
    };
}
angular.module('ui.datagrid.toolbar').directive('gridToolbar', $gridToolbarDirective);

/**
 * grid table
 */
$gridTableDirective.$inject = ['gridUtil'];
function $gridTableDirective(gridUtil) {
    return {
        restrict: 'EA',
        template: '<div><table class="dg-table dg-table-hover" border="0" cellspacing="0" cellpadding="0"><thead class="dgt-header"><tr><th ng-if="gridCfg.hTable.showLineNum">#</th><th ng-repeat="h in gridCfg.header" class="dg-txt-center">{{h.title}}</th>' +
            '</tr></thead><tbody><tr ng-if="gridCfg.hPage.pageResult.length===0" class="dg-txt-center"><td colspan="{{gridCfg.header.length+(gridCfg.hTable.showLineNum?1:0)}}">empty data</td>\n'+
            '</tr><tr ng-if="gridCfg.hPage.pageResult.length>0" ng-repeat="rls in gridCfg.hPage.pageResult" class="dg-txt-center" ng-click="gridCfg.hTable.trClick($index, rls)" ng-style="gridCfg.hTable.datas[\'click\'+$index].styler">' +
            '<td ng-if="gridCfg.hTable.showLineNum">{{$index+1}}</td><td ng-repeat="h in gridCfg.header">{{rls[h.field]}}</td></tr></tbody></table></div>',
        link: function($scope, $ele, $attr) {
            $scope.gridCfg.hTable.trClick = function(index, obj) {
                // when toolbar is show
                if ($scope.gridCfg.hToolbar.barShow) {
                    // add or remove
                    if ($scope.gridCfg.hTable.datas[`click${index}`]) {
                        $scope.gridCfg.hTable.remove(`click${index}`);
                    } else {
                        if (!$scope.gridCfg.hTable.multiSelect) {
                            $scope.gridCfg.hTable.clear();
                        }
                        $scope.gridCfg.hTable.datas[`click${index}`] = { styler: $scope.gridCfg.hTable.styler, data: obj };
                    }
                    if (gridUtil.isFunction($scope.gridCfg.hTable.clickRow)) {
                        $scope.gridCfg.hTable.clickRow(obj);
                    }
                }
            };
        }
    };
}
angular.module('ui.datagrid.table').directive('gridTable', $gridTableDirective);

/**
 * page helper
 */
$gridPageHelperDirective.$inject = ['gridUtil'];
function $gridPageHelperDirective(gridUtil) {
    return {
        restrict: 'EA',
        template: '<div class="dg-pagehelper"><div class="dg-txt-right" ng-show="gridCfg.hPage.pageShow"><div class="dgph-items"><a href="javascript:;" ng-click="gridCfg.hPage.reload()"><i class="dg-icon dg-icon-refresh-min" title="reload grid"></i></a>&nbsp;&nbsp;'
            +   '<select class="dg-btn" ng-model="gridCfg.hPage.pageSize" ng-options="i for i in gridCfg.hPage.pageSizeItems" ng-change="gridCfg.hPage.resizePageSizeItems()"></select><span class="dgph-tip">共{{gridCfg.hPage.totalCount}}条</span>'
            +   '<input type="text" ng-model="gridCfg.hPage.toPageNum" ng-blur="gridCfg.hPage.toPage(\'to\')" class="dg-btn dgph-item-input dg-txt-center" maxlength="11"/><ul class="dgph-pagination">'
            +   '<li><a href="javascript:;" ng-click="gridCfg.hPage.toPage(\'previous\')" class="dg-btn"><span>&laquo;</span></a></li>'
            +   '<li ng-repeat="num in gridCfg.hPage.pageNumList"><a href="javascript:;" ng-click="gridCfg.hPage.toPage(\'num\', num)" class="dg-btn" ng-class="{true:\'dgphp-on disabled\', false:\'\'}[num===gridCfg.hPage.pageNum]">{{num}}</a></li>'
            +   '<li><a href="javascript:;" ng-click="gridCfg.hPage.toPage(\'next\')" class="dg-btn"><span>&raquo;</span></a></li></ul></div></div></div>',

        link: function(scope, ele, attr) {
            /*
             * calc page num list
             * type 0: init, 1: onload
             */
            let calcPageNumList = function(type) {
                let totalPage = scope.gridCfg.hPage.totalPage;
                // init
                if (type === 0) {
                    scope.gridCfg.hPage.init();
                    if (totalPage > 0) {
                        let i = 0;
                        if (totalPage <= 5) {
                            while(++i <= totalPage) {
                                scope.gridCfg.hPage.pageNumList.push(i);
                            }
                        } else {
                            while(++i <= 5) {
                                scope.gridCfg.hPage.pageNumList.push(i);
                            }
                        }
                    } else scope.gridCfg.hPage.pageNumList.push(1);
                }
                // onload
                else if (type === 1 && totalPage > 5) {
                    if (scope.gridCfg.hPage.pageNum <= 5) {
                        scope.gridCfg.hPage.init();
                        let i = 0;
                        while (++i <= 5) {
                            scope.gridCfg.hPage.pageNumList.push(i);
                        }
                    } else {
                        if (scope.gridCfg.hPage.pageNum < scope.gridCfg.hPage.pageNumList[0]
                            || scope.gridCfg.hPage.pageNum > scope.gridCfg.hPage.pageNumList[scope.gridCfg.hPage.pageNumList.length - 1]) {
                            scope.gridCfg.hPage.init();
                            let startNum = (scope.gridCfg.hPage.pageNum % 5 === 0)
                                ? (scope.gridCfg.hPage.pageNum - 5)
                                : (scope.gridCfg.hPage.pageNum - scope.gridCfg.hPage.pageNum % 5),
                                endNum = (startNum + 5 <= totalPage) ? (startNum + 5) : totalPage;
                            if (endNum - startNum < 5) {
                                startNum = endNum - 5;
                            }
                            while (++startNum <= endNum) {
                                scope.gridCfg.hPage.pageNumList.push(startNum);
                            }
                        }
                    }
                }
            };
            scope.gridCfg.hPage.resizePageSizeItems = function() {
                scope.gridCfg.hPage.load(function() {
                    calcPageNumList(0);
                });
            };
            // init page num list
            scope.gridCfg.hPage.resizePageSizeItems();
            // num/toNum/previous/next
            scope.gridCfg.hPage.toPage = function(type, num) {
                switch(type) {
                    case 'to':
                        scope.gridCfg.hPage.toPageNum = !isNaN(scope.gridCfg.hPage.toPageNum)
                            ? parseInt(scope.gridCfg.hPage.toPageNum) : 1;
                        if (scope.gridCfg.hPage.pageNum !== scope.gridCfg.hPage.toPageNum) {
                            // resize
                            if (scope.gridCfg.hPage.toPageNum > scope.gridCfg.hPage.totalPage) {
                                scope.gridCfg.hPage.toPageNum = scope.gridCfg.hPage.totalPage;

                            } else if (scope.gridCfg.hPage.toPageNum < 1) {
                                scope.gridCfg.hPage.toPageNum = 1;
                            }

                            scope.gridCfg.hPage.pageNum = scope.gridCfg.hPage.toPageNum;
                            scope.gridCfg.hPage.reload();
                        }
                        break;
                    case 'previous':
                        if (scope.gridCfg.hPage.pageNum <= 1) {
                            // this is the first page
                        } else {
                            scope.gridCfg.hPage.pageNum -= 1;
                            scope.gridCfg.hPage.reload();
                        }
                        break;
                    case 'next':
                        if (scope.gridCfg.hPage.pageNum >= scope.gridCfg.hPage.totalPage) {
                            // this is the last page
                        } else {
                            scope.gridCfg.hPage.pageNum += 1;
                            scope.gridCfg.hPage.reload();
                        }
                        break;
                    case 'num':
                        if (scope.gridCfg.hPage.pageNum !== num) {
                            scope.gridCfg.hPage.pageNum = num;
                            scope.gridCfg.hPage.reload();
                        }
                        break;
                    default:
                        break;
                }
                calcPageNumList(1);
            };
        }
    };
}
angular.module('ui.datagrid.pagehelper').directive('gridPagehelper', $gridPageHelperDirective);
})(window, window.angular);
