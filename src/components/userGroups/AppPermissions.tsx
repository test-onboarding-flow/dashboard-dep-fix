import React, { useContext, useEffect } from 'react'
import { NavLink, Switch, Route, Redirect } from 'react-router-dom'
import {
    APPROVER_ACTION,
    CONFIG_APPROVER_ACTION,
    ChartPermission,
    DirectPermission,
    useUserGroupContext,
} from './UserGroup'
import { ReactComponent as AddIcon } from '../../assets/icons/ic-add.svg'
import { useRouteMatch } from 'react-router'
import { ACCESS_TYPE_MAP, HELM_APP_UNASSIGNED_PROJECT, SERVER_MODE } from '../../config'
import {
    ActionTypes,
    APIRoleFilter,
    AppPermissionsDetailType,
    AppPermissionsType,
    ChartGroupPermissionsFilter,
    DirectPermissionsRoleFilter,
    EntityTypes,
} from './userGroups.types'
import { mapByKey, removeItemsFromArray } from '../common'
import { mainContext } from '../common/navigation/NavigationRoutes'
import K8sPermissons from './K8sObjectPermissions/K8sPermissons'
import { apiGroupAll } from './K8sObjectPermissions/K8sPermissions.utils'

export default function AppPermissions({
    data = null,
    directPermission,
    setDirectPermission,
    chartPermission,
    setChartPermission,
    hideInfoLegend,
    k8sPermission,
    setK8sPermission,
    currentK8sPermissionRef,
}: AppPermissionsType) {
    const { serverMode } = useContext(mainContext)
    const {
        appsList,
        fetchAppList,
        projectsList,
        environmentsList,
        envClustersList,
        fetchAppListHelmApps,
        appsListHelmApps,
        superAdmin,
    } = useUserGroupContext()
    const { url, path } = useRouteMatch()
    const emptyDirectPermissionDevtronApps: DirectPermissionsRoleFilter = {
        entity: EntityTypes.DIRECT,
        entityName: [],
        environment: [],
        team: null,
        action: {
            label: '',
            value: ActionTypes.VIEW,
        },
        accessType: ACCESS_TYPE_MAP.DEVTRON_APPS,
    }
    const emptyDirectPermissionHelmApps = {
        ...emptyDirectPermissionDevtronApps,
        accessType: ACCESS_TYPE_MAP.HELM_APPS,
    }
    useEffect(() => {
        if (!data) {
            let emptyPermissionArr = [emptyDirectPermissionHelmApps]

            emptyPermissionArr.push(emptyDirectPermissionDevtronApps)

            setDirectPermission(emptyPermissionArr)
            return
        }
        populateDataFromAPI(data.roleFilters ?? [])
    }, [data])
    const { customRoles } = useUserGroupContext()
    function setAllApplication(directRolefilter: APIRoleFilter, projectId) {
        if (directRolefilter.team !== HELM_APP_UNASSIGNED_PROJECT) {
            return [
                { label: 'All applications', value: '*' },
                ...(
                    (directRolefilter.accessType === ACCESS_TYPE_MAP.DEVTRON_APPS ? appsList : appsListHelmApps).get(
                        projectId,
                    )?.result || []
                ).map((app) => ({
                    label: app.name,
                    value: app.name,
                })),
            ]
        } else {
            return [{ label: 'All applications', value: '*' }]
        }
    }

    function setAllEnv(directRolefilter: APIRoleFilter) {
        if (directRolefilter.accessType === ACCESS_TYPE_MAP.DEVTRON_APPS) {
            if (directRolefilter.environment) {
                return directRolefilter.environment
                    .split(',')
                    .map((directRole) => ({ value: directRole, label: directRole }))
            } else {
                return [
                    { label: 'All environments', value: '*' },
                    ...environmentsList.map((env) => ({
                        label: env.environment_name,
                        value: env.environmentIdentifier,
                    })),
                ]
            }
        } else if (directRolefilter.accessType === ACCESS_TYPE_MAP.HELM_APPS) {
            let returnArr = []
            let envArr = directRolefilter.environment.split(',')
            let envMap: Map<string, boolean> = new Map()
            envArr.forEach((element) => {
                const endsWithStar = element.endsWith('*')
                if (endsWithStar) {
                    const clusterName = element.slice(0, -3)
                    returnArr.push(...setClusterValues(endsWithStar, clusterName))
                } else {
                    envMap.set(element, true)
                }
            })
            envMap.size !== 0 &&
                envClustersList.some((element) => {
                    envMap.size !== 0 &&
                        element.environments.some((env) => {
                            if (envMap.get(env.environmentIdentifier)) {
                                returnArr.push({
                                    label: env.environmentName,
                                    value: env.environmentIdentifier,
                                    namespace: env.namespace,
                                    clusterName: element.clusterName,
                                })
                                envMap.delete(env.environmentName)
                                if (envMap.size === 0) {
                                    return true
                                }
                            }
                        })
                })
            return returnArr
        }
    }

    async function populateDataFromAPI(roleFilters: APIRoleFilter[]) {
        const projectsMap = projectsList ? mapByKey(projectsList, 'name') : new Map()
        let foundDevtronApps = false,
            foundHelmApps = false,
            uniqueProjectIdsDevtronApps = [],
            uniqueProjectIdsHelmApps = []

        roleFilters?.forEach((element) => {
            if (element.entity === EntityTypes.DIRECT) {
                const projectId = projectsMap.get(element.team)?.id
                if (typeof projectId !== 'undefined' && projectId != null) {
                    if (element['accessType'] === ACCESS_TYPE_MAP.DEVTRON_APPS) {
                        uniqueProjectIdsDevtronApps.push(projectId)
                    } else if (element['accessType'] === ACCESS_TYPE_MAP.HELM_APPS) {
                        uniqueProjectIdsHelmApps.push(projectId)
                    }
                }
            }
        })
        await Promise.all([
            fetchAppList([...new Set(uniqueProjectIdsDevtronApps)].map(Number)),
            fetchAppListHelmApps([...new Set(uniqueProjectIdsHelmApps)].map(Number)),
        ])

        const directPermissions: DirectPermissionsRoleFilter[] = roleFilters
            ?.filter((roleFilter: APIRoleFilter) => roleFilter.entity === EntityTypes.DIRECT)
            ?.map((directRolefilter: APIRoleFilter, index: number) => {
                const projectId =
                    directRolefilter.team !== HELM_APP_UNASSIGNED_PROJECT && projectsMap.get(directRolefilter.team)?.id
                if (!directRolefilter['accessType']) {
                    directRolefilter['accessType'] = ACCESS_TYPE_MAP.DEVTRON_APPS
                }
                if (directRolefilter.accessType === ACCESS_TYPE_MAP.DEVTRON_APPS) {
                    foundDevtronApps = true
                } else if (directRolefilter.accessType === ACCESS_TYPE_MAP.HELM_APPS) {
                    foundHelmApps = true
                }
                return {
                    ...directRolefilter,
                    action: { label: directRolefilter.action, value: directRolefilter.action },
                    team: { label: directRolefilter.team, value: directRolefilter.team },
                    entity: EntityTypes.DIRECT,
                    entityName: directRolefilter?.entityName
                        ? directRolefilter.entityName.split(',').map((entity) => ({ value: entity, label: entity }))
                        : setAllApplication(directRolefilter, projectId),
                    environment: setAllEnv(directRolefilter),
                } as DirectPermissionsRoleFilter
            })

        if (!foundDevtronApps && serverMode !== SERVER_MODE.EA_ONLY) {
            directPermissions.push(emptyDirectPermissionDevtronApps)
        }
        if (!foundHelmApps) {
            directPermissions.push(emptyDirectPermissionHelmApps)
        }
        setDirectPermission(directPermissions)

        const tempChartPermission: APIRoleFilter = roleFilters?.find(
            (roleFilter) => roleFilter.entity === EntityTypes.CHART_GROUP,
        )
        if (tempChartPermission) {
            const chartPermission: ChartGroupPermissionsFilter = {
                entity: EntityTypes.CHART_GROUP,
                entityName:
                    tempChartPermission?.entityName.split(',')?.map((entity) => ({ value: entity, label: entity })) ||
                    [],
                action: tempChartPermission.action === '*' ? ActionTypes.ADMIN : tempChartPermission.action,
            }

            setChartPermission(chartPermission)
        }

        const _assignedRoleFilters: APIRoleFilter[] = roleFilters?.filter(
            (roleFilter) => roleFilter.entity === EntityTypes.CLUSTER,
        )
        if (_assignedRoleFilters) {
            const _k8sPermission = _assignedRoleFilters.map((k8s) => {
                return {
                    entity: EntityTypes.CLUSTER,
                    cluster: { label: k8s.cluster, value: k8s.cluster },
                    namespace: {
                        label: k8s.namespace === '' ? 'All Namespaces / Cluster' : k8s.namespace,
                        value: k8s.namespace === '' ? '*' : k8s.namespace,
                    },
                    group: { label: apiGroupAll(k8s.group, true), value: apiGroupAll(k8s.group) },
                    action: { label: customRoles.possibleRolesMetaForCluster[k8s.action].value, value: k8s.action },
                    kind: { label: k8s.kind === '' ? 'All Kinds' : k8s.kind, value: k8s.kind === '' ? '*' : k8s.kind },
                    resource: k8s.resource
                        .split(',')
                        ?.map((entity) => ({ value: entity || '*', label: entity || 'All resources' })),
                }
            })

            if (currentK8sPermissionRef?.current) {
                currentK8sPermissionRef.current = [..._k8sPermission]
            }
            setK8sPermission(_k8sPermission)
        }
    }

    function setClusterValues(startsWithHash, clusterName) {
        let defaultValueArr = []
        if (startsWithHash) {
            defaultValueArr.push({
                label: 'All existing + future environments in ' + clusterName,
                value: '#' + clusterName,
                namespace: '',
                clusterName: '',
            })
        }
        defaultValueArr.push({
            label: 'All existing environments in ' + clusterName,
            value: '*' + clusterName,
            namespace: '',
            clusterName: '',
        })
        const selectedCluster = envClustersList?.filter((cluster) => cluster.clusterName === clusterName)[0]

        return [
            ...defaultValueArr,
            ...selectedCluster['environments']?.map((env) => ({
                label: env.environmentName,
                value: env.environmentIdentifier,
                namespace: env.namespace,
                clusterName: clusterName,
            })),
        ]
    }

    function setEnvValues(index, selectedValue, actionMeta, tempPermissions) {
        const { action, option, name } = actionMeta
        const { value, clusterName } = option || { value: '', clusterName: '' }
        const startsWithHash = value && value.startsWith('#')
        if ((value && value.startsWith('*')) || startsWithHash) {
            if (tempPermissions[index].accessType === ACCESS_TYPE_MAP.HELM_APPS) {
                const clusterName = value.substring(1)
                // uncheck all environments
                tempPermissions[index][name] = tempPermissions[index][name]?.filter(
                    (env) =>
                        env.clusterName !== clusterName &&
                        env.value !== '#' + clusterName &&
                        env.value !== '*' + clusterName,
                )
                if (action === 'select-option') {
                    // check all environments
                    tempPermissions[index][name] = [
                        ...tempPermissions[index][name],
                        ...setClusterValues(startsWithHash, clusterName),
                    ]
                    tempPermissions[index]['environmentError'] = null
                }
            } else {
                if (action === 'select-option') {
                    // check all environments
                    tempPermissions[index][name] = [
                        { label: 'All environments', value: '*' },
                        ...environmentsList.map((env) => ({
                            label: env.environment_name,
                            value: env.environmentIdentifier,
                        })),
                    ]
                    tempPermissions[index]['environmentError'] = null
                } else {
                    // uncheck all environments
                    tempPermissions[index][name] = []
                }
            }
        } else {
            if (tempPermissions[index].accessType === ACCESS_TYPE_MAP.HELM_APPS) {
                tempPermissions[index][name] = selectedValue.filter(
                    ({ value, label }) => value !== '*' + clusterName && value !== '#' + clusterName,
                )
            } else {
                tempPermissions[index][name] = selectedValue.filter(({ value, label }) => value !== '*')
            }

            tempPermissions[index]['environmentError'] = null
        }
    }

    function handleDirectPermissionChange(index, selectedValue, actionMeta) {
        const { action, option, name } = actionMeta
        const tempPermissions = [...directPermission]
        if (name === 'entityName') {
            const { value } = option || { value: '' }
            if (value === '*') {
                if (action === 'select-option') {
                    if (tempPermissions[index]['team'].value !== HELM_APP_UNASSIGNED_PROJECT) {
                        const projectId = projectsList.find(
                            (project) => project.name === tempPermissions[index]['team'].value,
                        ).id
                        tempPermissions[index][name] = [
                            { label: 'Select all', value: '*' },
                            ...(tempPermissions[index].accessType === ACCESS_TYPE_MAP.DEVTRON_APPS
                                ? appsList
                                : appsListHelmApps
                            )
                                .get(projectId)
                                .result.map((app) => ({ label: app.name, value: app.name })),
                        ]
                    } else {
                        tempPermissions[index][name] = [{ label: 'Select all', value: '*' }]
                    }
                    tempPermissions[index]['entityNameError'] = null
                } else {
                    tempPermissions[index][name] = []
                }
            } else {
                tempPermissions[index][name] = selectedValue.filter(({ value, label }) => value !== '*')
                tempPermissions[index]['entityNameError'] = null
            }
        } else if (name === 'environment') {
            setEnvValues(index, selectedValue, actionMeta, tempPermissions)
        } else if (name === 'team') {
            tempPermissions[index][name] = selectedValue
            tempPermissions[index]['entityName'] = []
            tempPermissions[index]['environment'] = []
            if (tempPermissions[index]['team'].value !== HELM_APP_UNASSIGNED_PROJECT) {
                const projectId = projectsList.find(
                    (project) => project.name === tempPermissions[index]['team'].value,
                ).id
                tempPermissions[index].accessType === ACCESS_TYPE_MAP.DEVTRON_APPS
                    ? fetchAppList([projectId])
                    : fetchAppListHelmApps([projectId])
            }
        } else if (name === APPROVER_ACTION.label) {
            tempPermissions[index][name] = !tempPermissions[index][name]
        } else if (name === CONFIG_APPROVER_ACTION.label) {
            tempPermissions[index]['action'].configApprover = !tempPermissions[index]['action'].configApprover
        } else {
            if (
                tempPermissions[index][name].configApprover ||
                tempPermissions[index][name].value.includes(CONFIG_APPROVER_ACTION.value)
            ) {
                selectedValue.configApprover = true
            }
            tempPermissions[index][name] = selectedValue
        }
        setDirectPermission(tempPermissions)
    }

    function removeDirectPermissionRow(index) {
        setDirectPermission((permission) => {
            let foundDevtronApps = false,
                foundHelmApps = false
            let permissionArr = removeItemsFromArray(permission, index, 1)
            for (let i = 0; i < permissionArr.length; i++) {
                if (permissionArr[i].accessType === ACCESS_TYPE_MAP.DEVTRON_APPS) {
                    foundDevtronApps = true
                } else if (permissionArr[i].accessType === ACCESS_TYPE_MAP.HELM_APPS) {
                    foundHelmApps = true
                }
            }
            if (!foundDevtronApps && serverMode !== SERVER_MODE.EA_ONLY) {
                permissionArr.push(emptyDirectPermissionDevtronApps)
            }
            if (!foundHelmApps) {
                permissionArr.push(emptyDirectPermissionHelmApps)
            }
            return permissionArr
        })
    }

    function AddNewPermissionRowLocal(accessType) {
        if (accessType === ACCESS_TYPE_MAP.DEVTRON_APPS) {
            setDirectPermission((permission) => [...permission, emptyDirectPermissionDevtronApps])
        } else if (accessType === ACCESS_TYPE_MAP.HELM_APPS) {
            setDirectPermission((permission) => [...permission, emptyDirectPermissionHelmApps])
        }
    }

    return (
        <>
            <ul role="tablist" className="tab-list mt-12 dc__border-bottom">
                {serverMode !== SERVER_MODE.EA_ONLY && (
                    <li className="tab-list__tab">
                        <NavLink
                            to={`${url}/devtron-apps`}
                            data-testid="devtron-app-permission-tab"
                            className="tab-list__tab-link"
                            activeClassName="active"
                        >
                            Devtron Apps
                        </NavLink>
                    </li>
                )}
                <li className="tab-list__tab">
                    <NavLink
                        to={`${url}/helm-apps`}
                        data-testid="helm-app-permission-tab"
                        className="tab-list__tab-link"
                        activeClassName="active"
                    >
                        Helm Apps
                    </NavLink>
                </li>
                {superAdmin && (
                    <li className="tab-list__tab">
                        <NavLink
                            to={`${url}/kubernetes-objects`}
                            data-testid="kube-resource-permission-tab"
                            className="tab-list__tab-link"
                            activeClassName="active"
                        >
                            Kubernetes Resources
                        </NavLink>
                    </li>
                )}
                {serverMode !== SERVER_MODE.EA_ONLY && (
                    <li className="tab-list__tab">
                        <NavLink
                            to={`${url}/chart-groups`}
                            data-testid="chart-group-permission-tab"
                            className="tab-list__tab-link"
                            activeClassName="active"
                        >
                            Chart Groups
                        </NavLink>
                    </li>
                )}
            </ul>
            <div>
                <Switch>
                    {serverMode !== SERVER_MODE.EA_ONLY && (
                        <Route path={`${path}/devtron-apps`}>
                            <AppPermissionDetail
                                accessType={ACCESS_TYPE_MAP.DEVTRON_APPS}
                                removeDirectPermissionRow={removeDirectPermissionRow}
                                handleDirectPermissionChange={handleDirectPermissionChange}
                                AddNewPermissionRow={AddNewPermissionRowLocal}
                                directPermission={directPermission}
                                hideInfoLegend={hideInfoLegend}
                            />
                        </Route>
                    )}
                    <Route path={`${path}/helm-apps`}>
                        <AppPermissionDetail
                            accessType={ACCESS_TYPE_MAP.HELM_APPS}
                            removeDirectPermissionRow={removeDirectPermissionRow}
                            handleDirectPermissionChange={handleDirectPermissionChange}
                            AddNewPermissionRow={AddNewPermissionRowLocal}
                            directPermission={directPermission}
                            hideInfoLegend={hideInfoLegend}
                        />
                    </Route>
                    {superAdmin && (
                        <Route path={`${path}/kubernetes-objects`}>
                            <K8sPermissons k8sPermission={k8sPermission} setK8sPermission={setK8sPermission} />
                        </Route>
                    )}
                    {serverMode !== SERVER_MODE.EA_ONLY && (
                        <Route path={`${path}/chart-groups`}>
                            <ChartPermission
                                chartPermission={chartPermission}
                                setChartPermission={setChartPermission}
                                hideInfoLegend={hideInfoLegend}
                            />
                        </Route>
                    )}
                    <Redirect to={serverMode !== SERVER_MODE.EA_ONLY ? `${path}/devtron-apps` : `${path}/helm-apps`} />
                </Switch>
            </div>
        </>
    )
}

