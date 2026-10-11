import Portal from './portal';
import DashboardPersonalizer from './dashboard-personalizer';
import AuthOverride from './auth-override';

export default function Home(){
  return <><AuthOverride/><DashboardPersonalizer/><Portal/></>;
}
