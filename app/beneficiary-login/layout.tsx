import type {ReactNode} from 'react';
import BeneficiaryDocumentUploader from '../beneficiary-document-uploader';

export default function BeneficiaryLoginLayout({children}:{children:ReactNode}){
 return <>{children}<BeneficiaryDocumentUploader/></>;
}
