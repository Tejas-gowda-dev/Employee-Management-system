import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import api from '../services/api.js';
import { 
  User, 
  Camera, 
  FileText, 
  UploadCloud, 
  AlertCircle, 
  CheckCircle2, 
  DownloadCloud, 
  Eye,
  Briefcase,
  HelpCircle,
  FolderOpen
} from 'lucide-react';
import { motion } from 'motion/react';

export const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const [uploadingPf, setUploadingPf] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const pfInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingPf(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      const response = await api.post(`/users/${user.id}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.success) {
        setSuccess('Profile photo updated successfully!');
        await refreshUser(); // synchronous context sync
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload profile picture');
    } finally {
      setUploadingPf(false);
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingDoc(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('document', file);

    try {
      const response = await api.post(`/users/${user.id}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.success) {
        setSuccess('Document uploaded and archived successfully!');
        await refreshUser(); // sync
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to file document');
    } finally {
      setUploadingDoc(false);
    }
  };

  if (!user) return null;

  return (
    <div id="profile_page" className="max-w-4xl mx-auto space-y-6 font-sans">
      <div>
        <h1 className="text-4xl font-light font-serif text-ink italic tracking-tight">My Staff Identity</h1>
        <p className="text-xs text-sage uppercase tracking-widest mt-1.5 font-sans">Manage physical records, upload valid files, and inspect employment details.</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-start space-x-1.5 leading-normal animate-shake">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-[#E2E8D5] border border-[#A3AD9A]/30 rounded-2xl text-olive text-xs flex items-start space-x-1.5 leading-normal">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-olive" />
          <span>{success}</span>
        </div>
      )}

      {/* Main card grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Card - photo focus details */}
        <div className="bg-white border border-slate-100 rounded-[32px] p-6 flex flex-col items-center shadow-[0_4px_24px_rgba(0,0,0,0.015)]">
          <div className="relative group select-none">
            {user.profilePicture ? (
              <img
                referrerPolicy="no-referrer"
                src={user.profilePicture}
                alt={user.name}
                className="h-28 w-28 rounded-full object-cover border-2 border-olive shadow-md"
              />
            ) : (
              <div className="h-28 w-28 rounded-full bg-[#FAF9F6] hover:bg-cream text-sage font-serif font-bold text-4xl border-2 border-[#A3AD9A]/30 flex items-center justify-center shadow-md cursor-pointer">
                {user.name.charAt(0)}
              </div>
            )}
            
            <button
              id="btn_trigger_pf_upload"
              disabled={uploadingPf}
              onClick={() => pfInputRef.current?.click()}
              className="absolute bottom-0 right-0 h-9 w-9 bg-olive hover:opacity-95 text-white border-none rounded-full flex items-center justify-center cursor-pointer shadow-md active:scale-95 transition-all"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              type="file"
              ref={pfInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleProfilePictureUpload}
            />
          </div>

          <h3 className="font-serif font-semibold text-ink text-lg mt-4 text-center">{user.name}</h3>
          <span className="text-sage font-mono text-[10px] mt-0.5 block select-all">{user.email}</span>
          
          <div className="mt-4 flex flex-wrap gap-1.5 justify-center select-none">
            <span className="text-[9px] font-bold bg-[#FAF9F6] text-ink border border-[#A3AD9A]/20 px-2.5 py-0.5 rounded-full font-mono uppercase">
              {user.role}
            </span>
            <span className="text-[9px] font-bold bg-[#E2E8D5] text-olive border border-[#A3AD9A]/25 px-2.5 py-0.5 rounded-full font-mono uppercase">
              {user.department}
            </span>
          </div>

          <div className="w-full border-t border-cream mt-5 pt-4 text-xs space-y-2 text-sage font-medium">
            <div className="flex justify-between">
              <span>Enrollment:</span>
              <span className="text-ink font-mono font-bold">{user.joinDate}</span>
            </div>
            <div className="flex justify-between">
              <span>Staff ID:</span>
              <span className="text-ink font-mono font-bold select-all">#{user.id.substring(4)}</span>
            </div>
          </div>
        </div>

        {/* Right Pane (Takes 2 cols) - Full specifications registry */}
        <div className="md:col-span-2 space-y-6">
          {/* Section 1: details */}
          <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.015)]">
            <div className="flex items-center space-x-2 border-b border-[#FAF9F6] pb-3.5 mb-4">
              <Briefcase className="h-4 w-4 text-olive" />
              <h3 className="font-serif font-semibold text-ink text-sm">Employment Information</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-ink">
              <div className="p-3.5 bg-[#FAF9F6] border border-[#A3AD9A]/15 rounded-2xl">
                <span className="text-[10px] text-sage block uppercase mb-1 font-bold">Assigned Department</span>
                <span className="text-ink font-serif text-sm font-semibold">{user.department}</span>
              </div>

              <div className="p-3.5 bg-[#FAF9F6] border border-[#A3AD9A]/15 rounded-2xl">
                <span className="text-[10px] text-sage block uppercase mb-1 font-bold">Functional Designation</span>
                <span className="text-ink font-serif text-sm font-semibold">{user.role}</span>
              </div>

              <div className="p-3.5 bg-[#FAF9F6] border border-[#A3AD9A]/15 rounded-2xl">
                <span className="text-[10px] text-sage block uppercase mb-1 font-bold">Employment Date</span>
                <span className="text-ink font-mono font-semibold">{user.joinDate}</span>
              </div>

              <div className="p-3.5 bg-[#FAF9F6] border border-[#A3AD9A]/15 rounded-2xl">
                <span className="text-[10px] text-sage block uppercase mb-1 font-bold">Corporate Email</span>
                <span className="text-ink font-mono font-semibold select-all">{user.email}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Upload Documents */}
          <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.015)]">
            <div className="flex items-center justify-between border-b border-[#FAF9F6] pb-3.5 mb-4">
              <div className="flex items-center space-x-2">
                <FolderOpen className="h-4 w-4 text-olive" />
                <h3 className="font-serif font-semibold text-ink text-sm">Employee Vault Docs ({user.documents?.length || 0})</h3>
              </div>

              <button
                id="btn_trigger_doc_upload"
                disabled={uploadingDoc}
                onClick={() => docInputRef.current?.click()}
                className="px-4 py-2 bg-[#E2E8D5] hover:opacity-95 text-olive font-bold text-xs rounded-full flex items-center space-x-1 transition-colors cursor-pointer border-none"
              >
                <UploadCloud className="h-4 w-4" />
                <span>{uploadingDoc ? 'Uploading...' : 'Upload Doc'}</span>
              </button>
              <input
                type="file"
                ref={docInputRef}
                className="hidden"
                accept=".pdf,.doc,.docx,image/*"
                onChange={handleDocumentUpload}
              />
            </div>

            {user.documents && user.documents.length > 0 ? (
              <div className="space-y-2.5 text-xs font-semibold">
                {user.documents.map((doc, idx) => {
                  const isImage = /\.(jpeg|jpg|gif|png)$/i.test(doc.path);

                  return (
                    <div key={idx} className="p-3.5 bg-[#FAF9F6] border border-[#A3AD9A]/20 hover:border-[#A3AD9A]/40 rounded-2xl flex items-center justify-between gap-4 transition-colors">
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shrink-0 border border-[#A3AD9A]/20 text-sage">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-ink font-serif truncate leading-tight text-sm font-semibold">{doc.name}</p>
                          <span className="text-[9px] text-olive block mt-1 leading-none font-mono">Vault Path: {doc.path.substring(0, 30)}...</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        {isImage && (
                          <a
                            href={doc.path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-white hover:bg-cream border border-[#A3AD9A]/20 text-sage hover:text-olive rounded-full shrink-0 transition-colors"
                            title="Preview image"
                          >
                            <Eye className="h-4 w-4" />
                          </a>
                        )}
                        <a
                          href={doc.path}
                          download={doc.name}
                          className="p-2 bg-white hover:bg-cream border border-[#A3AD9A]/20 text-sage hover:text-olive rounded-full shrink-0 transition-colors"
                          title="Download document file"
                        >
                          <DownloadCloud className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-sage font-mono text-xs">
                Vault is currently empty. Upload offer letters, proof IDs or certifications.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