function AppPermissionDetail({
    accessType,
    handleDirectPermissionChange,
    removeDirectPermissionRow,
    AddNewPermissionRow,
    directPermission,
    hideInfoLegend,
}: AppPermissionsDetailType) {
    return (
        <>
            {!hideInfoLegend && (
                <legend>
                    {accessType === ACCESS_TYPE_MAP.DEVTRON_APPS
                        ? 'Manage permission for custom apps created using devtron'
                        : 'Manage permission for helm apps deployed from devtron or outside devtron'}
                </legend>
            )}
            <div
                className="w-100 mt-16"
                style={{
                    display: 'grid',
                    gridTemplateColumns:
                        accessType === ACCESS_TYPE_MAP.DEVTRON_APPS ? '1fr 1fr 1fr 1fr 24px' : '1fr 2fr 1fr 1fr 24px',
                }}
            >
                <label className="fw-6 fs-12 cn-5">Project</label>
                <label className="fw-6 fs-12 cn-5">
                    Environment{accessType === ACCESS_TYPE_MAP.DEVTRON_APPS ? '' : ' or cluster/namespace'}
                </label>
                <label className="fw-6 fs-12 cn-5">Application</label>
                <label className="fw-6 fs-12 cn-5">
                    {accessType === ACCESS_TYPE_MAP.DEVTRON_APPS ? 'Role' : 'Permission'}
                </label>
                <span />
            </div>
            <div
                className="w-100 mb-16"
                style={{
                    display: 'grid',
                    gridTemplateColumns:
                        accessType === ACCESS_TYPE_MAP.DEVTRON_APPS ? '1fr 1fr 1fr 1fr 24px' : '1fr 2fr 1fr 1fr 24px',
                    gridGap: '16px',
                }}
            >
                {directPermission.map(
                    (permission, idx) =>
                        permission.accessType === accessType && (
                            <DirectPermission
                                index={idx}
                                key={idx}
                                permission={permission}
                                removeRow={removeDirectPermissionRow}
                                handleDirectPermissionChange={(value, actionMeta) =>
                                    handleDirectPermissionChange(idx, value, actionMeta)
                                }
                            />
                        ),
                )}
            </div>
            <b
                className="anchor pointer flex left"
                style={{ width: '90px' }}
                onClick={(e) => AddNewPermissionRow(accessType)}
            >
                <AddIcon className="add-svg mr-12" /> Add row
            </b>
        </>
    )
}
