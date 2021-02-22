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

import { addSearchStrategy } from './search_strategy_registry';
import { isDefaultTypeIndexPattern } from './is_default_type_index_pattern';
import { SearchError } from './search_error';
import buildBody from './build_body';
import axios from 'axios';

let isQuery = false;
let isMerge = false;
function getAllFetchParams(searchRequests, Promise) {
  return Promise.map(searchRequests, (searchRequest) => {
    return Promise.try(searchRequest.getFetchParams, void 0, searchRequest)
      .then((fetchParams) => {
        decide(fetchParams);
        return (searchRequest.fetchParams = fetchParams);
      })
      .then(value => ({ resolved: value }))
      .catch(error => ({ rejected: error }));
  });
}

// todo 判定是否再次请求
function decide(fetchParams) {
  const hostName = document.location.hostname;
  console.log("hostName:" + hostName);
  if (fetchParams.filters && (hostName.indexOf('kibana-prod') !== -1 || hostName.indexOf('localhost') !== -1)) {
    const info = JSON.stringify(fetchParams.filters[fetchParams.filters.length - 1].range);
    const data = JSON.parse(info.substring(14,info.length - 1));
    const lte = new Date(data.lte).getTime();
    const gte = new Date(data.gte).getTime();
    const now = new Date().getTime();
    const fromDay = parseInt((now - gte) / 1000 / (24 * 60 * 60));
    const toDay = parseInt((now - lte) / 1000 / (24 * 60 * 60));
    
    if(fromDay > 30 ) {
      isQuery = true
      toDay > 30 ? isMerge = false : isMerge = true
    } else {
      isQuery = false
    }
  }
}

async function serializeAllFetchParams(fetchParams, searchRequests, serializeFetchParams) {
  const searchRequestsWithFetchParams = [];
  const failedSearchRequests = [];

  // Gather the fetch param responses from all the successful requests.
  fetchParams.forEach((result, index) => {
    if (result.resolved) {
      searchRequestsWithFetchParams.push(result.resolved);
    } else {
      const searchRequest = searchRequests[index];

      searchRequest.handleFailure(result.rejected);
      failedSearchRequests.push(searchRequest);
    }
  });

  return {
    serializedFetchParams: await serializeFetchParams(searchRequestsWithFetchParams),
    failedSearchRequests,
  };
}

export const defaultSearchStrategy = {
  id: 'default',

  search: async ({ searchRequests, es, Promise, serializeFetchParams, includeFrozen = false, maxConcurrentShardRequests = 0 }) => {
    // Flatten the searchSource within each searchRequest to get the fetch params,
    // e.g. body, filters, index pattern, query.
    const allFetchParams = await getAllFetchParams(searchRequests, Promise);

    // 组装请求的body参数
    // Serialize the fetch params into a format suitable for the body of an ES query.
    const {
      serializedFetchParams,
      failedSearchRequests,
    } = await serializeAllFetchParams(allFetchParams, searchRequests, serializeFetchParams);

    if (serializedFetchParams.trim() === '') {
      return {
        failedSearchRequests,
      };
    }

    const msearchParams = {
      rest_total_hits_as_int: true,
      // If we want to include frozen indexes we need to specify ignore_throttled: false
      ignore_throttled: !includeFrozen,
      body: buildBody(serializedFetchParams),
    };

    if (maxConcurrentShardRequests !== 0) {
      msearchParams.max_concurrent_shard_requests = maxConcurrentShardRequests;
    }

    const searching = es.msearch(msearchParams);

    return {
      // Munge data into shape expected by consumer.
      searching: new Promise((resolve, reject) => {
        // Unwrap the responses object returned by the ES client.
        setLoading(true);
        if (isQuery) {
          query(serializedFetchParams).then(res => {
            searching.then(({ responses }) => {
              if (isMerge && responses[0].aggregations) {
                res.data.responses[0].aggregations[2].buckets.push(...responses[0].aggregations[2].buckets);
                res.data.responses[0].hits.hits.push(...responses[0].hits.hits)
                res.data.responses[0].hits.total = res.data.responses[0].hits.total + responses[0].hits.total
              }
              setLoading(false);
              resolve(res.data.responses);
            }).catch(error => {
              // Format ES client error as a SearchError.
              const { statusCode, displayName, message, path } = error;
    
              const searchError = new SearchError({
                status: statusCode,
                title: displayName,
                message,
                path,
              });
    
              reject(searchError);
            });
          }).catch(error => {
            searching.then(({ responses }) => {
              resolve(responses);
            })
            setLoading(false);
          });
        } else {
          searching.then(({ responses }) => {
            setLoading(false);
            resolve(responses);
          }).catch(error => {
            // Format ES client error as a SearchError.
            const { statusCode, displayName, message, path } = error;
  
            const searchError = new SearchError({
              status: statusCode,
              title: displayName,
              message,
              path,
            });
            reject(searchError);
          });
        }

      }),
      abort: searching.abort,
      failedSearchRequests,
    };
  },

  isViable: (indexPattern) => {
    if (!indexPattern) {
      return false;
    }

    return isDefaultTypeIndexPattern(indexPattern);
  },
};

addSearchStrategy(defaultSearchStrategy);

function setLoading(date) {
  window.localStorage.setItem("loading", date);
}

// Hive日志数据查询
// 打包需更改
function query(serializedFetchParams) {
  const data = "{\"index\":\"logstash-*xszt-001-yh-sod-risk-control-20200812,logstash-*xszt-001-yh-sod-risk-control-20200813\",\"ignore_unavailable\":true,\"preference\":1598495119347}\n" +
    "{\"version\":true,\"size\":500,\"sort\":[{\"@timestamp\":{\"order\":\"desc\",\"unmapped_type\":\"boolean\"}}],\"_source\":{\"excludes\":[]},\"aggs\":{\"2\":{\"date_histogram\":{\"field\":\"@timestamp\",\"interval\":\"3h\",\"time_zone\":\"Asia/Shanghai\",\"min_doc_count\":1}}},\"stored_fields\":[\"*\"],\"script_fields\":{},\"docvalue_fields\":[{\"field\":\"@timestamp\",\"format\":\"date_time\"}],\"query\":{\"bool\":{\"must\":[{\"range\":{\"@timestamp\":{\"format\":\"strict_date_optional_time\",\"gte\":\"2020-08-12T00:00:00.000Z\",\"lte\":\"2020-08-12T23:59:59.999Z\"}}}],\"filter\":[{\"match_all\":{}}],\"should\":[],\"must_not\":[]}},\"highlight\":{\"pre_tags\":[\"@kibana-highlighted-field@\"],\"post_tags\":[\"@/kibana-highlighted-field@\"],\"fields\":{\"*\":{}},\"fragment_size\":2147483647},\"timeout\":\"30000ms\"}\n"
  let hive_path = window.localStorage.getItem("hive_path");
  // const data = `${JSON.stringify({
  //   a:1
  // })}
  // ${JSON.stringify({
  //   b:2
  // })}`
  hive_path = hive_path ? hive_path :'http://monitor-prod.kibana-query-proxy.gw.yonghui.cn'
  return axios({
    method: 'post',
    url: hive_path + '/v1/hive',
    headers: {
        'Content-type': 'application/json'
    },
    data: buildBody(serializedFetchParams)
  });
} 