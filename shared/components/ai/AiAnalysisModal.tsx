import React, { useState } from 'react';
import { GlassModal } from '../common/GlassModal';
import { Badge } from '../common/Badge';
import { AiAnalysisRecord } from '../../services/api';
import { 
  Sparkles, 
  Brain, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  Database, 
  TrendingUp, 
  X, 
  Clock, 
  ChevronRight,
  ShieldCheck,
  Stethoscope,
  DollarSign
} from 'lucide-react';

interface AiAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: AiAnalysisRecord | null;
  isLoading: boolean;
  onRerun?: () => void;
  pastAnalyses?: AiAnalysisRecord[];
  title?: string;
}

export const AiAnalysisModal: React.FC<AiAnalysisModalProps> = ({
  isOpen,
  onClose,
  analysis,
  isLoading,
  onRerun,
  pastAnalyses = [],
  title = 'AI Clinical & Decision Intelligence'
}) => {
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');

  if (!isOpen) return null;

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return { bg: 'rgba(239, 68, 68, 0.12)', text: '#dc2626', border: 'rgba(239, 68, 68, 0.3)' };
      case 'HIGH': return { bg: 'rgba(249, 115, 22, 0.12)', text: '#ea580c', border: 'rgba(249, 115, 22, 0.3)' };
      case 'MODERATE': return { bg: 'rgba(245, 158, 11, 0.12)', text: '#d97706', border: 'rgba(245, 158, 11, 0.3)' };
      default: return { bg: 'rgba(16, 185, 129, 0.12)', text: '#059669', border: 'rgba(16, 185, 129, 0.3)' };
    }
  };

  const currentColors = analysis ? getRiskBadgeColor(analysis.riskLevel) : getRiskBadgeColor('LOW');

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500 font-normal">
              Machine-Assisted Acuity & Risk Synthesizer
            </p>
          </div>
        </div>
      }
      maxWidth="760px"
    >
      <div className="flex flex-col gap-4 text-slate-800">
        {/* Cloud DB Persistence Banner */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/20 text-xs">
          <div className="flex items-center gap-2 text-emerald-800 font-medium">
            <Database size={15} className="text-emerald-600 animate-pulse" />
            <span>MongoDB Atlas Persistent Cloud Storage: Collection <code className="bg-emerald-100/70 px-1 py-0.5 rounded text-emerald-900 font-mono">ai_analyses</code></span>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
            Live Atlas Active
          </span>
        </div>

        {/* Tab switcher if history exists */}
        {pastAnalyses.length > 0 && (
          <div className="flex gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setActiveTab('current')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'current'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Latest Analysis
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Past Runs History ({pastAnalyses.length})
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Activity size={36} className="text-indigo-600 animate-spin" />
            <p className="font-semibold text-sm">Synthesizing clinical signals and computing neural risk vectors...</p>
            <p className="text-xs text-slate-400">Querying real-time biomarkers, telemetry series, and persisting to MongoDB Atlas</p>
          </div>
        ) : activeTab === 'current' && analysis ? (
          <div className="flex flex-col gap-4">
            {/* Top Score & Acuity Card */}
            <div 
              className="p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              style={{ 
                background: currentColors.bg, 
                borderColor: currentColors.border 
              }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black shadow-sm"
                  style={{ 
                    background: 'white', 
                    color: currentColors.text,
                    border: `2px solid ${currentColors.border}`
                  }}
                >
                  <span className="text-2xl leading-none">{analysis.riskScore}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">/ 100</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span 
                      className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wide"
                      style={{ 
                        background: currentColors.text, 
                        color: 'white' 
                      }}
                    >
                      {analysis.riskLevel} ACUITY
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Type: {analysis.analysisType.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">
                    Target: {analysis.targetName}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Evaluated by {analysis.analyzedBy} • {new Date(analysis.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {onRerun && (
                <button
                  onClick={onRerun}
                  className="btn-primary text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5 self-stretch sm:self-auto justify-center"
                >
                  <Sparkles size={13} />
                  Re-evaluate Now
                </button>
              )}
            </div>

            {/* Executive Summary */}
            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Executive Synthesis
              </span>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {analysis.summary}
              </p>
            </div>

            {/* Key Findings & Recommendations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Key Findings */}
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex flex-col gap-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity size={13} className="text-indigo-600" />
                  Key Clinical & Operational Findings
                </span>
                <ul className="space-y-1.5">
                  {analysis.keyFindings.map((finding, idx) => (
                    <li key={idx} className="text-xs text-slate-700 flex items-start gap-1.5">
                      <ChevronRight size={13} className="text-slate-400 mt-0.5 shrink-0" />
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendations */}
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex flex-col gap-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-emerald-600" />
                  AI Suggested Interventions
                </span>
                <ul className="space-y-1.5">
                  {analysis.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-xs text-slate-700 flex items-start gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-500 mt-0.5 shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Contraindications if present */}
            {analysis.contraindications && analysis.contraindications.length > 0 && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert size={14} className="text-rose-600" />
                  Severe Drug Allergies & Clinical Contraindications
                </span>
                <ul className="space-y-1">
                  {analysis.contraindications.map((contra, idx) => (
                    <li key={idx} className="text-xs text-rose-700 font-semibold flex items-center gap-1.5">
                      <AlertTriangle size={13} className="text-rose-600 shrink-0" />
                      <span>{contra}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Evidence Weight Factors */}
            {analysis.evidenceFactors && analysis.evidenceFactors.length > 0 && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2">
                  Evidence Signal Attribution
                </span>
                <div className="flex flex-wrap gap-2">
                  {analysis.evidenceFactors.map((ef, idx) => (
                    <div 
                      key={idx} 
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 ${
                        ef.impact === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : ef.impact === 'ELEVATED'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      <span>{ef.factor}</span>
                      <span className="text-[10px] font-bold px-1 rounded bg-white/70">
                        +{ef.weight}pt
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Doctor Action Plan */}
            {analysis.doctorActionPlan && (
              <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider block">
                    Recommended Action Protocol
                  </span>
                  <p className="text-xs text-indigo-800 mt-0.5 font-medium">
                    {analysis.doctorActionPlan}
                  </p>
                </div>
                <Badge variant="indigo">Verified Rule</Badge>
              </div>
            )}
          </div>
        ) : activeTab === 'history' && pastAnalyses.length > 0 ? (
          <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-1">
            {pastAnalyses.map((rec) => {
              const colors = getRiskBadgeColor(rec.riskLevel);
              return (
                <div 
                  key={rec.id} 
                  className="p-3 rounded-xl border bg-white flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm"
                      style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
                    >
                      {rec.riskScore}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800">{rec.riskLevel} RISK</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500">{new Date(rec.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-1">{rec.summary}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">By {rec.analyzedBy}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400">
            <Sparkles size={36} className="mx-auto mb-2 opacity-40 text-indigo-500" />
            <p className="font-bold text-slate-600">No AI Analysis generated yet</p>
            <p className="text-xs mt-1">Click "Re-evaluate Now" to trigger live intelligence computation.</p>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-200">
          <button onClick={onClose} className="btn-secondary text-xs px-4 py-1.5">
            Close Panel
          </button>
        </div>
      </div>
    </GlassModal>
  );
};
