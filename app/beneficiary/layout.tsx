import type {ReactNode} from 'react';
import BeneficiaryQuickTools from './quick-tools';

export default function BeneficiaryLayout({children}:{children:ReactNode}){
 return <>{children}<BeneficiaryQuickTools/></>;
}
