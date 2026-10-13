import type {ReactNode} from 'react';
import InstallmentManager from './installment-manager';
import SubmittedDocuments from './submitted-documents';
import BeneficiaryInsights from './beneficiary-insights';
import InternalNotes from './internal-notes';
import BeneficiaryTimeline from './timeline';
import Print360Enhancer from './print-360-enhancer';

export default function Beneficiary360Layout({children}:{children:ReactNode}){
 return <><Print360Enhancer/>{children}<BeneficiaryInsights/><InstallmentManager/><SubmittedDocuments/><InternalNotes/><BeneficiaryTimeline/></>;
}
