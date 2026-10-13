import type {ReactNode} from 'react';
import InstallmentManager from './installment-manager';
import SubmittedDocuments from './submitted-documents';

export default function Beneficiary360Layout({children}:{children:ReactNode}){
 return <>{children}<InstallmentManager/><SubmittedDocuments/></>;
}
