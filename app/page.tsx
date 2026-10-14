import Portal from './portal';
import DashboardPersonalizer from './dashboard-personalizer';
import ManagerRequestsPanel from './manager-requests-panel';
import ManagerBeneficiaryAccountsPanel from './manager-beneficiary-accounts-panel';
import SidebarRequestsLink from './sidebar-requests-link';
import Beneficiary360Links from './beneficiary-360-links';
import ManagementReadonlyGuard from './management-readonly-guard';
import DashboardLiveMetrics from './dashboard-live-metrics';
import OperationsAlertCenter from './operations-alert-center';
import SmartNotificationsRefresh from './smart-notifications-refresh';
import ManagerCommandCenter from './manager-command-center';
import BeneficiaryPortalShare from './beneficiary-portal-share';

export default function Home(){
  return <>
    <DashboardPersonalizer/>
    <DashboardLiveMetrics/>
    <OperationsAlertCenter/>
    <SmartNotificationsRefresh/>
    <SidebarRequestsLink/>
    <Beneficiary360Links/>
    <ManagementReadonlyGuard/>
    <ManagerCommandCenter/>
    <BeneficiaryPortalShare/>
    <Portal/>
    <ManagerRequestsPanel/>
    <ManagerBeneficiaryAccountsPanel/>
  </>;
}
