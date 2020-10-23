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

import { VisRequestHandlersRegistryProvider } from '../../registry/vis_request_handlers';

// 提供导出内容
const noneRequestHandlerProvider = function () {
  return {
    name: 'none',
    handler: function () {
      return new Promise((resolve) => {
        resolve();
      });
    }
  };
};

// 注册模块noneRequestHandlerProvider
VisRequestHandlersRegistryProvider.register(noneRequestHandlerProvider);

export { noneRequestHandlerProvider };
