import { Routes } from '../../config'
import { get, put, post } from '@devtron-labs/devtron-fe-common-lib'
import { ConfigMapRequest } from './types'
import yamlJsParser from 'yamljs'

export function getDeploymentTemplate(
    id: number,
    chartRefId: number,
    abortSignal: AbortSignal,
    isDefaultTemplate?: boolean,
) {
    if (isDefaultTemplate) {
        return get(`${Routes.DEPLOYMENT_TEMPLATE}/${id}/default/${chartRefId}`, {
            signal: abortSignal,
        })
    } else {
        return get(`${Routes.DEPLOYMENT_TEMPLATE}/${id}/${chartRefId}`, {
            signal: abortSignal,
        })
    }
}

export function getDeploymentTemplateData(
    appId: number,
    chartRefId: number,
    isValuesView: boolean,
    abortSignal: AbortSignal,
    envId?: number,
    type?: number,
    deploymentTemplateHistoryId?: number,
    pipelineId?: number,
) {
    const valuesAndManifestFlag = isValuesView ? 1 : 2
    return post(`${Routes.DEPLOYMENT_VALUES_MANIFEST}`, {
        appId,
        chartRefId,
        valuesAndManifestFlag,
        envId,
        type,
        deploymentTemplateHistoryId,
        pipelineId,
    })
}

export function getDeploymentManisfest(request) {
    return post(`${Routes.DEPLOYMENT_VALUES_MANIFEST}`, request)
}

export function getOptions(appId: number, envId: number) {
    return get(`${Routes.DEPLOYMENT_OPTIONS}?appId=${appId}&envId=${envId}`)
}

export function getDefaultDeploymentTemplate(appId, chartId) {
    return get(`${Routes.DEPLOYMENT_TEMPLATE}/default/${appId}/${chartId}`)
}

export const updateDeploymentTemplate = (request, abortSignal) => {
    const URL = `${Routes.DEPLOYMENT_TEMPLATE_UPDATE}`
    return post(URL, request, {
        signal: abortSignal,
    })
}

export const saveDeploymentTemplate = (request, abortSignal) => {
    const URL = `${Routes.DEPLOYMENT_TEMPLATE}`
    return post(URL, request)
}

export function getConfigmap(appId: number) {
    const URL = `${Routes.APP_CONFIG_MAP_GET}/${appId}`
    return get(URL).then((response) => {
        return {
            code: response.code,
            result: configMapModal(response.result, appId),
        }
    })
}

export function saveConfigmap(appId: number, request: ConfigMapRequest) {
    const URL = `${Routes.APP_CONFIG_MAP_SAVE}`
    return post(URL, request).then((response) => {
        return {
            code: response.code,
            result: configMapModal(response.result, appId),
        }
    })
}

export function updateConfigmap(appId: number, request: ConfigMapRequest) {
    const URL = `${Routes.APP_CONFIG_MAP_UPDATE}`
    return put(URL, request).then((response) => {
        return {
            code: response.code,
            result: configMapModal(response.result, appId),
        }
    })
}

export function toggleAppMetrics(appId, payload) {
    return post(`app/template/metrics/${appId}`, payload)
}

function configMapModal(configMap, appId: number) {
    if (configMap) {
        return {
            id: configMap.id,
            appId: configMap.app_id,
            environmentId: configMap.environment_id,
            pipelineId: configMap.pipeline_id,
            configMapValuesOverride: configMap.config_map_data,
            secretsValuesOverride: configMap.secret_data,
            configMapJsonStr: JSON.stringify(configMap.config_map_data || {}, undefined, 2),
            secretsJsonStr: JSON.stringify(configMap.secret_data || {}, undefined, 2),
            configMapYaml: yamlJsParser.stringify(configMap.config_map_data),
            secretsYaml: yamlJsParser.stringify(configMap.secret_data),
        }
    } else {
        return null
    }
}
