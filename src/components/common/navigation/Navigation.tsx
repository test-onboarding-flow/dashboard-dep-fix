import React, { Component } from 'react'
import { NavLink, RouteComponentProps } from 'react-router-dom'
import {
    ModuleNameMap,
    MODULE_STATUS_POLLING_INTERVAL,
    MODULE_STATUS_RETRY_COUNT,
    SERVER_MODE,
    URLS,
} from '../../../config'
import { ReactComponent as ApplicationsIcon } from '../../../assets/icons/ic-nav-applications.svg'
import { ReactComponent as ChartStoreIcon } from '../../../assets/icons/ic-nav-helm.svg'
import { ReactComponent as DeploymentGroupIcon } from '../../../assets/icons/ic-nav-rocket.svg'
import { ReactComponent as SecurityIcon } from '../../../assets/icons/ic-nav-security.svg'
import { ReactComponent as BulkEditIcon } from '../../../assets/icons/ic-nav-code.svg'
import { ReactComponent as GlobalConfigIcon } from '../../../assets/icons/ic-nav-gear.svg'
import { ReactComponent as StackManagerIcon } from '../../../assets/icons/ic-nav-stack.svg'
import NavSprite from '../../../assets/icons/navigation-sprite.svg'
import TextLogo from '../../../assets/icons/ic-nav-devtron.svg'
import { Command, CommandErrorBoundary } from '../../command'
import { ModuleStatus } from '../../v2/devtronStackManager/DevtronStackManager.type'
import ReactGA from 'react-ga4'
import './navigation.scss'
import { ReactComponent as ClusterIcon } from '../../../assets/icons/ic-cluster.svg'
import { ReactComponent as CubeIcon } from '../../../assets/icons/ic-cube.svg'
import { ReactComponent as JobsIcon } from '../../../assets/icons/ic-k8s-job.svg'
import { ReactComponent as EnvIcon } from '../../../assets/icons/ic-app-group.svg'
import { getModuleInfo } from '../../v2/devtronStackManager/DevtronStackManager.service'
import { getLoginInfo } from '@devtron-labs/devtron-fe-common-lib'

const NavigationList = [
    {
        title: 'Applications',
        dataTestId: 'click-on-application',
        type: 'link',
        iconClass: 'nav-short-apps',
        icon: ApplicationsIcon,
        href: URLS.APP,
        isAvailableInEA: true,
    },
    {
        title: 'Jobs',
        dataTestId: 'click-on-job',
        type: 'link',
        iconClass: 'nav-short-jobs',
        icon: JobsIcon,
        href: URLS.JOB,
        isAvailableInEA: false,
        markOnlyForSuperAdmin: true,
    },
    {
        title: 'Application Groups',
        dataTestId: 'click-on-application-groups',
        type: 'link',
        iconClass: 'nav-short-env',
        icon: EnvIcon,
        href: URLS.APPLICATION_GROUP,
        isAvailableInEA: false,
        markAsBeta: true,
        forceHideEnvKey: 'HIDE_APPLICATION_GROUPS',
    },
    {
        title: 'Deployment Groups',
        dataTestId: 'click-on-deployment-groups',
        type: 'link',
        iconClass: 'nav-short-bulk-actions',
        icon: DeploymentGroupIcon,
        href: URLS.DEPLOYMENT_GROUPS,
        isAvailableInEA: false,
        forceHideEnvKey: 'HIDE_DEPLOYMENT_GROUPS',
    },
    {
        title: 'Resource Browser',
        dataTestId: 'click-on-resource-browser',
        type: 'link',
        iconClass: 'nav-short-resource-browser',
        icon: CubeIcon,
        href: URLS.RESOURCE_BROWSER,
        isAvailableInEA: true,
        markAsBeta: false,
        isAvailableInDesktop: true,
    },
    {
        title: 'Chart Store',
        dataTestId: 'click-on-chart-store',
        type: 'link',
        iconClass: 'nav-short-helm',
        icon: ChartStoreIcon,
        href: URLS.CHARTS,
        isAvailableInEA: true,
    },
    {
        title: 'Security',
        dataTestId: 'click-on-security',
        type: 'link',
        href: URLS.SECURITY,
        iconClass: 'nav-security',
        icon: SecurityIcon,
        moduleName: ModuleNameMap.SECURITY_CLAIR,
        moduleNameTrivy: ModuleNameMap.SECURITY_TRIVY,
    },
    {
        title: 'Bulk Edit',
        dataTestId: 'click-on-bulk-edit',
        type: 'link',
        href: URLS.BULK_EDITS,
        iconClass: 'nav-bulk-update',
        icon: BulkEditIcon,
        isAvailableInEA: false,
    },
    {
        title: 'Global Configurations',
        dataTestId: 'click-on-global-configuration',
        type: 'link',
        href: URLS.GLOBAL_CONFIG,
        iconClass: 'nav-short-global',
        icon: GlobalConfigIcon,
        isAvailableInEA: true,
        isAvailableInDesktop: true,
    },
]

