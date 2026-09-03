import React from 'react';

// --- TypeScript Interfaces ---
export interface PatientInfo {
  id: string;
  name: string;
  dob: string;
  age: number;
  gender: string;
}

export interface ProviderInfo {
  referringPhysician: string;
  facility: string;
  collectionDate: string;
  receivedDate: string;
  reportDate: string;
}

export interface SpecimenDetails {
  accessionNumber: string;
  specimenType: string;
  source: string;
  clinicalIndication: string;
}

export interface PathologyResults {
  grossDescription: string;
  microscopicDescription: string;
  finalDiagnosis: string;
  comments?: string;
  icd10Code?: string;
}

export interface PathologyReportProps {
  patient: PatientInfo;
  provider: ProviderInfo;
  specimen: SpecimenDetails;
  results: PathologyResults;
  pathologistName: string;
  pathologistCredentials: string;
  labName: string;
}

// --- Component ---
const PathologyReport: React.FC<PathologyReportProps> = ({
  patient,
  provider,
  specimen,
  results,
  pathologistName,
  pathologistCredentials,
  labName,
}) => {
  return (
    <div className="max-w-4xl mx-auto p-10 bg-white border border-gray-300 shadow-sm text-gray-800 font-sans print:shadow-none print:border-none print:p-0">
      
      {/* Header Section */}
      <header className="flex justify-between items-end border-b-2 border-gray-800 pb-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-wider">Pathology Report</h1>
          <p className="text-sm text-gray-600 mt-1 font-medium">{labName} - Department of Anatomic Pathology</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Accession No.</p>
          <p className="font-mono font-bold text-lg text-gray-900">{specimen.accessionNumber}</p>
        </div>
      </header>

      {/* Patient & Specimen Meta Data */}
      <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
        {/* Patient Details */}
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
          <h2 className="font-bold text-gray-700 border-b border-gray-200 pb-2 mb-3 uppercase text-xs tracking-wider">Patient Demographics</h2>
          <div className="grid grid-cols-3 gap-y-2">
            <span className="font-medium text-gray-500">Name:</span>
            <span className="col-span-2 font-semibold text-gray-900">{patient.name}</span>
            
            <span className="font-medium text-gray-500">Patient ID:</span>
            <span className="col-span-2 font-mono">{patient.id}</span>
            
            <span className="font-medium text-gray-500">DOB / Age:</span>
            <span className="col-span-2">{patient.dob} ({patient.age} yrs)</span>
            
            <span className="font-medium text-gray-500">Gender:</span>
            <span className="col-span-2">{patient.gender}</span>
          </div>
        </div>

        {/* Provider & Specimen Details */}
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
          <h2 className="font-bold text-gray-700 border-b border-gray-200 pb-2 mb-3 uppercase text-xs tracking-wider">Clinical Details</h2>
          <div className="grid grid-cols-3 gap-y-2">
            <span className="font-medium text-gray-500">Physician:</span>
            <span className="col-span-2 font-semibold text-gray-900">{provider.referringPhysician}</span>
            
            <span className="font-medium text-gray-500">Collected:</span>
            <span className="col-span-2">{provider.collectionDate}</span>
            
            <span className="font-medium text-gray-500">Reported:</span>
            <span className="col-span-2">{provider.reportDate}</span>
            
            <span className="font-medium text-gray-500">Specimen:</span>
            <span className="col-span-2">{specimen.specimenType}</span>
          </div>
        </div>
      </div>

      {/* Main Report Body */}
      <main className="space-y-8">
        
        {/* Final Diagnosis - Placed at the top as per medical standard */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-300 pb-1 mb-3 uppercase">Final Diagnosis</h2>
          <div className="p-4 bg-blue-50 border-l-4 border-blue-600 rounded-r-md">
            <p className="text-gray-900 font-semibold whitespace-pre-wrap">{results.finalDiagnosis}</p>
            {results.icd10Code && (
              <p className="mt-2 text-sm text-gray-600">
                <span className="font-bold">ICD-10:</span> {results.icd10Code}
              </p>
            )}
          </div>
        </section>

        {/* Clinical Indication */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-300 pb-1 mb-3 uppercase">Clinical Indication</h2>
          <p className="text-gray-700 leading-relaxed">{specimen.clinicalIndication}</p>
        </section>

        {/* Gross Description */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-300 pb-1 mb-3 uppercase">Gross Description</h2>
          <p className="text-gray-700 leading-relaxed">{results.grossDescription}</p>
        </section>

        {/* Microscopic Description */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-300 pb-1 mb-3 uppercase">Microscopic Description</h2>
          <p className="text-gray-700 leading-relaxed">{results.microscopicDescription}</p>
        </section>

        {/* Comments/Notes */}
        {results.comments && (
          <section>
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-300 pb-1 mb-3 uppercase">Pathologist Comments</h2>
            <p className="text-gray-700 italic leading-relaxed">{results.comments}</p>
          </section>
        )}
      </main>

      {/* Footer / Signature */}
      <footer className="mt-16 pt-8 border-t border-gray-300 flex justify-end">
        <div className="text-center">
          <div className="w-64 border-b border-gray-800 mb-2">
            {/* If using an electronic signature image, insert <img src={sigUrl} /> here */}
            <p className="italic text-gray-400 py-2">Electronically Signed</p>
          </div>
          <p className="font-bold text-gray-900">{pathologistName}, {pathologistCredentials}</p>
          <p className="text-sm text-gray-500">Attending Pathologist</p>
        </div>
      </footer>
      
    </div>
  );
};

export default PathologyReport;