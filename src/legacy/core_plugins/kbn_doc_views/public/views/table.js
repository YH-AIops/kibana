/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import _ from 'lodash';
import { DocViewsRegistryProvider } from 'ui/registry/doc_views';

import tableHtml from './table.html';
import { i18n } from '@kbn/i18n';

DocViewsRegistryProvider.register(function () {
  return {
    title: i18n.translate('kbnDocViews.table.tableTitle', {
      defaultMessage: 'Table'
    }),
    order: 10,
    directive: {
      template: tableHtml,
      scope: {
        hit: '=',
        indexPattern: '=',
        filter: '=',
        columns: '=',
        onAddColumn: '=',
        onRemoveColumn: '=',
      },
      controller: function ($scope, $route, ShieldUser) {
        // todo 获取
        // $scope.user = ShieldUser.getCurrent();
        // console.log($scope.user.skyWalking_path);
        // console.log($scope);
        $scope.mapping = $scope.indexPattern.fields.byName;
        $scope.flattened = $scope.indexPattern.flattenHit($scope.hit);
        $scope.formatted = $scope.indexPattern.formatHit($scope.hit);
        $scope.fields = _.keys($scope.flattened).sort();

        $scope.canToggleColumns = function canToggleColumn() {
          return (
            _.isFunction($scope.onAddColumn)
            && _.isFunction($scope.onRemoveColumn)
          );
        };

        $scope.toggleColumn = function toggleColumn(columnName) {
          if ($scope.columns.includes(columnName)) {
            $scope.onRemoveColumn(columnName);
          } else {
            $scope.onAddColumn(columnName);
          }
        };

        $scope.isColumnActive = function isColumnActive(columnName) {
          return $scope.columns.includes(columnName);
        };

        $scope.showArrayInObjectsWarning = function (row, field) {
          const value = $scope.flattened[field];
          return Array.isArray(value) && typeof value[0] === 'object';
        };
        // todo table展示的数据
        // console.log($scope);

        // 判断traceId 则显示跳转
        $scope.showLink = function (row, field) {
          const str = /^(\d+\.)+\d+$/;
          return field === 'traceId' ? str.test(getTraceId()) : false;
        };
        // 跳转到SkyWalkinng追踪页面
        $scope.jump = function () {
          const project = $scope.hit._source.project;
          const path = window.localStorage.getItem('skyWalking_path');
          const url = path + 'trace?project=' + project + '&traceId=' + getTraceId();
          window.open(url,'_blank');
        }

        function getTraceId() {
          let traceId = $scope.hit._source.traceId;
          traceId = traceId.substr(4,traceId.length);
          return traceId;
        }
      }
    }
  };
});