const NavigationStack = {
    title: 'Devtron Stack Manager',
    dataTestId: 'click-on-stack-manager',
    type: 'link',
    iconClass: 'nav-short-stack',
    icon: StackManagerIcon,
    href: URLS.STACK_MANAGER,
}
interface NavigationType extends RouteComponentProps<{}> {
    serverMode: SERVER_MODE
    moduleInInstallingState: string
    installedModuleMap: React.MutableRefObject<Record<string, boolean>>
    isSuperAdmin: boolean
    isAirgapped: boolean
}

export default class Navigation extends Component<
    NavigationType,
    {
        loginInfo: any
        showLogoutCard: boolean
        showHelpCard: boolean
        showMoreOptionCard: boolean
        isCommandBarActive: boolean
        forceUpdateTime: number
    }
> {
    securityModuleStatusTimer = null
    constructor(props) {
        super(props)
        this.state = {
            loginInfo: getLoginInfo(),
            showLogoutCard: false,
            showHelpCard: false,
            showMoreOptionCard: false,
            isCommandBarActive: false,
            forceUpdateTime: Date.now(),
        }
        this.onLogout = this.onLogout.bind(this)
        this.toggleLogoutCard = this.toggleLogoutCard.bind(this)
        this.toggleHelpCard = this.toggleHelpCard.bind(this)
        this.toggleCommandBar = this.toggleCommandBar.bind(this)
        this.getSecurityModuleStatus(MODULE_STATUS_RETRY_COUNT)
    }

    componentWillUnmount() {
        if (this.securityModuleStatusTimer) {
            clearTimeout(this.securityModuleStatusTimer)
        }
    }

    componentDidUpdate(prevProps) {
        if (
            this.props.moduleInInstallingState !== prevProps.moduleInInstallingState &&
            (this.props.moduleInInstallingState === ModuleNameMap.SECURITY_CLAIR ||
                this.props.moduleInInstallingState === ModuleNameMap.SECURITY_TRIVY)
        ) {
            this.getSecurityModuleStatus(MODULE_STATUS_RETRY_COUNT)
        }
    }

    async getSecurityModuleStatus(retryOnError: number): Promise<void> {
        if (
            this.props.installedModuleMap.current?.[ModuleNameMap.SECURITY_CLAIR] ||
            window._env_.K8S_CLIENT ||
            this.props.installedModuleMap.current?.[ModuleNameMap.SECURITY_TRIVY]
        ) {
            return
        }
        try {
            const { result: trivyResponse } = await getModuleInfo(
                ModuleNameMap.SECURITY_TRIVY,true
            )
            const { result: clairResponse } = await getModuleInfo(
               ModuleNameMap.SECURITY_CLAIR,true
            )
            if (clairResponse?.status === ModuleStatus.INSTALLED) {
                this.props.installedModuleMap.current = {
                    ...this.props.installedModuleMap.current,
                    [ModuleNameMap.SECURITY_CLAIR]: true,
                }
                this.setState({ forceUpdateTime: Date.now() })
            } else if (clairResponse?.status === ModuleStatus.INSTALLING) {
                this.securityModuleStatusTimer = setTimeout(() => {
                    this.getSecurityModuleStatus(MODULE_STATUS_RETRY_COUNT)
                }, MODULE_STATUS_POLLING_INTERVAL)
            }
            if (trivyResponse?.status === ModuleStatus.INSTALLED) {
                this.props.installedModuleMap.current = {
                    ...this.props.installedModuleMap.current,
                    [ModuleNameMap.SECURITY_TRIVY]: true,
                }
                this.setState({ forceUpdateTime: Date.now() })
            } else if (trivyResponse?.status === ModuleStatus.INSTALLING) {
                this.securityModuleStatusTimer = setTimeout(() => {
                    this.getSecurityModuleStatus(MODULE_STATUS_RETRY_COUNT)
                }, MODULE_STATUS_POLLING_INTERVAL)
            }
        } catch (error) {
            if (retryOnError >= 0) {
                this.getSecurityModuleStatus(retryOnError--)
            }
        }
    }

    toggleLogoutCard() {
        this.setState({ showLogoutCard: !this.state.showLogoutCard })
    }

    toggleHelpCard() {
        this.setState({ showHelpCard: !this.state.showHelpCard })
    }

    toggleCommandBar(flag: boolean): void {
        this.setState({ isCommandBarActive: flag })
    }

    onLogout(): void {
        document.cookie = `argocd.token=; expires=Thu, 01-Jan-1970 00:00:01 GMT;path=/`
        this.props.history.push('/login')
    }

    renderNavButton(item) {
        return (
            <button
                type="button"
                key={`side-nav-${item.title}`}
                className="dc__transparent pl-0"
                onClick={(e) => {
                    if (!this.state.isCommandBarActive) {
                        ReactGA.event({
                            category: 'Command Bar',
                            action: 'Open (Click)',
                            label: `${this.props.location.pathname.replace(/\d+/g, '')}`,
                        })
                    } else {
                        ReactGA.event({
                            category: 'Command Bar',
                            action: 'Close',
                            label: '',
                        })
                    }
                    this.toggleCommandBar(!this.state.isCommandBarActive)
                }}
            >
                <div className="short-nav--flex">
                    <div className="svg-container flex">
                        <item.icon className="icon-dim-20" />
                    </div>
                    <div className="expandable-active-nav">
                        <div className="title-container flex left">{item.title}</div>
                    </div>
                </div>
            </button>
        )
    }

    renderNavLink(item, className = '') {
        return (
            <NavLink
                to={item.href}
                key={`side-nav-${item.title}`}
                onClick={(event) => {
                    ReactGA.event({
                        category: 'Main Navigation',
                        action: `${item.title} Clicked`,
                    })
                }}
                className={`flex left ${item.markAsBeta ? 'dc__beta-feat-nav' : ''} ${className || ''}`}
                activeClassName="active-nav"
            >
                <div className="short-nav__item-selected" />
                <div className="short-nav--flex">
                    <div className={`svg-container flex ${item.iconClass}`} data-testid={item?.dataTestId}>
                        <item.icon className="icon-dim-20" />
                    </div>
                    <div className="expandable-active-nav">
                        <div className="title-container flex left">{item.title}</div>
                    </div>
                </div>
            </NavLink>
        )
    }

    canShowNavOption = (item) => {
        const allowedUser = !item.markOnlyForSuperAdmin || this.props.isSuperAdmin
        if (window._env_.K8S_CLIENT) {
            return item.isAvailableInDesktop
        } else if (
            allowedUser &&
            (!item.forceHideEnvKey || (item.forceHideEnvKey && !window?._env_?.[item.forceHideEnvKey]))
        ) {
            return (
                (this.props.serverMode === SERVER_MODE.FULL && !item.moduleName) ||
                (this.props.serverMode === SERVER_MODE.EA_ONLY && item.isAvailableInEA) ||
                this.props.installedModuleMap.current?.[item.moduleName] ||
                this.props.installedModuleMap.current?.[item.moduleNameTrivy]
            )
        }
    }

    render() {
        return (
            <>
                <nav>
                    <aside className="short-nav nav-grid nav-grid--collapsed">
                        <NavLink
                            to={URLS.APP}
                            onClick={(event) => {
                                ReactGA.event({
                                    category: 'Main Navigation',
                                    action: 'Devtron Logo Clicked',
                                })
                            }}
                        >
                            <div className="short-nav--flex">
                                <svg
                                    className="devtron-logo"
                                    data-testid="click-on-devtron-app-logo"
                                    viewBox="0 0 40 40"
                                >
                                    <use href={`${NavSprite}#nav-short-devtron-logo`}></use>
                                </svg>
                                <div className="pl-12">
                                    <img src={TextLogo} alt="devtron" className="devtron-logo devtron-logo--text" />
                                </div>
                            </div>
                        </NavLink>
                        {NavigationList.map((item) => {
                            if (this.canShowNavOption(item)) {
                                if (item.type === 'button') {
                                    return this.renderNavButton(item)
                                } else {
                                    return this.renderNavLink(item)
                                }
                            }
                        })}
                        {!window._env_.K8S_CLIENT && !this.props.isAirgapped && (
                            <>
                                <div className="short-nav__divider" />
                                {this.renderNavLink(NavigationStack, 'short-nav__stack-manager')}
                            </>
                        )}
                    </aside>
                </nav>
                <CommandErrorBoundary toggleCommandBar={this.toggleCommandBar}>
                    <Command
                        location={this.props.location}
                        match={this.props.match}
                        history={this.props.history}
                        isCommandBarActive={this.state.isCommandBarActive}
                        toggleCommandBar={this.toggleCommandBar}
                    />
                </CommandErrorBoundary>
            </>
        )
    }
}
